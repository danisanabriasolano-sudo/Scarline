#pragma once
#include "CoreMinimal.h"

class UWorld;
class AScarlineTrackActor;

/** Crea pista, luz y punto de salida si el nivel está vacío / solo tiene Landscape. */
class SCARLINE_API FScarlineWorldBootstrap
{
public:
    static AScarlineTrackActor* EnsurePlayableWorld(UWorld* World);
    static bool GetSuggestedPlayerStart(AScarlineTrackActor* Track, FVector& OutLoc, FRotator& OutRot);
    static void HideDefaultLandscape(UWorld* World);
    static void EnsureSkyAndSun(UWorld* World);
    static void EnsureGroundAndAtmosphere(UWorld* World);
    static void ApplyRenderDefaults(UWorld* World);
    static void ConfigureWorldForDynamicLighting(UWorld* World);
    static void EnsurePostProcessExposure(UWorld* World);
    static void RefreshSkylightCapture(UWorld* World);
};