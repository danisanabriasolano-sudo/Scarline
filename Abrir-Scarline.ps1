# Abre Scarline: launcher jugable (siempre) + Unreal si está compilado
$Desktop = Join-Path $PSScriptRoot "prototype\desktop\dist\Scarline.exe"
$UeEditor = Join-Path $env:USERPROFILE "Epic Games\UE_5.8\Engine\Binaries\Win64\UnrealEditor.exe"
$Uproject = Join-Path $PSScriptRoot "Scarline_UE5\Scarline.uproject"

if (Test-Path $Desktop) {
  Start-Process -FilePath $Desktop -WorkingDirectory (Split-Path $Desktop)
} else {
  & (Join-Path $PSScriptRoot "prototype\desktop\Build-ScarlineExe.ps1")
  if (Test-Path $Desktop) { Start-Process $Desktop }
}

if ((Test-Path $UeEditor) -and (Test-Path $Uproject)) {
  $Dll = Join-Path (Split-Path $Uproject) "Binaries\Win64\UnrealEditor-Scarline.dll"
  if (Test-Path $Dll) {
    Start-Process -FilePath $UeEditor -ArgumentList "`"$Uproject`""
  }
}