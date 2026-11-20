@echo off
title Scarline Contact Racing v1.0 Server
cd /d "%~dp0"
echo.
echo  Scarline v1.0 - servidor local (deja esta ventana ABIERTA)
echo  Mira la URL que muestra la ventana (puerto 8080 u otro si esta ocupado).
echo.
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0serve.ps1"
echo.
echo  El servidor se detuvo. Pulsa una tecla para cerrar.
pause >nul
