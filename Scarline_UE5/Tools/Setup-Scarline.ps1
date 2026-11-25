# Scarline — detectar UE, generar .sln y compilar (MSVC / VS 2026)
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Uproject = Join-Path $Root 'Scarline.uproject'

$UeRoots = @(
  "$env:USERPROFILE\Epic Games\UE_5.8",
  "$env:USERPROFILE\Epic Games\UE_5.7",
  "$env:USERPROFILE\Epic Games\UE_5.6",
  "${env:ProgramFiles}\Epic Games\UE_5.8",
  "${env:ProgramFiles}\Epic Games\UE_5.7",
  "${env:ProgramFiles}\Epic Games\UE_5.6",
  "${env:ProgramFiles}\Epic Games\UE_5.5"
) | Where-Object { Test-Path "$_\Engine\Binaries\Win64\UnrealEditor.exe" }

$UeList = @($UeRoots)
if (-not $UeList.Length) {
  Write-Host 'Unreal Engine no encontrado. Usa Scarline.exe de prototype\desktop\dist'
  exit 1
}

$Ue = $UeList[0]
$Dotnet = Join-Path $Ue 'Engine\Binaries\ThirdParty\DotNet\10.0\win-x64\dotnet.exe'
$UbtDll = Join-Path $Ue 'Engine\Binaries\DotNET\UnrealBuildTool\UnrealBuildTool.dll'
$Build = Join-Path $Ue 'Engine\Build\BatchFiles\Build.bat'
Write-Host "UE: $Ue"

& $Dotnet $UbtDll -projectfiles -project="$Uproject" -game -rocket -progress -2026
& $Build ScarlineEditor Win64 Development -Project="$Uproject" -WaitMutex -FromMsBuild -2026

Write-Host "Abre: $Uproject"