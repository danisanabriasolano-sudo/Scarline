@echo off
title Scarline — Contact Racing
cd /d "%~dp0playtest"
if not exist "index.html" (
  echo No encuentro playtest en %~dp0
  pause
  exit /b 1
)
start "Scarline Server" powershell -NoExit -ExecutionPolicy Bypass -NoProfile -File "%~dp0playtest\serve.ps1"
echo Esperando servidor...
timeout /t 3 /nobreak >nul
if exist "%~dp0playtest\.scarline-port" (
  set /p PORT=<"%~dp0playtest\.scarline-port"
  start "" "http://127.0.0.1:%PORT%/index.html"
) else (
  start "" "http://127.0.0.1:49521/index.html"
)
echo Si no carga, mira la ventana "Scarline Server" para la URL correcta.
timeout /t 4