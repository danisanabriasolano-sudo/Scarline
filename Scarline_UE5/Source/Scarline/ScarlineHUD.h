#pragma once
#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "ScarlineHUD.generated.h"

UCLASS()
class SCARLINE_API AScarlineHUD : public AHUD
{
    GENERATED_BODY()
public:
    virtual void DrawHUD() override;
};
