# SCARLINE — Unreal Engine 5 native project foundation

Scarline is being moved from the browser prototype to a native Unreal Engine project. This delivery is a substantially expanded **source foundation** for the next playable vertical slice. It is not a finished AAA game, packaged console build, or a claim of PS5-level visuals out of the box.

## Engine and build requirements
- Unreal Engine 5.5 (the project association is set to 5.5).
- Visual Studio 2022 with **Game development with C++** workload.
- Windows 10/11 64-bit for this starter configuration.
- Blender 4.x/5.x recommended for GLB/FBX preparation.

## Build and open
1. Extract the complete `Scarline_UE5` folder.
2. Right-click `Scarline.uproject` → **Generate Visual Studio project files**.
3. Open the generated `.sln` and build `Development Editor | Win64`.
4. Open `Scarline.uproject` in Unreal Editor.
5. Create a level named `LV_Scarline_Prototype` and add an `ScarlineTrackActor`.
6. In the actor Details panel, use **Use Coastal Layout** or **Use Industrial Layout**, then **Rebuild Track**.
7. Create a Blueprint child of `ScarlineCarPawn` named `BP_Scarline_Player`.
8. Assign the imported hero vehicle mesh to `VehicleBody`. Assign separate bumper/hood/glass meshes to the detachable components and wheel meshes to the four wheel components. Set the Blueprint as the Default Pawn in the project GameMode settings.
9. Assign a suitable physics collision preset to the body mesh. The body mesh must have a simple collision hull and **Simulate Physics** enabled.
10. Create an asphalt material from the Poly Haven PBR maps and assign it to `RoadMaterial` on the track actor. Add separate kerb and barrier materials for the other slots.

## Implemented in C++
- `AScarlineCarPawn`: physics-driven arcade vehicle pawn, chase camera with speed-based FOV, throttle/steering/brake/boost, gamepad input, mobile-callable control functions, boost recharge, speed readout, impact damage and repair.
- Detachable visual components: front/rear bumpers and hood can detach and become physics actors after sufficiently severe impacts. Front glass can be hidden after severe front-end damage. These are modular gameplay hooks, not FEM/BeamNG structural deformation.
- Damage material parameter: the vehicle's dynamic material instances receive a scalar parameter named `Damage` (0–1). Add this parameter to the car paint material to drive scratches/dents/paint wear masks.
- Blueprint events: `BP_OnImpact`, `BP_OnPartDetached`, `BP_OnDamageChanged` for Niagara sparks, glass particles, sound, camera shake and UI feedback.
- `AScarlineTrackActor`: editable closed spline layouts with long straights, hairpins, flowing bends, road ribbon, kerbs and safety barriers. Road/kerb/barrier materials are assignable in Details.
- `AScarlineHUD`: basic speed, damage and boost display.
- GameMode defaults to the native car pawn and HUD.
- Desktop rendering defaults include Lumen GI/reflections and Virtual Shadow Maps; scalability presets are supplied for tuning.

## Input
- Keyboard: W accelerate, S reverse, A/D steer, Space brake, Left Shift boost.
- Gamepad: triggers accelerate/brake, left stick steer, bottom face button boost.
- Mobile: expose `SetMobileThrottle`, `SetMobileSteering`, `SetMobileBrake`, and `SetMobileBoost` to touch widgets in a Blueprint HUD. A ready-made touch HUD is not included because it must be laid out and profiled against real phone aspect ratios.

## External assets
See `Content/ExternalAssets/ASSET_SOURCES.md`. **Spectral GT RS** (GLB) and **Clean Asphalt** 2K JPG maps can be fetched with `Tools/Download-ScarlineAssets.ps1` (already run on the integrated workspace copy when assets are present). Import the GLB through Interchange into `/Game/Vehicles/SpectralGT`. See `Docs/INTEGRATION.md`.

## Visual target / platform strategy
- **Desktop / high-end console target:** Lumen, high-quality shadows, 2K–4K hero vehicle textures, dense track dressing and high post-process quality.
- **Mobile target:** separate scalability profile; 1K–2K textures, baked/static lighting where possible, reduced foliage density, reduced shadow distance, capped particle count, simplified reflections and touch UI. Do not run desktop Lumen settings on mobile.
- **PS5:** this source project is not a PS5 package. Console deployment requires PlayStation Partner access, Sony SDK/devkit, platform-specific build configuration and certification. A Windows UE build cannot be relabelled as PS5.

## Important limits and honest status
- No Unreal Editor/UnrealBuildTool is installed in the authoring environment, so this source has not been compiled or rendered here. Build it in UE 5.5 and resolve any engine-version/compiler issues before production use.
- No binary vehicle/texture assets are bundled; sources and an acquisition script are included. The project cannot show a realistic car until the hero mesh and its materials are imported and assigned in the Blueprint.
- Road ribbons and barriers are generated from spline meshes; full trackside environments (grandstands, pit buildings, fences, terrain, trees, lights, signs) still need modular environment assets and placement in the level.
- Damage is arcade-readable component detachment and material parameter hooks, not realistic chassis deformation or complete breakable glass simulation.
- Network multiplayer, AI opponents, race progression, save data, garage, audio, full mobile touch UI and console certification are not implemented in this starter.
