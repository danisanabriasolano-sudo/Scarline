"""Genera /Game: importa GLB + texturas, materiales MI_Asphalt y asigna referencias listas para cook."""
import os
import unreal

ROOT = unreal.Paths.project_content_dir()
EXT = os.path.join(ROOT, "ExternalAssets")
VEH_SRC = os.path.join(EXT, "Vehicles", "Spectral_GT_RS_CC0.glb")
TEX_DIR = os.path.join(EXT, "Textures")

VEHICLE_DEST = "/Game/Vehicles/SpectralGT"
TEX_DEST = "/Game/Environment/Textures"
MAT_DEST = "/Game/Materials"


def ensure_dir(path: str):
    if not unreal.EditorAssetLibrary.does_directory_exist(path):
        unreal.EditorAssetLibrary.make_directory(path)


def import_file(src: str, dest: str):
    if not os.path.isfile(src):
        unreal.log_error(f"Missing: {src}")
        return False
    ensure_dir(dest)
    task = unreal.AssetImportTask()
    task.set_editor_property("filename", src)
    task.set_editor_property("destination_path", dest)
    task.set_editor_property("automated", True)
    task.set_editor_property("replace_existing", True)
    task.set_editor_property("save", True)
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    unreal.log(f"Imported {src} -> {dest}")
    return True


def find_first_static_mesh(folder: str):
    ar = unreal.AssetRegistryHelpers.get_asset_registry()
    paths = ar.get_assets_by_path(folder, recursive=True)
    for data in paths:
        if data.asset_class_path.asset_name == "StaticMesh":
            return data.package_name
    return None


def load_texture(name_stem: str):
    for suffix in ("", ".clean_asphalt_diff_2k", f".{name_stem}"):
        for base in (TEX_DEST,):
            for leaf in (name_stem, os.path.basename(name_stem)):
                path = f"{base}/{leaf}.{leaf}" if "." not in leaf else f"{base}/{leaf}"
                path2 = f"{base}/{os.path.splitext(os.path.basename(name_stem))[0]}.{os.path.splitext(os.path.basename(name_stem))[0]}"
                for p in (path, path2):
                    if unreal.EditorAssetLibrary.does_asset_exist(p):
                        return unreal.EditorAssetLibrary.load_asset(p)
    reg = unreal.AssetRegistryHelpers.get_asset_registry()
    for data in reg.get_assets_by_path(TEX_DEST, recursive=True):
        if name_stem.replace("_2k", "") in str(data.asset_name).lower() and "diff" in str(data.asset_name).lower():
            return data.get_asset()
        if "diff" in str(data.asset_name).lower():
            return data.get_asset()
    return None


def find_texture_by_token(token: str):
    reg = unreal.AssetRegistryHelpers.get_asset_registry()
    for data in reg.get_assets_by_path(TEX_DEST, recursive=True):
        if token in str(data.asset_name).lower():
            return data.get_asset()
    return None


def create_asphalt_material():
    ensure_dir(MAT_DEST)
    mat_path = f"{MAT_DEST}/M_Asphalt"
    if unreal.EditorAssetLibrary.does_asset_exist(mat_path):
        unreal.EditorAssetLibrary.delete_asset(mat_path)

    tools = unreal.AssetToolsHelpers.get_asset_tools()
    material = tools.create_asset("M_Asphalt", MAT_DEST, unreal.Material, unreal.MaterialFactoryNew())
    if not material:
        unreal.log_error("Could not create M_Asphalt")
        return None

    diff = find_texture_by_token("diff")
    norm = find_texture_by_token("nor")
    rough = find_texture_by_token("rough")

    base = unreal.MaterialEditingLibrary.create_material_expression(
        material, unreal.MaterialExpressionConstant3Vector, -620, -80
    )
    base.set_editor_property("constant", unreal.LinearColor(0.14, 0.14, 0.15, 1.0))

    if diff:
        tex = unreal.MaterialEditingLibrary.create_material_expression(
            material, unreal.MaterialExpressionTextureSample, -420, -120
        )
        tex.set_editor_property("texture", diff)
        unreal.MaterialEditingLibrary.connect_material_property(
            tex, "RGB", unreal.MaterialProperty.MP_BASE_COLOR
        )
    else:
        unreal.MaterialEditingLibrary.connect_material_property(
            base, "", unreal.MaterialProperty.MP_BASE_COLOR
        )

    if norm:
        tex_n = unreal.MaterialEditingLibrary.create_material_expression(
            material, unreal.MaterialExpressionTextureSample, -420, 80
        )
        tex_n.set_editor_property("texture", norm)
        unreal.MaterialEditingLibrary.connect_material_property(
            tex_n, "RGB", unreal.MaterialProperty.MP_NORMAL
        )

    rough_const = unreal.MaterialEditingLibrary.create_material_expression(
        material, unreal.MaterialExpressionConstant, -420, 240
    )
    rough_const.set_editor_property("r", 0.72 if not rough else 0.85)
    if rough:
        tex_r = unreal.MaterialEditingLibrary.create_material_expression(
            material, unreal.MaterialExpressionTextureSample, -620, 240
        )
        tex_r.set_editor_property("texture", rough)
        unreal.MaterialEditingLibrary.connect_material_property(
            tex_r, "R", unreal.MaterialProperty.MP_ROUGHNESS
        )
    else:
        unreal.MaterialEditingLibrary.connect_material_property(
            rough_const, "", unreal.MaterialProperty.MP_ROUGHNESS
        )

    spec = unreal.MaterialEditingLibrary.create_material_expression(
        material, unreal.MaterialExpressionConstant, -420, 360
    )
    spec.set_editor_property("r", 0.08)
    unreal.MaterialEditingLibrary.connect_material_property(spec, "", unreal.MaterialProperty.MP_SPECULAR)

    unreal.MaterialEditingLibrary.recompile_material(material)
    unreal.EditorAssetLibrary.save_asset(mat_path)

    mi_path = f"{MAT_DEST}/MI_Asphalt_Track"
    if unreal.EditorAssetLibrary.does_asset_exist(mi_path):
        unreal.EditorAssetLibrary.delete_asset(mi_path)
    mi = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
        "MI_Asphalt_Track", MAT_DEST, unreal.MaterialInstanceConstant, unreal.MaterialInstanceConstantFactoryNew()
    )
    mi.set_editor_property("parent", material)
    unreal.EditorAssetLibrary.save_asset(mi_path)
    return mi


def write_defaults(mesh_pkg, mi_asphalt):
    ensure_dir("/Game/Data")
    cfg = f"/Game/Data/ScarlineVisualDefaults"
    # Soft refs via string table in DefaultGame.ini instead; log paths for C++ sync
    unreal.log(f"SCARLINE_VEHICLE_MESH={mesh_pkg}")
    unreal.log(f"SCARLINE_ROAD_MI={mi_asphalt.get_path_name() if mi_asphalt else 'NONE'}")


def main():
    ensure_dir(VEHICLE_DEST)
    ensure_dir(TEX_DEST)
    ensure_dir(MAT_DEST)

    if os.path.isfile(VEH_SRC):
        import_file(VEH_SRC, VEHICLE_DEST)

    if os.path.isdir(TEX_DIR):
        for name in os.listdir(TEX_DIR):
            low = name.lower()
            if low.endswith((".jpg", ".jpeg", ".png", ".tga", ".exr")):
                import_file(os.path.join(TEX_DIR, name), TEX_DEST)

    mesh_pkg = find_first_static_mesh(VEHICLE_DEST)
    mi = create_asphalt_material()
    unreal.EditorAssetLibrary.save_directory("/Game", only_if_is_dirty=False, recursive=True)

    defaults_path = os.path.join(unreal.Paths.project_config_dir(), "DefaultGame.ini")
    lines = []
    if mesh_pkg:
        lines.append(f"ScarlineHeroMesh={mesh_pkg}.{mesh_pkg.split('/')[-1]}")
    if mi:
        lines.append(f"ScarlineRoadMaterial=/Game/Materials/MI_Asphalt_Track.MI_Asphalt_Track")

    with open(
        os.path.join(unreal.Paths.project_config_dir(), "ScarlineVisual.ini"), "w", encoding="utf-8"
    ) as f:
        f.write("[ScarlineVisual]\n")
        for line in lines:
            f.write(line + "\n")

    write_defaults(mesh_pkg, mi)
    unreal.log("BuildScarlineContent: listo.")


if __name__ == "__main__":
    main()