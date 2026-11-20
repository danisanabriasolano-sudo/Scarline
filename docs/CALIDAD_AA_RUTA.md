# Scarline — cómo llegar a calidad AA/AAA (honesto)

## Lo que tienes ahora

| Capa | Rol | Techo visual |
|------|-----|----------------|
| **Playtest web (BUILD 2.0)** | Probar física, takedowns, circuitos, controles | **Indie pulido en navegador** — no consola AAA |
| **Scarline_UE5** | Producto final PS4/5 + móvil | **AA/AAA** con Lumen/Nanite, VFX Niagara, audio, cinemáticas |

El navegador **nunca** será Burnout 3 en PS2 ni un Forza: no hay deformación de malla de producción, ni millones de polígonos, ni iluminación de salto de feil del motor.

## Qué cambió en BUILD 2.0 (web)

- Cielo HDR (IBL Poly Haven) + grading de color
- **Curvas rojo/blanco continuas** (sin cajas flotantes)
- Fachadas con ventanas iluminadas, **multitud en graderías**
- Coches GLB más grandes; calidad alta por defecto (`?quality=low` solo si lo pides)
- Post: bloom + SSAO (alta) + saturación/contraste

## Pasos para AAA real (tu máquina)

1. **Instalar Visual Studio 2022 Build Tools** (carga de trabajo C++). Sin esto UE no compila.
2. Ejecutar `Scarline_UE5\Tools\Setup-Scarline.ps1`
3. Abrir `Scarline.uproject` en UE 5.8
4. Importar assets en `Content/ExternalAssets/` → materiales master, LODs, Niagara para takedown/wrecked
5. Contratar o integrar pack de circuito + crowds (Marketplace / Fab) — los cubos procedurales son solo placeholder

## Playtest

```text
prototype\desktop\dist\Scarline-Jugar.bat
```

Ctrl+F5 siempre tras actualizar. URL con calidad: `?quality=high` o `?quality=low`.