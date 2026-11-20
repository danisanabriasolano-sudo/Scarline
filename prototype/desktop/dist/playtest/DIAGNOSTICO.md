# Scarline playtest — diagnóstico (¿PC lenta o assets pesados?)

## Peso real de los datos

| Asset | Tamaño aprox. |
|-------|----------------|
| Spectral GT (GLB) | ~4,5 MB |
| Asfalto 2K (4 mapas) | ~12 MB |
| Césped 1K | ~1,8 MB |
| **Total** | **~15 MB** |

**No es pesado** para un PC moderno (menos que una sola foto RAW). Si tu máquina abre Chrome y YouTube, **debería cargar**.

## Por qué a veces “no se ven” los coches

1. **Este slice es navegador + Three.js**, no Unreal: el GLB se clona 4 veces (jugador + rivales).
2. Si algún archivo da **404**, el juego cae al modo de cajas grises.
3. **SSAO + sombras 4K + bloom** pueden bajar FPS en PCs con pocos núcleos; parece “que no carga” pero es bajo framerate.
4. **Ctrl+F5** obligatorio tras actualizar; si no, el JS viejo sigue en caché.

## Cómo comprobar en 10 segundos

1. Al cargar debe decir **「SPECTRAL GT · ASSETS OK · ~15MB」** (o CALIDAD BAJA).
2. F12 → pestaña **Red**: `Spectral_GT_RS_CC0.glb` y JPG deben ser **200**, no 404.
3. Si va lento: abre con `?quality=low` en la URL.
4. Si quieres más calidad: `?quality=high`

Ejemplo: `http://127.0.0.1:49521/index.html?quality=high`

## Límite honesto de este prototipo

- **No es UE5**: no hay Lumen, Niagara ni deformación BeamNG aquí.
- El circuito usa **geometría modular** + graderías/edificios **procedurales** (no mesh de circuito real escaneado).
- El juego comercial en **Scarline_UE5** + assets importados es donde llega el nivel consola/PC.

## Efectos Burnout (BUILD 1.4)

- **TAKEDOWN!** — cámara lenta breve, banner, líneas de velocidad, humo extra al empujar con boost.
- **WRECKED!** — si te destruyen con boost rival o muro fuerte con mucho daño (desaturado pantalla).