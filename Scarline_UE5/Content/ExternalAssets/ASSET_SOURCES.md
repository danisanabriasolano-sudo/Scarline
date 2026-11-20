# Scarline external assets and licences

Only import assets whose individual licence is recorded here. Do not assume that a free download is automatically licensed for commercial use.

## Vehicle hero asset — Spectral GT RS
- Source: https://jaronkbragg7337.github.io/spectral-gt-rs/
- Direct GLB: https://jaronkbragg7337.github.io/spectral-gt-rs/spectral_gt_rs_game_ready.glb
- Editable Blender source: available from the source page.
- Licence stated by creator: CC0 1.0 Universal.
- Reported contents: 18 material finish families, 59 objects/mechanical details, 4 glTF clips; 4.7 MB GLB.
- Intended use: first player car / hero vehicle. Duplicate and recolour only after confirming the mesh/material setup in Unreal.
- Import: enable Interchange glTF support or convert GLB to FBX in Blender; import meshes and textures into `/Game/Vehicles/SpectralGT`.

## Road surface — Clean Asphalt
- Source: https://polyhaven.com/a/clean_asphalt
- Licence: CC0.
- Download 2K or 4K diffuse, normal (OpenGL), roughness and AO maps from the source page.
- Import to `/Game/Environment/Materials/Asphalt`; set diffuse as Base Color, normal as Normal, roughness as Roughness. Use tiling UVs and do not use the 8K source on mobile.

## Additional vehicle option — Grab3D Sports Car
- Source: https://grab3d.com/models/vehicles/sports-car/
- Licence stated by source: CC0 1.0.
- FBX available; reported 34,763 triangles and 2K base-colour/roughness/metallic/normal textures. The source describes the design as lightweight/stylized, so use it as a traffic/rival placeholder, not as the final photoreal hero car.

## Asset policy
- Keep the original licence text/manifest next to each imported asset.
- Do not include manufacturer logos, real-world badges, copyrighted liveries or circuit branding without permission.
- The assets above are identified as available sources; the current delivery includes download/import instructions, not the binary model/texture files. The execution environment could not fetch binary assets from those hosts.
