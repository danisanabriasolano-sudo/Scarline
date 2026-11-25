# Compila, empaqueta si hace falta y lanza Scarline nativo
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Exe = Join-Path $Root 'Builds\Windows\Scarline\Binaries\Win64\Scarline.exe'
if (-not (Test-Path $Exe)) { $Exe = Join-Path $Root 'Builds\Windows\Scarline.exe' }

Get-Process Scarline,UnrealEditor -ErrorAction SilentlyContinue | Stop-Process -Force
& (Join-Path $PSScriptRoot 'Setup-Scarline.ps1')
& (Join-Path $PSScriptRoot 'Build-Scarline.ps1')
if (-not (Test-Path $Exe)) { Write-Host "No se generó $Exe"; exit 1 }
Start-Process $Exe
Write-Host "Lanzado: $Exe"