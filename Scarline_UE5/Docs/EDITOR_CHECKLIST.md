# Scarline — Checklist rápida (UE 5.5 Editor)

Sigue este orden la **primera vez**. Tiempo orientativo: 2–4 h si UE y VS ya están instalados.

---

## A. Instalar motor y herramientas

- [ ] Instalar [Epic Games Launcher](https://store.epicgames.com/download)
- [ ] En **Biblioteca → Motor Unreal**, instalar **5.5.x** (no mezclar 5.4 si el `.uproject` dice 5.5)
- [ ] Marcar componentes: **Editor**, **Plantillas C++**, **Win64**
- [ ] Visual Studio 2022 → carga de trabajo **Desarrollo de juegos con C++** + **Desktop development with C++**
- [ ] Reiniciar PC si el Launcher lo pide

---

## B. Abrir el proyecto por primera vez

- [ ] `Scarline_UE5\Tools\Download-ScarlineAssets.ps1` (si faltan GLB/texturas)
- [ ] Clic derecho `Scarline.uproject` → **Generate Visual Studio project files**
- [ ] Abrir `Scarline.sln` → configuración **Development Editor | Win64** → **Build** (compilar módulo Scarline)
- [ ] Doble clic `Scarline.uproject` → **Yes** si pide recompilar / regenerar

---

## C. Importar Spectral GT RS

- [ ] Content Browser → **Import** en `Content/ExternalAssets/Vehicles/Spectral_GT_RS_CC0.glb`
- [ ] Destino: carpeta `/Game/Vehicles/SpectralGT`
- [ ] Al terminar, abrir el mesh y comprobar **escala** (glTF suele ser pequeño → escala **80–100** en Blueprint si hace falta)
- [ ] En el Static Mesh: **Collision** → *Simple* o *Complex as Simple*; **Generate**

---

## D. Blueprint del jugador

- [ ] Content Browser → **Blueprint Class** → padre: `ScarlineCarPawn` → nombre: `BP_Scarline_Player`
- [ ] Abrir `BP_Scarline_Player`:
  - [ ] **VehicleBody**: mesh principal del GLB (carrocería con colisión física)
  - [ ] **FrontBumper / RearBumper / HoodPanel / FrontGlass**: submeshes o duplicados; colisión off hasta desprender
  - [ ] **Wheel_FL/FR/RL/RR**: cuatro ruedas del GLB
- [ ] Ajustar **offsets** de piezas en el viewport hasta que encajen
- [ ] Material pintura: parámetro escalar **`Damage`** (0–1) conectado a máscaras si las tienes

---

## E. Materiales de asfalto (Poly Haven)

- [ ] Carpeta `/Game/Environment/Materials/`
- [ ] Crear `M_Asphalt_Clean` (Material):
  - Base Color ← `clean_asphalt_diff_2k.jpg`
  - Normal ← `clean_asphalt_nor_gl_2k.jpg`
  - Roughness ← `clean_asphalt_rough_2k.jpg`
  - AO ← `clean_asphalt_ao_2k.jpg`
- [ ] UV tiling ~10–20 en el spline mesh de carretera (o en el material)

---

## F. Nivel y pista

- [ ] **File → New Level → Empty** → guardar como `LV_Scarline_Prototype`
- [ ] Colocar **Directional Light** + **Sky Atmosphere** + **Post Process** (Lumen ya en `DefaultEngine.ini`)
- [ ] Arrastrar **ScarlineTrackActor** al nivel
- [ ] En Details: **Use Coastal Layout** (o Industrial) → botón **Rebuild Track**
- [ ] Asignar **RoadMaterial** = `M_Asphalt_Clean`; kerb/barrera según tengas
- [ ] Colocar **BP_Scarline_Player** cerca del punto de meta del spline
- [ ] **Project Settings → Maps & Modes** → GameMode `ScarlineGameMode`, Default Pawn `BP_Scarline_Player`, HUD default

---

## G. Controles y prueba

- [ ] **Edit → Project Settings → Input** (ya hay W/A/S, Space, **X** boost, mando)
- [ ] **Play (PIE)**: acelerar, boost **X**, chocar muro/rival
- [ ] Verificar: medidor HUD, daño sube lento, desprende paragolpes con golpes fuertes, `BP_OnImpact` en Blueprint (opcional Niagara)

---

## H. Niagara y audio (siguiente paso visual)

En `BP_Scarline_Player` → **Event Graph**, implementar:

- [ ] `BP_OnImpact` → Niagara chispas + sonido metal
- [ ] `BP_OnPartDetached` → humo + sonido
- [ ] `BP_OnDamageChanged` → UI / postprocess leve

---

## I. Ejecutable Windows (UE)

- [ ] Compilar **Development Editor** al menos una vez sin errores
- [ ] `Tools\Build-Scarline.ps1` (con UE 5.5 en ruta Epic por defecto)
- [ ] Ejecutable en `Scarline_UE5\Builds\Windows\` → `Scarline.exe`

---

## Si algo falla

| Problema | Qué hacer |
|----------|-----------|
| No compila C++ | VS 2022 + workload juegos; regenerar `.sln` |
| GLB no importa | Blender → Export FBX *Apply Transform* → importar FBX |
| Coche vuela / gira raro | Masa en VehicleBody; damping; colisión simple |
| Sin Epic / UE | Usar `prototype\desktop\dist\Scarline.exe` (slice con GLB real) |