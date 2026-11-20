# Servidor local minimo para modulos ES (Three.js)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
# Puertos bajos (8080/8844) suelen estar reservados por http.sys (PID 4) — usar rango alto primero
$ports = 49521..49545
if ($env:SCARLINE_PORT) { $ports = @([int]$env:SCARLINE_PORT) + $ports }
$listener = New-Object System.Net.HttpListener
$port = $null
foreach ($p in $ports) {
  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add("http://127.0.0.1:$p/")
  try {
    $listener.Start()
    $port = $p
    break
  } catch {
    $listener.Close()
  }
}
if (-not $port) {
  Write-Host "ERROR: no se pudo abrir ningun puerto (probado: $($ports -join ', '))."
  exit 1
}
$url = "http://127.0.0.1:$port/index.html"
$portFile = Join-Path $root ".scarline-port"
Set-Content -Path $portFile -Value $port -Encoding ascii
Write-Host "Scarline playtest: $url"
Write-Host "Mantén esta ventana abierta. Ctrl+C para detener."
try { Start-Process $url } catch { Write-Host "Abre manualmente: $url" }

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = $ctx.Request.Url.LocalPath
  if ($path -eq "/") { $path = "/index.html" }
  $file = Join-Path $root ($path.TrimStart("/") -replace "/", [IO.Path]::DirectorySeparatorChar)
  if (Test-Path $file -PathType Leaf) {
    $bytes = [IO.File]::ReadAllBytes($file)
    $ext = [IO.Path]::GetExtension($file).ToLower()
    $mime = switch ($ext) {
      ".html" { "text/html; charset=utf-8" }
      ".js"   { "text/javascript; charset=utf-8" }
      ".css"  { "text/css; charset=utf-8" }
      ".jpg"  { "image/jpeg" }
      ".jpeg" { "image/jpeg" }
      ".png"  { "image/png" }
      ".glb"  { "model/gltf-binary" }
      default { "application/octet-stream" }
    }
    $ctx.Response.ContentType = $mime
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.Close()
}
