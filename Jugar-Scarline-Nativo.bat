@echo off
title Scarline - UE5 Nativo
cd /d "%~dp0Scarline_UE5\Builds\Windows"
if not exist "Scarline.exe" (
  echo No se encuentra Scarline.exe en %CD%
  pause
  exit /b 1
)
start "" "Scarline.exe"
