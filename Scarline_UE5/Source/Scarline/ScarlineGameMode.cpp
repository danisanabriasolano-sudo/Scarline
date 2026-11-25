#include "ScarlineGameMode.h"
#include "ScarlineCarPawn.h"
#include "ScarlineHUD.h"
#include "ScarlineWorldBootstrap.h"
#include "ScarlineTrackActor.h"
#include "GameFramework/PlayerController.h"
#include "Engine/Engine.h"
#include "TimerManager.h"

AScarlineGameMode::AScarlineGameMode()
{
    DefaultPawnClass = AScarlineCarPawn::StaticClass();
    HUDClass = AScarlineHUD::StaticClass();
    bAutoBootstrapWorld = true;
}

void AScarlineGameMode::StartPlay()
{
    BootstrapTrack = nullptr;
    UWorld* World = GetWorld();
    if (bAutoBootstrapWorld && World)
    {
        BootstrapTrack = FScarlineWorldBootstrap::EnsurePlayableWorld(World);
        FScarlineWorldBootstrap::ApplyRenderDefaults(World);
        FTimerHandle SkylightTimer;
        World->GetTimerManager().SetTimer(
            SkylightTimer,
            [World]()
            {
                FScarlineWorldBootstrap::RefreshSkylightCapture(World);
                FScarlineWorldBootstrap::ApplyRenderDefaults(World);
            },
            1.0f,
            false);
    }
    Super::StartPlay();
}

void AScarlineGameMode::RestartPlayer(AController* NewPlayer)
{
    Super::RestartPlayer(NewPlayer);
    if (!BootstrapTrack || !NewPlayer) return;
    APawn* Pawn = NewPlayer->GetPawn();
    if (!Pawn) return;
    FVector Loc;
    FRotator Rot;
    if (FScarlineWorldBootstrap::GetSuggestedPlayerStart(BootstrapTrack, Loc, Rot))
    {
        Pawn->SetActorLocationAndRotation(Loc, Rot, false, nullptr, ETeleportType::TeleportPhysics);
        if (APlayerController* PC = Cast<APlayerController>(NewPlayer))
        {
            PC->SetControlRotation(Rot);
            PC->ClientSetRotation(Rot, false);
        }
    }
}