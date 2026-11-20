# Package Scarline for Windows (requires Unreal Engine 5.5 + Visual Studio 2022)
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Uproject = Join-Path $Root 'Scarline.uproject'

$UeCandidates = @(
  "$env:USERPROFILE\Epic Games\UE_5.8",
  "$env:USERPROFILE\Epic Games\UE_5.7",
  "$env:USERPROFILE\Epic Games\UE_5.6",
  "${env:ProgramFiles}\Epic Games\UE_5.8",
  "${env:ProgramFiles}\Epic Games\UE_5.5"
)
$UeRoot = $UeCandidates | Where-Object { Test-Path (Join-Path $_ 'Engine\Build\BatchFiles\RunUAT.bat') } | Select-Object -First 1
if (-not $UeRoot) {
  Write-Host 'ERROR: Unreal Engine 5.5 no encontrado.'
  Write-Host 'Instala UE 5.5 desde Epic Games Launcher, abre Scarline.uproject una vez,'
  Write-Host 'luego vuelve a ejecutar este script para generar Scarline.exe'
  exit 1
}

$Out = Join-Path $Root 'Builds\Windows'
New-Item -ItemType Directory -Force -Path $Out | Out-Null
$Uat = Join-Path $UeRoot 'Engine\Build\BatchFiles\RunUAT.bat'

Write-Host "Empaquetando con: $UeRoot"
& $Uat BuildCookRun `
  -project="$Uproject" `
  -noP4 -platform=Win64 -clientconfig=Development -serverconfig=Development `
  -cook -build -stage -pak -archive -archivedirectory="$Out" `
  -utf8output

$Game = Get-ChildItem -Path $Out -Filter Scarline.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if ($Game) {
  Write-Host "Listo: $($Game.FullName)"
} else {
  Write-Host "Build terminado; revisa $Out"
}