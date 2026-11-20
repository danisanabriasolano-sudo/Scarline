# Scarline — ejecutable de escritorio (BUILD 1.1)

## Jugar ahora

Doble clic en:

`prototype\desktop\dist\Scarline.exe`

(O `prototype\desktop\Scarline.exe` — copia del mismo build)

Se abre el navegador con el slice jugable (coche **Spectral GT RS** CC0 + asfalto **Clean Asphalt** PBR, 2 vueltas en Scarline GP).

**No cierres** la ventana negra de consola mientras juegas.

## Regenerar el .exe

```powershell
cd C:\Users\Dynabook\Projects\Scarline\prototype\desktop
powershell -ExecutionPolicy Bypass -File .\Build-ScarlineExe.ps1
```

## Unreal Engine 5 (juego nativo AAA)

En esta PC **no hay Unreal Engine instalado**, así que no se puede generar aquí el `.exe` de UE todavía.

1. Instala **Unreal Engine 5.5** y Visual Studio 2022 (C++).
2. Los assets CC0 ya están en `Scarline_UE5\Content\ExternalAssets\`.
3. Guía: `Scarline_UE5\Docs\INTEGRATION.md`
4. Empaquetar: `Scarline_UE5\Tools\Build-Scarline.ps1`