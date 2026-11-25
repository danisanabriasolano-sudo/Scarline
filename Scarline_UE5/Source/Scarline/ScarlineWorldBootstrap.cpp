#include "ScarlineWorldBootstrap.h"
#include "ScarlineTrackActor.h"
#include "EngineUtils.h"
#include "Engine/DirectionalLight.h"
#include "Engine/SkyLight.h"
#include "Components/DirectionalLightComponent.h"
#include "Components/SkyLightComponent.h"
#include "Components/SplineComponent.h"
#include "Kismet/GameplayStatics.h"
#include "LandscapeProxy.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "UObject/ConstructorHelpers.h"
#include "Engine/StaticMeshActor.h"
#include "Engine/StaticMesh.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/ExponentialHeightFog.h"
#include "Components/ExponentialHeightFogComponent.h"
#include "Engine/Engine.h"
#include "GameFramework/WorldSettings.h"
#include "Engine/PostProcessVolume.h"
#include "Components/SkyAtmosphereComponent.h"

void FScarlineWorldBootstrap::HideDefaultLandscape(UWorld* World)
{
    if (!World) return;
    for (TActorIterator<ALandscapeProxy> It(World); It; ++It)
    {
        It->SetActorHiddenInGame(true);
        It->SetActorEnableCollision(false);
    }
}

static void ConfigureDirectionalLight(UDirectionalLightComponent* LC)
{
    if (!LC) return;
    LC->SetMobility(EComponentMobility::Movable);
    LC->SetIntensity(4.2f);
    LC->SetLightColor(FLinearColor(1.f, 0.96f, 0.88f));
    LC->SetVolumetricScatteringIntensity(0.65f);
}

static void ConfigureSkyLight(USkyLightComponent* SLC)
{
    if (!SLC) return;
    SLC->SetMobility(EComponentMobility::Movable);
    SLC->SetIntensity(0.75f);
    SLC->SetLowerHemisphereColor(FLinearColor(0.08f, 0.12f, 0.18f));
    SLC->SetRealTimeCapture(true);
    SLC->RecaptureSky();
}

void FScarlineWorldBootstrap::EnsureSkyAndSun(UWorld* World)
{
    if (!World) return;

    TArray<AActor*> Atmos;
    UGameplayStatics::GetAllActorsOfClass(World, ASkyAtmosphere::StaticClass(), Atmos);
    if (Atmos.Num() == 0)
    {
        FActorSpawnParameters Params;
        Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
        ASkyAtmosphere* Sky = World->SpawnActor<ASkyAtmosphere>(FVector::ZeroVector, FRotator::ZeroRotator, Params);
        if (Sky) Sky->Tags.Add(FName(TEXT("ScarlineBootstrap")));
    }

    TArray<AActor*> Suns;
    UGameplayStatics::GetAllActorsOfClass(World, ADirectionalLight::StaticClass(), Suns);
    if (Suns.Num() == 0)
    {
        FActorSpawnParameters Params;
        Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
        ADirectionalLight* Sun = World->SpawnActor<ADirectionalLight>(FVector(0.f, 0.f, 0.f), FRotator(-42.f, 58.f, 0.f), Params);
        if (Sun)
        {
            ConfigureDirectionalLight(Sun->GetComponentByClass<UDirectionalLightComponent>());
            Sun->Tags.Add(FName(TEXT("ScarlineBootstrap")));
        }
    }
    else
    {
        for (AActor* Actor : Suns)
        {
            ConfigureDirectionalLight(Actor->FindComponentByClass<UDirectionalLightComponent>());
        }
    }

    TArray<AActor*> SkyLights;
    UGameplayStatics::GetAllActorsOfClass(World, ASkyLight::StaticClass(), SkyLights);
    if (SkyLights.Num() == 0)
    {
        FActorSpawnParameters Params;
        Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
        ASkyLight* SL = World->SpawnActor<ASkyLight>(FVector::ZeroVector, FRotator::ZeroRotator, Params);
        ConfigureSkyLight(SL ? SL->GetLightComponent() : nullptr);
    }
    else
    {
        for (AActor* Actor : SkyLights)
        {
            if (ASkyLight* SL = Cast<ASkyLight>(Actor))
            {
                ConfigureSkyLight(SL->GetLightComponent());
            }
        }
    }
}

void FScarlineWorldBootstrap::EnsureGroundAndAtmosphere(UWorld* World)
{
    if (!World) return;
    TArray<AActor*> Tagged;
    UGameplayStatics::GetAllActorsWithTag(World, FName(TEXT("ScarlineBootstrapGround")), Tagged);
    if (Tagged.Num() > 0) return;

    UStaticMesh* Plane = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Plane.Plane"));
    if (Plane)
    {
        FActorSpawnParameters Params;
        Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
        AStaticMeshActor* Ground = World->SpawnActor<AStaticMeshActor>(FVector::ZeroVector, FRotator::ZeroRotator, Params);
        if (Ground && Ground->GetStaticMeshComponent())
        {
            Ground->Tags.Add(FName(TEXT("ScarlineBootstrapGround")));
            Ground->GetStaticMeshComponent()->SetStaticMesh(Plane);
            Ground->SetActorScale3D(FVector(320.f, 320.f, 1.f));
            UMaterialInterface* Mat = LoadObject<UMaterialInterface>(nullptr, TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial"));
            if (Mat)
            {
                UMaterialInstanceDynamic* MID = UMaterialInstanceDynamic::Create(Mat, Ground);
                MID->SetVectorParameterValue(FName(TEXT("Color")), FLinearColor(0.05f, 0.07f, 0.06f));
                Ground->GetStaticMeshComponent()->SetMaterial(0, MID);
            }
            Ground->GetStaticMeshComponent()->SetMobility(EComponentMobility::Movable);
            Ground->GetStaticMeshComponent()->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
        }
    }
    TArray<AActor*> Fogs;
    UGameplayStatics::GetAllActorsOfClass(World, AExponentialHeightFog::StaticClass(), Fogs);
    if (Fogs.Num() == 0)
    {
        AExponentialHeightFog* Fog = World->SpawnActor<AExponentialHeightFog>();
        if (Fog && Fog->GetComponent())
        {
            Fog->GetComponent()->SetFogDensity(0.0011f);
            Fog->GetComponent()->SetFogInscatteringColor(FLinearColor(0.42f, 0.52f, 0.72f));
            Fog->GetComponent()->SetFogHeightFalloff(0.42f);
        }
    }
}

void FScarlineWorldBootstrap::ConfigureWorldForDynamicLighting(UWorld* World)
{
    if (!World) return;
    if (AWorldSettings* WS = World->GetWorldSettings())
    {
        WS->bForceNoPrecomputedLighting = true;
    }
}

void FScarlineWorldBootstrap::EnsurePostProcessExposure(UWorld* World)
{
    if (!World) return;
    TArray<AActor*> Tagged;
    UGameplayStatics::GetAllActorsWithTag(World, FName(TEXT("ScarlineBootstrapPP")), Tagged);
    if (Tagged.Num() > 0) return;

    FActorSpawnParameters Params;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
    APostProcessVolume* PPV = World->SpawnActor<APostProcessVolume>(FVector::ZeroVector, FRotator::ZeroRotator, Params);
    if (!PPV) return;
    PPV->Tags.Add(FName(TEXT("ScarlineBootstrapPP")));
    PPV->bUnbound = true;
    FPostProcessSettings& S = PPV->Settings;
    S.bOverride_AutoExposureMethod = true;
    S.AutoExposureMethod = EAutoExposureMethod::AEM_Histogram;
    S.bOverride_AutoExposureBias = true;
    S.AutoExposureBias = -1.25f;
    S.bOverride_AutoExposureMinBrightness = true;
    S.AutoExposureMinBrightness = 0.03f;
    S.bOverride_AutoExposureMaxBrightness = true;
    S.AutoExposureMaxBrightness = 1.22f;
    S.bOverride_ColorContrast = true;
    S.ColorContrast = FVector4(1.12f, 1.12f, 1.08f, 1.f);
    S.bOverride_ColorSaturation = true;
    S.ColorSaturation = FVector4(1.15f, 1.12f, 1.08f, 1.f);
    S.bOverride_BloomIntensity = true;
    S.BloomIntensity = 0.45f;
    S.bOverride_VignetteIntensity = true;
    S.VignetteIntensity = 0.28f;
}

void FScarlineWorldBootstrap::RefreshSkylightCapture(UWorld* World)
{
    if (!World) return;
    TArray<AActor*> SkyLights;
    UGameplayStatics::GetAllActorsOfClass(World, ASkyLight::StaticClass(), SkyLights);
    for (AActor* Actor : SkyLights)
    {
        if (ASkyLight* SL = Cast<ASkyLight>(Actor))
        {
            ConfigureSkyLight(SL->GetLightComponent());
        }
    }
}

void FScarlineWorldBootstrap::ApplyRenderDefaults(UWorld* World)
{
    if (!World || !GEngine) return;
    const TCHAR* Commands[] = {
        TEXT("r.EyeAdaptation.CachedLightingPreExposure 0.35"),
        TEXT("r.EyeAdaptation.CachedLightingPostExposure 0.35"),
        TEXT("r.DefaultFeature.AutoExposure.Bias -1.25"),
        TEXT("r.DefaultFeature.AutoExposure.Method 1"),
    };
    for (const TCHAR* Cmd : Commands)
    {
        GEngine->Exec(World, Cmd);
    }
}

AScarlineTrackActor* FScarlineWorldBootstrap::EnsurePlayableWorld(UWorld* World)
{
    if (!World) return nullptr;
    ConfigureWorldForDynamicLighting(World);
    HideDefaultLandscape(World);
    EnsureSkyAndSun(World);
    EnsureGroundAndAtmosphere(World);
    EnsurePostProcessExposure(World);
    ApplyRenderDefaults(World);

    AScarlineTrackActor* Track = nullptr;
    for (TActorIterator<AScarlineTrackActor> It(World); It; ++It)
    {
        Track = *It;
        break;
    }
    if (!Track)
    {
        FActorSpawnParameters Params;
        Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
        Track = World->SpawnActor<AScarlineTrackActor>(FVector::ZeroVector, FRotator::ZeroRotator, Params);
    }
    if (!Track) return nullptr;

    Track->Tags.Add(FName(TEXT("ScarlineBootstrap")));
    if (Track->Route) Track->Route->SetDrawDebug(false);

    UMaterialInterface* Road = LoadObject<UMaterialInterface>(
        nullptr, TEXT("/Game/Materials/MI_Asphalt_Track.MI_Asphalt_Track"));
    if (!Road)
    {
        Road = LoadObject<UMaterialInterface>(nullptr, TEXT("/Game/Materials/M_Asphalt.M_Asphalt"));
    }
    if (!Road)
    {
        Road = LoadObject<UMaterialInterface>(nullptr, TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial"));
    }
    UMaterialInterface* Kerb = Road;
    if (Road && !Track->RoadMaterial)
    {
        Track->RoadMaterial = Road;
    }
    else if (Road && Track->RoadMaterial && Track->RoadMaterial->GetName().Contains(TEXT("BasicShape")))
    {
        Track->RoadMaterial = Road;
    }
    if (Road && !Track->KerbMaterial)
    {
        if (UMaterialInstanceDynamic* MID = UMaterialInstanceDynamic::Create(Road, Track))
        {
            MID->SetVectorParameterValue(FName(TEXT("Color")), FLinearColor(0.92f, 0.14f, 0.16f));
            Track->KerbMaterial = MID;
        }
    }
    if (Road && !Track->BarrierMaterial)
    {
        if (UMaterialInstanceDynamic* MID = UMaterialInstanceDynamic::Create(Road, Track))
        {
            MID->SetVectorParameterValue(FName(TEXT("Color")), FLinearColor(0.28f, 0.30f, 0.33f));
            Track->BarrierMaterial = MID;
        }
    }
    if (Road && !Track->CenterLineMaterial)
    {
        if (UMaterialInstanceDynamic* MID = UMaterialInstanceDynamic::Create(Road, Track))
        {
            MID->SetVectorParameterValue(FName(TEXT("Color")), FLinearColor(0.92f, 0.88f, 0.35f));
            Track->CenterLineMaterial = MID;
        }
    }
    Track->SegmentsPerSpan = 32;
    Track->bBuildCenterLine = true;

    Track->UseCoastalLayout();
    Track->RebuildTrack();
    return Track;
}

bool FScarlineWorldBootstrap::GetSuggestedPlayerStart(AScarlineTrackActor* Track, FVector& OutLoc, FRotator& OutRot)
{
    if (!Track || !Track->Route) return false;
    const float Len = Track->Route->GetSplineLength();
    const float StartDist = FMath::Clamp(Len * 0.065f, 1200.f, Len * 0.2f);
    OutLoc = Track->Route->GetLocationAtDistanceAlongSpline(StartDist, ESplineCoordinateSpace::World);
    const FVector Fwd = Track->Route->GetDirectionAtDistanceAlongSpline(StartDist, ESplineCoordinateSpace::World).GetSafeNormal();
    OutRot = Fwd.Rotation();
    OutLoc += Fwd * 120.f;
    OutLoc.Z += 205.f;
    OutRot.Pitch = 0.f;
    OutRot.Roll = 0.f;
    return true;
}