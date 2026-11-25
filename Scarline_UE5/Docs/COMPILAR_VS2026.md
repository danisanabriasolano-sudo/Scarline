# Compilar Scarline (UE 5.8 + Visual Studio 2026)

## Tu PC ahora

| Componente | Estado |
|------------|--------|
| Unreal Engine 5.8 | OK |
| Visual Studio 2026 (18.x Community) + MSVC 14.52 | OK |
| Windows SDK 10.0.26100 | OK |
| `Scarline.sln` / `Scarline.slnx` | Generados |
| **Smart App Control** | **ON — bloquea la compilación** |

## Error que verás si SAC sigue activo

```text
ScarlineModuleRules.dll ... Una directiva de Control de aplicaciones bloqueó este archivo. (0x800711C7)
```

Unreal compila reglas C# en `Intermediate\Build\BuildRules\*.dll`. **Control inteligente de aplicaciones** de Windows las trata como no fiables.

## Arreglo (una vez)

1. **Configuración de Windows** → **Privacidad y seguridad** → **Seguridad de Windows** → **Control de aplicaciones y explorador**
2. **Configuración de Control inteligente de aplicaciones** → **Desactivar**
   - Si no puedes desactivarlo, primero **Modo de evaluación** y luego apágalo (Microsoft solo permite desactivar SAC sin reinstalar Windows en ciertos estados).
3. Reinicia el PC (recomendado).
4. En PowerShell:

```powershell
cd C:\Users\Dynabook\Projects\Scarline\Scarline_UE5\Tools
.\Setup-Scarline.ps1
```

El script usa el compilador **-2026** (no VS 2022).

5. O doble clic en `Scarline.uproject` y pulsa **Sí** a compilar módulos C++.

## Abrir el editor sin compilar a mano

```powershell
& "C:\Users\Dynabook\Epic Games\UE_5.8\Engine\Binaries\Win64\UnrealEditor.exe" `
  "C:\Users\Dynabook\Projects\Scarline\Scarline_UE5\Scarline.uproject"
```

## Cambios ya aplicados en el repo

- `Saved/UnrealBuildTool/BuildConfiguration.xml` → **VisualStudio2026**
- `ScarlineEditor.Target.cs` → `bOverrideBuildEnvironment = true` (motor instalado)
- `IncludeOrderVersion` → **Unreal5_8**
- `Tools/Setup-Scarline.ps1` → genera solución y compila con **-2026**