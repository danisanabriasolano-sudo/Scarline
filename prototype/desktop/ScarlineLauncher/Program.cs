using System.Diagnostics;
using System.Net;
using System.Text;

string playtestRoot = ResolvePlaytestRoot();
if (!File.Exists(Path.Combine(playtestRoot, "index.html")))
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine("No se encontro la carpeta playtest junto a Scarline.exe");
    Console.ResetColor();
    Pause();
    return 1;
}

int[] ports = { 8844, 8765, 9090, 8080 };
HttpListener? listener = null;
int port = 0;

foreach (int p in ports)
{
    var candidate = new HttpListener();
    candidate.Prefixes.Add($"http://127.0.0.1:{p}/");
    try
    {
        candidate.Start();
        listener = candidate;
        port = p;
        break;
    }
    catch
    {
        candidate.Close();
    }
}

if (listener is null)
{
    Console.WriteLine("No se pudo abrir un puerto local.");
    Pause();
    return 1;
}

string url = $"http://127.0.0.1:{port}/index.html";
Console.WriteLine("SCARLINE — Contact Racing");
Console.WriteLine($"Sirviendo: {playtestRoot}");
Console.WriteLine($"Abre: {url}");
Console.WriteLine("Mantén esta ventana abierta mientras juegas.");
Console.WriteLine();

try
{
    Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
}
catch (Exception ex)
{
    Console.WriteLine($"Abre manualmente: {url} ({ex.Message})");
}

Console.CancelKeyPress += (_, e) => { e.Cancel = true; listener.Stop(); };
while (listener.IsListening)
{
    try
    {
        var ctx = await listener.GetContextAsync();
        _ = Task.Run(() => Handle(ctx, playtestRoot));
    }
    catch when (!listener.IsListening) { break; }
    catch (Exception ex) { Console.WriteLine(ex.Message); }
}

return 0;

static string ResolvePlaytestRoot()
{
    string exeDir = AppContext.BaseDirectory;
    string[] candidates =
    {
        Path.Combine(exeDir, "playtest"),
        Path.GetFullPath(Path.Combine(exeDir, "..", "playtest")),
        Path.GetFullPath(Path.Combine(exeDir, "..", "..", "playtest")),
        @"C:\Users\Dynabook\Projects\Scarline\prototype\playtest",
    };
    foreach (string c in candidates)
        if (Directory.Exists(c)) return c;
    return Path.Combine(exeDir, "playtest");
}

static void Handle(HttpListenerContext ctx, string root)
{
    try
    {
        string path = ctx.Request.Url?.LocalPath ?? "/";
        if (path is "/" or "") path = "/index.html";
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
        ctx.Response.ContentType = ext switch
        {
            ".html" => "text/html; charset=utf-8",
            ".js" => "text/javascript; charset=utf-8",
            ".css" => "text/css; charset=utf-8",
            ".glb" => "model/gltf-binary",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            _ => "application/octet-stream",
        };
        ctx.Response.OutputStream.Write(bytes, 0, bytes.Length);
        ctx.Response.Close();
    }
    catch
    {
        try { ctx.Response.Abort(); } catch { /* ignore */ }
    }
}

static void Pause()
{
    Console.WriteLine("Pulsa Enter para cerrar.");
    Console.ReadLine();
}