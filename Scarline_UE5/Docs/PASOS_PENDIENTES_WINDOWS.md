# Scarline en tu PC — estado automático

## Ya hecho por ti

| Paso | Estado |
|------|--------|
| Motor detectado | **UE 5.8** en `C:\Users\Dynabook\Epic Games\UE_5.8` |
| `Scarline.uproject` | `EngineAssociation` → **5.8** |
| Assets CC0 | GLB + texturas en `Content/ExternalAssets/` |
| Config UBT | `VisualStudio2022` en BuildConfiguration |
| **Scarline.exe** jugable | `prototype\desktop\dist\Scarline.exe` (Spectral GT + PBR) |
| Acceso directo | `OneDrive\Desktop\Scarline.lnk` |

## Bloqueado (necesita un clic tuyo en UAC)

La compilación de **Unreal C++** falló porque faltan:

1. **Visual Studio 2022** (o Build Tools) con **C++** y **Windows SDK 10.0.22621**
2. El instalador **se canceló** (código 1602 = cerraste o bloqueaste el UAC)

### Una vez aceptes el instalador

En PowerShell **como administrador** (o acepta el popup de UAC):

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools -e --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

Luego:

```powershell
cd C:\Users\Dynabook\Projects\Scarline\Scarline_UE5\Tools
.\Setup-Scarline.ps1
```

Abre `Scarline.uproject` con UE 5.8.

## Jugar ahora (sin compilar UE)

Doble clic en **Escritorio → Scarline** o ejecuta:

`C:\Users\Dynabook\Projects\Scarline\prototype\desktop\dist\Scarline.exe`