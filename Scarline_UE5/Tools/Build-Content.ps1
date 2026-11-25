# Genera assets /Game (GLB, texturas, materiales) con UnrealEditor-Cmd
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Uproject = Join-Path $Root 'Scarline.uproject'
$UeRoot = "$env:USERPROFILE\Epic Games\UE_5.8"
$Editor = Join-Path $UeRoot 'Engine\Binaries\Win64\UnrealEditor-Cmd.exe'
$Py = Join-Path $PSScriptRoot 'Editor\BuildScarlineContent.py'

if (-not (Test-Path $Editor)) {
  Write-Host 'ERROR: Unreal Editor 5.8 no encontrado.'
  exit 1
}
if (Get-Process UnrealEditor -ErrorAction SilentlyContinue) {
  Write-Host 'Cierra Unreal Editor antes de Build-Content.'
  exit 1
}

Write-Host 'Importando contenido Scarline (/Game)...'
& $Editor $Uproject -unattended -nop4 -nosplash `
  -ExecutePythonScript="$Py" `
  -log=BuildScarlineContent.log

if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: Editor-Cmd salió con $LASTEXITCODE — revisa $Root\Saved\Logs\BuildScarlineContent.log"
  exit $LASTEXITCODE
}
Write-Host 'Contenido /Game generado.'