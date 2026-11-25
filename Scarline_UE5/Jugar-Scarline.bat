@echo off
title Scarline UE5 — Jugar
set UE=C:\Users\Dynabook\Epic Games\UE_5.8
set PROJ=%~dp0Scarline.uproject
if not exist "%UE%\Engine\Binaries\Win64\UnrealEditor.exe" (
  echo No encuentro UE 5.8 en %UE%
  pause
  exit /b 1
)
echo.
echo ============================================
echo   SCARLINE — Unreal Engine 5.8
echo ============================================
echo   1. Espera a que abra el editor
echo   2. Pulsa PLAY verde o Alt+P
echo   El juego creara circuito + coche automatico
echo   (oculta el Landscape por defecto)
echo ============================================
echo.
start "" "%UE%\Engine\Binaries\Win64\UnrealEditor.exe" "%PROJ%"
exit /b 0