"""Ejecutar una vez en UE: Herramientas -> Execute Python Script (o -ExecCmds py)
Importa GLB + texturas y opcionalmente guarda mapa /Game/Maps/LV_Scarline_Play
"""
import os
import unreal

ROOT = unreal.Paths.project_content_dir()
EXT = os.path.join(ROOT, "ExternalAssets")
VEH_SRC = os.path.join(EXT, "Vehicles", "Spectral_GT_RS_CC0.glb")
TEX_DIR = os.path.join(EXT, "Textures")


def ensure_path(path: str) -> bool:
    return os.path.isfile(path)


def import_file(src: str, dest: str):
  options = unreal.InterchangeGenericAssetsPipeline()
  if src.lower().endswith(".glb"):
    options = unreal.InterchangeGLTFPipeline()
  task = unreal.AssetImportTask()
  task.set_editor_property("filename", src)
  task.set_editor_property("destination_path", dest)
  task.set_editor_property("automated", True)
  task.set_editor_property("replace_existing", True)
  task.set_editor_property("save", True)
  unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
  unreal.log(f"Imported: {src} -> {dest}")


def main():
  if not ensure_path(VEH_SRC):
    unreal.log_error("Falta GLB en Content/ExternalAssets/Vehicles")
    return
  import_file(VEH_SRC, "/Game/Vehicles/SpectralGT")
  if os.path.isdir(TEX_DIR):
    for name in os.listdir(TEX_DIR):
      if name.lower().endswith((".jpg", ".png")):
        import_file(os.path.join(TEX_DIR, name), "/Game/Environment/Textures")
  unreal.EditorAssetLibrary.save_directory("/Game/Vehicles", False, True)
  unreal.log("Scarline import listo. Crea M_Asphalt en el editor y asignalo al Scarline Track Actor.")


if __name__ == "__main__":
  main()