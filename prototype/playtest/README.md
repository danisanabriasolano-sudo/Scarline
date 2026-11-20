# SCARLINE — CONTACT RACING v1.0

Prototipo de carreras arcade 3D en navegador, basado en Three.js. Esta versión consolida la conducción, los tres circuitos, el aspecto de los vehículos, el HUD y el sistema de daños en un único build.

## Ejecutar

1. Descomprime el proyecto completo.
2. Abre `Scarline/prototype/playtest` en Cursor o el Explorador.
3. Ejecuta `start.bat` (Windows) o sirve la carpeta con un servidor HTTP local.
4. Abre `http://127.0.0.1:8080/index.html`.

Se requiere conexión a Internet para descargar Three.js desde jsDelivr, tal como en el prototipo anterior.

## Controles

| Acción | Teclado | Mando estándar |
|---|---|---|
| Acelerar | W / Flecha arriba | Gatillo derecho |
| Frenar | S / Flecha abajo | Gatillo izquierdo |
| Girar | A / D o flechas | Stick izquierdo |
| Boost / embestida | X | Botón inferior (A / X) |
| Cambiar coche | C | — |
| Circuito | 1, 2 o 3 | — |
| Reiniciar carrera | R | — |

## Contenido v1.0

### Circuitos
- Tres trazados cerrados con geometría suavizada por spline, rectas largas, frenadas, horquillas y sectores enlazados: Scarline GP, Coastal Ring e Industrial Port.
- Superficie de asfalto con textura procedural, hombros, bordes pintados, pianos, barreras, parrilla de salida y referencias visuales de frenada.
- Ambientación específica: pit/gradas y vegetación para Scarline GP; costa, arena, agua y palmeras para Coastal Ring; contenedores, grúas y almacenes para Industrial Port.

### Vehículos
- Cuatro clases con siluetas, dimensiones, colores y rendimiento diferenciados: Hatch RS, Muscle V8, GT-7 y Proto-X.
- Carrocería procedural de mayor resolución, cabina acristalada, tomas de aire, parrilla, faros, pilotos, faldones, espejos, alerones, escapes, frenos, discos, pinzas y llantas.
- HUD revisado con velocidad, condición de carrocería, porcentaje de daño y boost.
- Compatibilidad básica con mandos estándar vía Gamepad API, además de teclado.

### Colisiones y daños
- Deformación localizada persistente de la malla de carrocería con más vértices para que el hundimiento sea más legible.
- Marcas oscuras y arañazos alrededor del punto de impacto.
- Paragolpes desprendibles; capó y puertas pueden salir despedidos en impactos fuertes; las ruedas pueden desprenderse en golpes extremos.
- Parabrisas agrietado, chispas, humo de impacto, humo persistente en coches muy dañados y sacudida de cámara.
- Daño acumulado durante la carrera y restauración completa al reiniciar.

## Alcance técnico honesto

Los vehículos y escenarios son modelos procedurales creados con geometría Three.js; no se incluyen modelos comerciales externos ni escaneos de coches reales. La deformación y desprendimiento son efectos arcade por umbrales, no simulación estructural FEM/nodal como BeamNG. Las físicas, IA y colisiones siguen siendo las de un prototipo jugable y requieren pruebas de balance y rendimiento en equipos reales. El proyecto está preparado como playtest web; no es todavía un ejecutable de PS4/PS5 ni una build móvil nativa.
