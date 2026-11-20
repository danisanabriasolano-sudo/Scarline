$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Out = Join-Path $PSScriptRoot 'dist'
$Proj = Join-Path $PSScriptRoot 'ScarlineLauncher\ScarlineLauncher.csproj'

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
  Write-Host 'Instala .NET 8 SDK para compilar Scarline.exe'
  exit 1
}

Remove-Item -Recurse -Force $Out -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $Out | Out-Null

dotnet publish $Proj -c Release -r win-x64 --self-contained true `
  -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true `
  -o $Out

$playtest = Join-Path $Root 'playtest'
Copy-Item -Recurse -Force $playtest (Join-Path $Out 'playtest')
Copy-Item (Join-Path $Out 'Scarline.exe') (Join-Path $PSScriptRoot 'Scarline.exe') -Force

Write-Host ""
Write-Host "Listo: $Out\Scarline.exe"
Write-Host "Copia tambien: $PSScriptRoot\Scarline.exe"