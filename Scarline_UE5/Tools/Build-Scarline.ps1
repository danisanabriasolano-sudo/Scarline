# Empaqueta Scarline.exe (Windows) — UE 5.8 + mapa Entry + bootstrap en GameMode
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Uproject = Join-Path $Root 'Scarline.uproject'

$UeCandidates = @(
  "$env:USERPROFILE\Epic Games\UE_5.8",
  "$env:USERPROFILE\Epic Games\UE_5.7",
  "${env:ProgramFiles}\Epic Games\UE_5.8"
) | Where-Object { Test-Path (Join-Path $_ 'Engine\Build\BatchFiles\RunUAT.bat') }

$UeList = @($UeCandidates)
if (-not $UeList.Length) {
  Write-Host 'ERROR: Unreal Engine 5.8 no encontrado.'
  exit 1
}
$UeRoot = $UeList[0]
$Out = Join-Path $Root 'Builds\Windows'
New-Item -ItemType Directory -Force -Path $Out | Out-Null
$Uat = Join-Path $UeRoot 'Engine\Build\BatchFiles\RunUAT.bat'

Write-Host "Empaquetando con: $UeRoot (puede tardar 20-60 min)"
$ContentScript = Join-Path $PSScriptRoot 'Build-Content.ps1'
if (Test-Path $ContentScript) {
  Write-Host 'Generando assets /Game (import GLB/texturas)...'
  & $ContentScript
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'AVISO: Build-Content falló; se usará placeholder si no hay /Game.'
  }
}
$editor = Get-Process UnrealEditor -ErrorAction SilentlyContinue
if ($editor) {
  Write-Host 'Cierra Unreal Editor antes de empaquetar.'
  exit 1
}

$BuildBat = Join-Path $UeRoot 'Engine\Build\BatchFiles\Build.bat'
Write-Host 'Compilando Scarline (DisableUnity)...'
& $BuildBat Scarline Win64 Development -Project="$Uproject" -DisableUnity -WaitMutex -2026
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: compilación falló (exit $LASTEXITCODE)"
  exit $LASTEXITCODE
}

& $Uat BuildCookRun `
  -project="$Uproject" `
  -noP4 -platform=Win64 -clientconfig=Development `
  -cook -build -stage -pak -archive -archivedirectory="$Out" `
  -map=/Engine/Maps/Entry `
  -WaitMutex `
  -utf8output -2026

if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: BuildCookRun falló (exit $LASTEXITCODE). Cierra Scarline.exe y reintenta."
  exit $LASTEXITCODE
}
$Game = Get-ChildItem -Path $Out -Filter Scarline.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if ($Game) {
  Write-Host "Listo: $($Game.FullName)"
  $shortcut = Join-Path $Out 'Jugar-Scarline-Nativo.bat'
  @"
@echo off
title Scarline - UE5 Nativo
cd /d "%~dp0"
if not exist "Scarline.exe" (
  echo No se encuentra Scarline.exe en %CD%
  pause
  exit /b 1
)
start "" "Scarline.exe"
"@ | Set-Content -Encoding ASCII $shortcut
  $RepoRoot = Split-Path -Parent $Root
  $rootBat = Join-Path $RepoRoot 'Jugar-Scarline-Nativo.bat'
  @"
@echo off
title Scarline - UE5 Nativo
cd /d "%~dp0Scarline_UE5\Builds\Windows"
if not exist "Scarline.exe" (
  echo No se encuentra Scarline.exe en %CD%
  pause
  exit /b 1
)
start "" "Scarline.exe"
"@ | Set-Content -Encoding ASCII $rootBat
} else {
  Write-Host "Revisa log en $Out"
  exit 1
}