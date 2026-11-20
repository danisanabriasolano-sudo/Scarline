#include "ScarlineHUD.h"
#include "ScarlineCarPawn.h"
#include "Engine/Canvas.h"
#include "Engine/Engine.h"
#include "GameFramework/PlayerController.h"

void AScarlineHUD::DrawHUD()
{
    Super::DrawHUD();
    const APlayerController* PC = GetOwningPlayerController();
    const AScarlineCarPawn* Car = PC ? Cast<AScarlineCarPawn>(PC->GetPawn()) : nullptr;
    if (!Car || !Canvas) return;
    const float W = Canvas->SizeX;
    const float H = Canvas->SizeY;
    const float Scale = FMath::Clamp(W / 1920.f, 0.65f, 1.35f);
    UFont* Font = GEngine ? GEngine->GetLargeFont() : nullptr;
    if (!Font) return;

    const FString Speed = FString::Printf(TEXT("%03d"), FMath::RoundToInt(Car->SpeedKmh));
    const FString Damage = FString::Printf(TEXT("DAMAGE  %02d%%"), FMath::RoundToInt(Car->BodyDamage));
    const FString Boost = FString::Printf(TEXT("BOOST  %02d%%"), FMath::RoundToInt(Car->BoostCharge));
    DrawText(Speed, FLinearColor::White, 42.f * Scale, H - 138.f * Scale, Font, 2.2f * Scale, false);
    DrawText(TEXT("KM/H"), FLinearColor(0.65f,0.72f,0.78f), 45.f * Scale, H - 83.f * Scale, Font, 0.72f * Scale, false);
    DrawText(Damage, Car->BodyDamage > 65.f ? FLinearColor(1.f,0.22f,0.12f) : FLinearColor::White, W - 250.f * Scale, 45.f * Scale, Font, 0.78f * Scale, false);
    DrawText(Boost, FLinearColor(1.f,0.48f,0.12f), W - 250.f * Scale, 75.f * Scale, Font, 0.78f * Scale, false);
}
