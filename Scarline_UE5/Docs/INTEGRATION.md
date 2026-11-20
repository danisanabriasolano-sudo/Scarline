# Scarline UE5 — Integración de assets (post-descarga)

Los binarios CC0 ya pueden vivir en `Content/ExternalAssets/`. Ejecuta `Tools/Download-ScarlineAssets.ps1` si faltan.

## 1. Spectral GT RS (coche principal)

1. Abre Unreal Editor → **Interchange** o **Import** en `Content/ExternalAssets/Vehicles/Spectral_GT_RS_CC0.glb`.
2. Destino sugerido: `/Game/Vehicles/SpectralGT/`.
3. Escala: suele requerir **×100** o **×80** según unidades glTF (comprueba en viewport).
4. Crea `BP_Scarline_Player` (hijo de `ScarlineCarPawn`).
5. **VehicleBody**: mesh de carrocería principal + colisión simplificada + simular física.
6. **FrontBumper / RearBumper / HoodPanel / FrontGlass**: asigna sub-meshes por nombre del GLB o piezas duplicadas; offsets en Details hasta encajar.
7. Ruedas: cuatro `Wheel_*` con meshes de rueda del GLB.
8. Material paint: añade scalar **`Damage`** (0–1) para máscaras de rayado.

## 2. Clean Asphalt (Poly Haven)

Texturas en `Content/ExternalAssets/Textures/` (2K JPG).

1. Crea `M_Asphalt_Clean` en `/Game/Environment/Materials/`.
2. Base Color ← `clean_asphalt_diff_2k.jpg`, Normal ← `nor_gl_2k`, Roughness ← `rough_2k`, Ambient Occlusion ← `ao_2k`.
3. Asigna a `RoadMaterial` en `ScarlineTrackActor` en el nivel.

## 3. Nivel prototipo (2 vueltas)

1. Mapa: `LV_Scarline_Prototype`.
2. Coloca `ScarlineTrackActor` → **Use Coastal Layout** o layout custom → **Rebuild Track**.
3. Coloca `BP_Scarline_Player` en spline punto 0.
4. GameMode: `ScarlineGameMode` con pawn y HUD por defecto.
5. Niagara en Blueprint del pawn: `BP_OnImpact`, `BP_OnPartDetached`, `BP_OnDamageChanged`.

## 4. Ejecutable nativo UE

```powershell
cd Scarline_UE5\Tools
.\Build-Scarline.ps1
```

Requiere compilar el módulo C++ al menos una vez desde Visual Studio (Development Editor).

## 5. Mientras no haya UE instalado

Usa `prototype\desktop\Scarline.exe` (launcher): coche GLB + asfalto PBR en slice web con la misma lógica arcade.