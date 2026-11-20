# Scarline: Contact Racing — Game Design Document

| Campo | Valor |
|--------|--------|
| **Versión** | 0.2 (pre-producción) |
| **Fecha** | 6 de octubre de 2026 |
| **Plataformas (v1)** | PlayStation 4, PlayStation 5, iOS, Android |
| **Género** | Carreras arcade / contacto / UGC |
| **Motor** | Unreal Engine 5 |
| **Cross-play** | Sí (PS4, PS5, móvil — misma cuenta Scarline) |
| **Referentes** | Burnout (energía, boost, takedowns), iRacing Arcade (peso en curva, accesible), BeamNG (deformación y rozones — fantasía visual/física, no sim) |

---

## 1. Visión y fantasía del jugador

**Scarline** es un juego de carreras en **circuitos cerrados** donde el contacto es parte del meta: rozar, empujar y derribar rivales genera **boost y espectáculo**, mientras el coche **se marca** con abolladuras y piezas dañadas. De vez en cuando, eventos y DLC ofrecen **tramos abiertos** tipo sprint por checkpoints.

El jugador siente: *“Voy rápido, peleo por posición, mi coche es único al final de la carrera — y puedo diseñar la pista de la semana.”*

**No es:** simulador de aerodinámica, licencias oficiales de marcas o circuitos, open world completo.

**Sí es:** arcade legible en móvil, profundidad en mando/volante, comunidad alrededor del **Crea tu circuito**, economía de DLC accesible.

---

## 2. Pilares de diseño

1. **Contacto con reglas claras** — Takedowns y empujones recompensados; límites anti-griefing en ranked (penalizaciones por empujes repetidos en zonas lentas, etc.).
2. **Daño visible, penalización moderada** — Deformación por zonas (estilo BeamNG en presentación); el manejo se resiente **un poco**, sin sim de aero ni tiempos de vuelta arruinados por un roce leve.
3. **Circuitos cerrados primero** — Layouts combativos; open road como **modo/evento** ocasional.
4. **UGC como columna vertebral** — Editor arcade, compartir, copas de comunidad; **DLC de piezas de editor a $0.50**.
5. **Cross-play real** — Misma progresión; partidas unificadas con normalización de asistencias donde haga falta.

---

## 3. Público objetivo

- Jugadores de **arcade racing** (Burnout, Need for Speed tradicional, iRacing Arcade).
- Público **móvil** en sesiones de 3–8 minutos con progresión compartida.
- Creators que disfrutan **Trackmania / Hot Wheels Unleashed**-like (snap modular, no CAD).
- Edad sugerida: **PEGI 12 / ESRB Teen** (violencia vehicular, sin gore humano).

---

## 4. Bucle principal (core loop)

```
Elegir modo → Elegir clase/auto → Carrera (contacto + boost + daño)
    → Recompensas (XP, moneda soft, trofeos)
    → Garaje (cosméticos, tuning arcade)
    → (Opcional) Crear/editar circuito → Publicar → Jugar copas comunitarias
    → Repetir con amigos cross-play
```

**Moneda soft:** desbloqueos base, cosméticos comunes.  
**DLC premium:** pistas, clases, packs open, **packs de editor ($0.50)**.  
**Sin pay-to-win en ranked:** autos de DLC entran en **paridad de tier** (misma banda de stats que la clase base equivalente).

---

## 5. Modos de juego

| Modo | Descripción | Plataforma |
|------|-------------|------------|
| **Contact Race** | 3–8 vueltas, boost por riesgo/takedown, daño persistente, pit rápido opcional | Todas |
| **Takedown Trial** | Objetivos por vuelta (empujes, near misses) | Todas |
| **Hot Lap** | Sin contacto; tabla global cross-play | Todas |
| **Private Lobby** | Amigos, reglas custom (daño off/on, boost x2) | Todas |
| **Ranked Contact** | Temporadas, buckets de matchmaking | Todas |
| **Open Sprint** | Tramo abierto, checkpoints, tráfico arcade ligero | Evento / DLC |
| **Community Cup** | Rotación semanal de circuitos UGC + curación oficial | Todas |
| **Track Test** | Probar circuito propio o por código | Todas |

---

## 6. Manejo, contacto y boost

### 6.1 Manejo (sim-lite)

- Peso transferido en frenada y aceleración; tracción arcade recuperable.
- Asistencias: ABS arcade, steering help, ideal line (off por defecto en ranked mando/volante).
- **Volante (PS4/PS5):** soporte completo con sensibilidad y asistencias por modo.
- **Móvil:** gas/freno (botones o auto-gas en casual), dirección touch o giroscopio; botón **Boost**; el empujón es por **contacto en pista** (igual que mando), sin botón aparte.

### 6.2 Boost (espíritu Burnout)

Fuentes (tunable en balance):

- Rozar muro/rival **controlado** (meter limpio).
- **Takedown** (rival contra muro o fuera de línea de carrera).
- Drift mantenido en curva (menor que takedown).
- Near miss tráfico (solo open sprint).

Drain en uso; overboost breve si el medidor está lleno.

### 6.3 Contacto, empujón y takedowns (estilo Hot Wheels)

**Sin botón de empujón.** Como en *Hot Wheels Unleashed*, el desplazamiento del rival sale del **choque físico en carrera**, no de una habilidad con cooldown en L1/RB.

- Empuje basado en **masa, velocidad relativa y ángulo**; no “magnet hitbox”.
- **Boost activo (X en mando):** el coche transfiere más momentum en impactos laterales y traseros; ventana clara para **empujar fuera de línea** o contra muro (takedown).
- **Dirección + contacto:** al rozar rival, **dirigir el stick hacia él** inclina el peso y amplifica el bash lateral (lean), sin botón extra.
- **Takedown confirmado:** rival pierde control un instante o impacto fuerte contra barrera; feedback visual/audio reforzado.
- **Anti-abuso ranked:** strikes por empujes en horquilla / meta de freno; ghost temporal tras reincidente.

---

## 7. Sistema de daño

### 7.1 Principios

- **Visual alto, gameplay moderado.** Deformación mesh o capas por zona; piezas sueltas en impactos fuertes.
- **Aerodinámica:** efecto **mínimo** (solo clases “Pro”; estabilidad a >180 km/h ligeramente reducida si alerón destrozado). No calcular CFD ni sim real.
- **Sincronización online:** estado por **zonas** (intacto / light / medium / heavy) + piezas desprendidas indexadas; no replicar vértices en tiempo real.

### 7.2 Niveles de daño

| Nivel | Visual | Efecto manejo (cap orientativo) |
|-------|--------|----------------------------------|
| Cosmético | Rayas, abolladura leve | 0 % |
| Ligero | Parachoques, panel | 3–5 % grip o balance en un eje |
| Medio | Suspensión, rueda tocada | 8–12 % en comportamiento localizado |
| Fuerte | Estructura, rueda crítica | Humo, límite de boost; pit recomendado |
| Destruido | Inmovilizado | DNF o respawn con penalización (solo casual) |

### 7.3 Pit

- **Pit rápido (arcade):** 3–5 s; restaura a **80–90 %** rendimiento; deja marcas cosméticas.
- En **Hot Lap** y algunos eventos: sin pit o daño off.

---

## 8. Contenido base (v1.0 — objetivo)

### 8.1 Autos

- **8–12 vehículos** en **4 clases** (nombres ficticios; siluetas reconocibles sin licencia):

| Clase | Fantasía | Rol |
|-------|----------|-----|
| **Hatch** | Hot hatch | Ágil, boost por drift |
| **Muscle** | Pony car | Empuje, takedowns |
| **GT** | GT3-like | Equilibrado ranked |
| **Prototype** | Prototype ligero | Top speed, daño frágil |

- Tuning **solo arcade:** reparto grip F/R, respuesta boost, **resistencia a daño** (no HP infinito).
- Stats normalizados por tier en ranked.

### 8.2 Circuitos oficiales

- **6–8 circuitos cerrados** (montaña, industrial, costa, urbano cerrado).
- **1 tramo open** corto para tutorial de Open Sprint.
- Variantes: atardecer; lluvia **arcade** (menos grip global, sin sim de neumático).

### 8.3 Progresión

- Niveles de cuenta → desbloqueo cosméticos y piezas de editor base.
- Temporadas ranked: rangos, recompensas exclusivas no pagas.
- Trofeos / logros PSN.

---

## 9. Crea tu propio circuito (UGC)

### 9.1 Filosofía

Editor **modular por piezas**, no sculpt libre infinito (v1). Prioridad: **publicar en < 15 min** para un usuario nuevo.

### 9.2 Herramientas base (incluidas en juego)

- Piezas: rectas (3 longitudes), curvas (90°, 45°, banked), chicane, S, túnel, puente simple.
- Superficies: asfalto, kerb, césped (penalización), gravilla.
- Objetos base: muros blandos/duros, barreras, línea de meta, checkpoints (open), spawn grid.
- Metadatos: nombre, tags, reglas (vueltas / tiempo / contacto on-off).
- Flujo: **Editar → Probar → Publicar** → código **SCAR-XXXXX** + listado en servidores.

### 9.3 DLC de editor — **$0.50 USD** por pack

Precio bajo = **micro-pack temático**, 1 compra impulsiva, acumulable.

Ejemplos de packs v1 post-launch:

| Pack | Contenido ejemplo | Precio |
|------|-------------------|--------|
| Industrial Props | Contenedores, grúas, tuberías | $0.50 |
| Coastal | Rocas, faro, muelle modular | $0.50 |
| Desert Open | Tramos rectos largos, rocas, cactus decor | $0.50 |
| Night Lights | Farolas, neón, props luminosos | $0.50 |
| Stunt | Rampas *arcade controladas*, loops no sim | $0.50 |

**Regla:** el juego base permite **publicar y competir** sin DLC; los packs solo amplían vocabulario visual y piezas de layout (nunca paywall de publicar).

### 9.4 Moderación y calidad

- Reportes in-game; filtros de nombre; límite de props por pista (PS4).
- Destacados semanales oficiales; requisitos mínimos (checkpoint, cierre de loop, spawn válido).

---

## 10. Otros DLC (~$1.99 USD)

| Tipo | Contenido típico | Precio |
|------|------------------|--------|
| **Track Pack** | 2 cerrados + 1 variante | $1.99 |
| **Class Pack** | 3 autos + challenges | $1.99 |
| **Open Roads** | 1 ruta abierta larga + modo sprint | $1.99 |
| **Cosmetic Bundle** | Liveries, humo, pegatinas | $1.99 |

Entitlement **cross-platform** vía cuenta Scarline + sincronización con PS Store / App Store / Play Store según plataforma de compra principal (definir con legal).

---

## 11. Multijugador y cross-play

### 11.1 Arquitectura (objetivo)

- **Servidor dedicado** para ranked y salas públicas; listen server solo lobbies privados si es necesario en v1.
- Autoridad server-side: posiciones, contactos, daño por zonas, boost.
- Backend: matchmaking, UGC metadata, anti-cheat básico (validación de inputs y telemetría anómala).

### 11.2 Cross-play PS4 / PS5 / móvil

- Lobby unificado; opción de **excluir móvil** solo en settings de grupo (no obligatorio global).
- **PS4:** mismas reglas; gráficos y LOD de daño reducidos; framerate objetivo 30 fps (60 donde sea viable).
- **Input buckets** en ranked opcionales: Touch / Mando / Volante (configuración de temporada).

### 11.3 Asistencias y fairness móvil

- Ranked: asistencias **normalizadas** (mismo techo de steering help).
- Dead zone y auto-aceleración **desactivados** en ranked móvil competitivo.

---

## 12. Controles — resumen

| Entrada | Acelerar / Frenar | Dirección | Boost | Empujón |
|---------|-------------------|-----------|-------|---------|
| DualShock / DualSense | R2 / L2 | Stick izq. | **X (Cross)** | Sin botón: contacto físico + **X** activo + stick hacia rival |
| Volante | Pedales | Giro | Botón mapeable (default equiv. a X) | Igual: solo física y boost |
| Touch | UI / auto-gas (casual) | Virtual / tilt | UI dedicado | Igual: contacto + boost + apuntar hacia rival |

**Notas mando PlayStation**

- **X:** boost (consumo del medidor; overboost al llenar).
- **R1 / L1 / Square:** libres para freno de mano/drift u otras funciones de manejo (definición final en vertical slice).
- Remapeo en PS; perfiles guardados por usuario.

---

## 13. Arte, audio y narrativa

- **Art direction:** carrocerías limpias al inicio; cicatrices progresivas; UI legible en pantallas pequeñas.
- **Audio:** capas de impacto (roce vs estructural); motor “dañado” sutil; música electrónica / rock instrumental en menús y boost.
- **Narrativa:** ligera — ligas ficticias “Scarline Series”, comentarista arcade en carrera (on/off).

---

## 14. Requisitos técnicos (UE5)

- Deformación: proxy gameplay + visual local; Chaos / solución custom por zonas.
- UGC: serialización compacta de piezas; validación server al publicar.
- PS4: presupuesto polígonos y materiales agresivo; instancing de props editor.
- Móvil: tier bajo/medio/alto; descarga inicial optimizada; optional HD pack.

---

## 15. Monetización y negocio

| Elemento | Modelo |
|----------|--------|
| Juego base | Premium (precio TBD regional) |
| DLC contenido | ~$1.99 |
| DLC editor | **$0.50** por micro-pack |
| Season Pass | Opcional futuro; no requerido v1 |
| IAP móvil | Espejo de DLC; sin loot boxes de ventaja |

---

## 16. Roadmap de producción (alto nivel)

| Fase | Entregable | Duración orientativa |
|------|------------|----------------------|
| **0 — Vertical slice** | 1 pista, 2 autos, daño+zona, boost, 1 sala online dev | 3–4 meses |
| **1 — Alpha** | 4 pistas, 6 autos, editor básico local, cross-play interno | +4–6 meses |
| **2 — Beta cerrada** | Contenido v1 completo, UGC publish, ranked | +4 meses |
| **3 — Gold v1.0** | Cert PS4/PS5, iOS/Android, day-one parche | +2 meses |
| **Live** | Pistas $1.99, editor packs $0.50, temporadas | Continuo |

---

## 17. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Daño en red costoso | Solo zonas + eventos de piezas |
| PS4 vs PS5 + móvil en ranked | Buckets input; balance por clase; telemetría |
| UGC low-effort / troll | Validación automática, reportes, destacados curados |
| Scope editor vs Burnout polish | Editor v1 modular acotado; polish en piezas base |
| Cert cross-play Sony + stores móvil | Integración EOS/PlayFab temprana en slice |

---

## 18. Vertical slice — criterios de éxito

1. Contacto **satisfactorio** (empuje legible, takedown justo).  
2. Daño **leíble** en PS5 y móvil alto; PS4 aceptable.  
3. Una sesión **cross-play** estable 8 jugadores.  
4. Editor: loop cerrado con 5 tipos de pieza, guardar y probar.  
5. FPS: PS5 60; PS4 30 estable; móvil 30/60 según tier.

---

## 19. Glosario

- **Takedown:** maniobra que incapacita temporalmente a un rival o lo manda contra barrera con ventaja clara para el atacante.  
- **Tier:** banda de rendimiento normalizada en ranked.  
- **UGC:** contenido generado por usuario (circuitos).  
- **Boost Ram:** empuje potenciado al contactar rival con **boost (X)** activo; referencia *Hot Wheels Unleashed*, sin habilidad de empujón en botón aparte.

---

## 20. Control de cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 0.1 | 2026-10-06 | Documento inicial: PS4/5 + móvil, Scarline, DLC editor $0.50, cross-play, UE5 |
| 0.2 | 2026-10-06 | Boost en **X** (mando); empujón estilo Hot Wheels (contacto + boost, sin botón Shove) |
| — | 2026-10-06 | Playtest web v0.2: Scarline GP 2 vueltas, daño arcade (penalización tardía), 3 circuitos / 4 coches |

---

*Documento vivo — próxima revisión sugerida: balance económico regional, precio base, y spec detallada del editor (límite piezas PS4).*


## Estado del playtest web — v1.0 (19-11-2026)

El prototipo de navegador consolida tres circuitos cerrados de trazado mixto, cuatro clases de vehículo, conducción arcade, rivales IA, boost, HUD de carrera, compatibilidad básica con mandos y daños visuales localizados. Los trazados se construyen mediante splines y superficies continuas de pista; coches y escenarios siguen siendo geometría procedural de Three.js. Los daños incluyen deformación arcade, arañazos, cristales agrietados y desprendimiento de paragolpes, capó, puertas y ruedas en umbrales de impacto.

Este estado es un playtest web funcional en desarrollo, no una versión de producción ni una build nativa de consola/móvil. La simulación estructural avanzada, modelos externos de vehículos, audio final, optimización por plataforma, pruebas de QA y port a Unreal Engine 5 siguen fuera del alcance de este prototipo.
