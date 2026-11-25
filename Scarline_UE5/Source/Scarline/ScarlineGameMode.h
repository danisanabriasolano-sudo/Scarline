#pragma once
#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "ScarlineGameMode.generated.h"

class AScarlineTrackActor;

UCLASS()
class SCARLINE_API AScarlineGameMode : public AGameModeBase
{
    GENERATED_BODY()
public:
    AScarlineGameMode();
    virtual void StartPlay() override;
    virtual void RestartPlayer(AController* NewPlayer) override;

    UPROPERTY(EditAnywhere, Category="Scarline")
    bool bAutoBootstrapWorld = true;

private:
    UPROPERTY() TObjectPtr<AScarlineTrackActor> BootstrapTrack;
};