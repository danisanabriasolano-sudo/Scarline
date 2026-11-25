# Scarline en tu PC — estado automático

## Ya hecho por ti

| Paso | Estado |
|------|--------|
| Motor detectado | **UE 5.8** en `C:\Users\Dynabook\Epic Games\UE_5.8` |
| `Scarline.uproject` | `EngineAssociation` → **5.8** |
| Assets CC0 | GLB + texturas en `Content/ExternalAssets/` |
| Config UBT | `VisualStudio2026` (+ flag `-2026` en scripts) |
| **Scarline.exe** jugable | `prototype\desktop\dist\Scarline.exe` (Spectral GT + PBR) |
| Acceso directo | `OneDrive\Desktop\Scarline.lnk` |

## Bloqueado ahora: Smart App Control

Visual Studio ya está instalado (Community **18.x / 2026**). El bloqueo actual es:

**Control inteligente de aplicaciones = Activado** → impide cargar `ScarlineModuleRules.dll`.

Sigue **`Docs/COMPILAR_VS2026.md`** para desactivarlo y ejecutar:

```powershell
cd C:\Users\Dynabook\Projects\Scarline\Scarline_UE5\Tools
.\Setup-Scarline.ps1
```

## Jugar ahora (sin compilar UE)

Doble clic en **Escritorio → Scarline** o ejecuta:

`C:\Users\Dynabook\Projects\Scarline\prototype\desktop\dist\Scarline.exe`