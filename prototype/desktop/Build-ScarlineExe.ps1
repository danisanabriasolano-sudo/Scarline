$ErrorActionPreference = 'Stop'
$Desk = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $Desk
$Cs = Join-Path $Desk 'ScarlineLauncher\ScarlineLauncherFW.cs'
$Csc = Join-Path ${env:WINDIR} 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$Dist = Join-Path $Desk 'dist'
$Playtest = Join-Path $Root 'playtest'

Remove-Item -Recurse -Force $Dist -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $Dist | Out-Null

$ExeOut = Join-Path $Dist 'Scarline.exe'
$Refs = @(
  '/reference:System.Windows.Forms.dll',
  '/reference:System.Drawing.dll'
)
& $Csc /nologo /optimize+ "/out:$ExeOut" /target:winexe @Refs $Cs
Copy-Item -Recurse -Force $Playtest (Join-Path $Dist 'playtest')
@'
@echo off
title Scarline
cd /d "%~dp0"
start "" "%~dp0Scarline.exe"
'@ | Set-Content -Encoding ASCII (Join-Path $Dist 'Scarline-Jugar.bat')
Copy-Item (Join-Path $Dist 'Scarline.exe') (Join-Path $Desk 'Scarline.exe') -Force
Write-Host "Ejecutable: $Dist\Scarline.exe"