# Scarline vertical-slice roadmap

## In this source delivery
- Native UE5 C++ project foundation.
- Arcade physics pawn, chase camera, boost, mobile-callable controls.
- Collision damage accumulation, detachable bumper/hood components, breakable-glass visibility hook, Blueprint VFX events.
- Editable spline circuits with long straights, hairpins, road, kerbs and barriers.
- Basic HUD and scalable rendering config.
- CC0 hero car and asphalt asset sources with an acquisition script.

## Required work in Unreal Editor before a visual playtest
1. Build Development Editor and open the project.
2. Download/import the CC0 hero car; verify axis, scale, pivots, wheel hierarchy and material slots.
3. Create `BP_Scarline_Player`, assign the hero mesh and separate damage meshes, create simple collision hulls and tune mass/centre of mass.
4. Create asphalt, kerb, barrier, car paint, glass, tyre and carbon materials; connect PBR texture channels.
5. Create one complete coastal race level: terrain, runoff, kerbs, barrier walls, fencing, grandstands, pit complex, lights, signs, foliage and sky.
6. Add Niagara impact sparks, glass shards, dust, tyre smoke and exhaust; connect them to Blueprint impact events.
7. Add a touch HUD with steer/throttle/brake/boost controls and safe-area handling.
8. Profile 30/60 FPS targets on actual Android/iOS devices; create mobile scalability settings.

## Production milestones after vertical slice
- Real vehicle dynamics (Chaos Vehicles with skeletal vehicle rig), tyre model tuning, suspension, drivetrain and surface friction.
- Panel-level damage meshes and detachable mirrors, wheels, doors and glass with robust constraints and replication.
- AI racing opponents, checkpoints, timing, lap validation, race rules and progression.
- Audio: engine layers, transmission, tyres, impacts, ambience and music.
- Multiplayer replication, matchmaking, anti-cheat and server authority.
- Garage, car selection, tuning, save system and UI flow.
- Console platform integration and certification (requires licensed platform SDK access).
