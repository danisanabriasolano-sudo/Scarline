$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$VehicleDir = Join-Path $Root 'Content/ExternalAssets/Vehicles'
$TextureDir = Join-Path $Root 'Content/ExternalAssets/Textures'
New-Item -ItemType Directory -Force -Path $VehicleDir, $TextureDir | Out-Null

Write-Host 'Downloading CC0 Spectral GT RS vehicle (GLB)...'
$VehicleUrl = 'https://jaronkbragg7337.github.io/spectral-gt-rs/spectral_gt_rs_game_ready.glb'
Invoke-WebRequest -Uri $VehicleUrl -OutFile (Join-Path $VehicleDir 'Spectral_GT_RS_CC0.glb')

$maps = @{
  'clean_asphalt_diff_2k.jpg' = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/clean_asphalt/clean_asphalt_diff_2k.jpg'
  'clean_asphalt_nor_gl_2k.jpg' = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/clean_asphalt/clean_asphalt_nor_gl_2k.jpg'
  'clean_asphalt_rough_2k.jpg' = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/clean_asphalt/clean_asphalt_rough_2k.jpg'
  'clean_asphalt_ao_2k.jpg' = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/clean_asphalt/clean_asphalt_ao_2k.jpg'
  'LICENSE_clean_asphalt.txt' = $null
}
foreach ($name in $maps.Keys) {
  if ($name -like 'LICENSE*') {
    @'
Clean Asphalt — Poly Haven (https://polyhaven.com/a/clean_asphalt)
CC0 1.0 Universal
'@ | Set-Content -Encoding UTF8 (Join-Path $TextureDir $name)
    continue
  }
  Write-Host "Downloading $name..."
  Invoke-WebRequest -Uri $maps[$name] -OutFile (Join-Path $TextureDir $name)
}

@'
Spectral GT RS — CC0 Vehicle Asset (see ASSET_SOURCES.md)
https://jaronkbragg7337.github.io/spectral-gt-rs/
'@ | Set-Content -Encoding UTF8 (Join-Path $VehicleDir 'LICENSE_spectral_gt_rs.txt')

Write-Host ''
Write-Host 'Assets ready under Content/ExternalAssets/'
Write-Host 'Import GLB in Unreal via Interchange into /Game/Vehicles/SpectralGT'
Write-Host 'Build PBR asphalt material from Textures/*.jpg (2K recommended for mobile).'