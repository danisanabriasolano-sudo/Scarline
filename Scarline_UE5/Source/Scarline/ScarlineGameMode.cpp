#include "ScarlineGameMode.h"
#include "ScarlineCarPawn.h"
#include "ScarlineHUD.h"
AScarlineGameMode::AScarlineGameMode()
{
    DefaultPawnClass = AScarlineCarPawn::StaticClass();
    HUDClass = AScarlineHUD::StaticClass();
}
