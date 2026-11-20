using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Scarline
{
    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            string playtest = ResolvePlaytestRoot();
            if (!File.Exists(Path.Combine(playtest, "index.html")))
            {
                MessageBox.Show(
                    "No encuentro la carpeta playtest junto a Scarline.exe.\n\nReinstala desde:\nProjects\\Scarline\\prototype\\desktop\\Build-ScarlineExe.ps1",
                    "Scarline",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                return;
            }

            int[] ports = new int[30];
            for (int i = 0; i < ports.Length; i++) ports[i] = 49521 + i;
            HttpListener listener = null;
            int port = 0;
            foreach (int p in ports)
            {
                var l = new HttpListener();
                l.Prefixes.Add("http://127.0.0.1:" + p + "/");
                try
                {
                    l.Start();
                    listener = l;
                    port = p;
                    break;
                }
                catch
                {
                    l.Close();
                }
            }

            if (listener == null)
            {
                MessageBox.Show(
                    "No pude abrir el servidor local.\nPrueba Scarline-Jugar.bat como administrador una vez.",
                    "Scarline",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);
                return;
            }

            string url = "http://127.0.0.1:" + port + "/index.html";

            Task.Run(() =>
            {
                while (listener.IsListening)
                {
                    try
                    {
                        var ctx = listener.GetContext();
                        Task.Run(() => Handle(ctx, playtest));
                    }
                    catch { if (!listener.IsListening) break; }
                }
            });

            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch
            {
                Clipboard.SetText(url);
                MessageBox.Show("Abre en el navegador:\n" + url + "\n(URL copiada)", "Scarline", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }

            var tray = new NotifyIcon
            {
                Visible = true,
                Text = "Scarline",
                Icon = System.Drawing.SystemIcons.Application,
            };
            tray.BalloonTipTitle = "Scarline";
            tray.BalloonTipText = "Jugando en " + url;
            tray.ShowBalloonTip(3000);
            tray.ContextMenu = new ContextMenu(new[]
            {
                new MenuItem("Abrir juego", (_, __) => Process.Start(new ProcessStartInfo(url) { UseShellExecute = true })),
                new MenuItem("Salir", (_, __) => { tray.Visible = false; listener.Stop(); Application.Exit(); }),
            });

            Application.Run(new TrayContext(listener, tray));
        }

        private sealed class TrayContext : ApplicationContext
        {
            public TrayContext(HttpListener listener, NotifyIcon tray)
            {
                tray.DoubleClick += (_, __) => tray.ContextMenu.MenuItems[0].PerformClick();
                Application.ApplicationExit += (_, __) =>
                {
                    tray.Visible = false;
                    try { listener.Stop(); } catch { }
                };
            }
        }

        private static string ResolvePlaytestRoot()
        {
            string exeDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
            string[] candidates =
            {
                Path.Combine(exeDir, "playtest"),
                Path.GetFullPath(Path.Combine(exeDir, "..", "playtest")),
                @"C:\Users\Dynabook\Projects\Scarline\prototype\playtest",
                @"C:\Users\Dynabook\Projects\Scarline\prototype\desktop\dist\playtest",
            };
            foreach (string c in candidates)
                if (Directory.Exists(c) && File.Exists(Path.Combine(c, "index.html"))) return c;
            return Path.Combine(exeDir, "playtest");
        }

        private static void Handle(HttpListenerContext ctx, string root)
        {
            try
            {
                string path = ctx.Request.Url.LocalPath;
                if (path == "/" || path == "") path = "/index.html";
                string rel = path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                string file = Path.GetFullPath(Path.Combine(root, rel));
                if (!file.StartsWith(root, StringComparison.OrdinalIgnoreCase) || !File.Exists(file))
                {
                    ctx.Response.StatusCode = 404;
                    ctx.Response.Close();
                    return;
                }
                byte[] bytes = File.ReadAllBytes(file);
                string ext = Path.GetExtension(file).ToLowerInvariant();
                string mime = "application/octet-stream";
                if (ext == ".html") mime = "text/html; charset=utf-8";
                else if (ext == ".js") mime = "text/javascript; charset=utf-8";
                else if (ext == ".css") mime = "text/css; charset=utf-8";
                else if (ext == ".jpg" || ext == ".jpeg") mime = "image/jpeg";
                else if (ext == ".png") mime = "image/png";
                else if (ext == ".glb") mime = "model/gltf-binary";
                ctx.Response.ContentType = mime;
                ctx.Response.AddHeader("Access-Control-Allow-Origin", "*");
                ctx.Response.OutputStream.Write(bytes, 0, bytes.Length);
                ctx.Response.Close();
            }
            catch
            {
                try { ctx.Response.Abort(); } catch { }
            }
        }
    }
}