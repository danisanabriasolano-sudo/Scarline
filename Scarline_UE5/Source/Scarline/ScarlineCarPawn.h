#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Pawn.h"
#include "ScarlineCarPawn.generated.h"

class UStaticMeshComponent;
class USpringArmComponent;
class UCameraComponent;
class UMaterialInstanceDynamic;

UCLASS()
class SCARLINE_API AScarlineCarPawn : public APawn
{
    GENERATED_BODY()
public:
    AScarlineCarPawn();
    virtual void Tick(float DeltaSeconds) override;
    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle") TObjectPtr<UStaticMeshComponent> VehicleBody;
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle") TObjectPtr<UStaticMeshComponent> FrontBumper;
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle") TObjectPtr<UStaticMeshComponent> RearBumper;
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle") TObjectPtr<UStaticMeshComponent> HoodPanel;
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle") TObjectPtr<UStaticMeshComponent> FrontGlass;
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle") TObjectPtr<UStaticMeshComponent> WheelFL;
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle") TObjectPtr<UStaticMeshComponent> WheelFR;
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle") TObjectPtr<UStaticMeshComponent> WheelRL;
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Vehicle") TObjectPtr<UStaticMeshComponent> WheelRR;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Driving") float DriveForce = 165000.f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Driving") float SteeringTorque = 7200000.f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Driving") float BrakeForce = 145000.f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Boost") float BoostForce = 260000.f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Boost") float BoostDrainPerSecond = 28.f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Boost") float BoostRechargePerSecond = 12.f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Damage") float ImpactThreshold = 32000.f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Damage") float DamageScale = 0.0000038f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Damage") float DetachThreshold = 88.f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Damage") float MaxSpeedPenaltyPct = 0.08f;
    UPROPERTY(BlueprintReadOnly, Category="Damage") float BodyDamage = 0.f;
    UPROPERTY(BlueprintReadOnly, Category="Boost") float BoostCharge = 100.f;
    UPROPERTY(BlueprintReadOnly, Category="Driving") float SpeedKmh = 0.f;

    UFUNCTION(BlueprintCallable, Category="Mobile Controls") void SetMobileThrottle(float Value);
    UFUNCTION(BlueprintCallable, Category="Mobile Controls") void SetMobileSteering(float Value);
    UFUNCTION(BlueprintCallable, Category="Mobile Controls") void SetMobileBrake(float Value);
    UFUNCTION(BlueprintCallable, Category="Mobile Controls") void SetMobileBoost(bool bPressed);
    UFUNCTION(BlueprintCallable, Category="Damage") void RepairVehicle();

    UFUNCTION(BlueprintImplementableEvent, Category="Effects") void BP_OnImpact(FVector_NetQuantize Location, float Strength);
    UFUNCTION(BlueprintImplementableEvent, Category="Effects") void BP_OnPartDetached(FName PartName, FVector_NetQuantize Location);
    UFUNCTION(BlueprintImplementableEvent, Category="Damage") void BP_OnDamageChanged(float NewDamage);

protected:
    virtual void BeginPlay() override;
private:
    UPROPERTY() TObjectPtr<USpringArmComponent> ChaseBoom;
    UPROPERTY() TObjectPtr<UCameraComponent> ChaseCamera;
    UPROPERTY() TArray<TObjectPtr<UMaterialInstanceDynamic>> BodyMaterials;
    float Throttle = 0.f;
    float Steering = 0.f;
    float Brake = 0.f;
    float WheelSpin = 0.f;
    bool bBoost = false;
    bool bFrontGlassBroken = false;

    void SetThrottle(float V) { Throttle = V; }
    void SetSteering(float V) { Steering = V; }
    void SetBrake(float V) { Brake = V; }
    void BoostPressed() { bBoost = true; }
    void BoostReleased() { bBoost = false; }
    UFUNCTION() void OnVehicleHit(UPrimitiveComponent* HitComponent, AActor* OtherActor, UPrimitiveComponent* OtherComp, FVector NormalImpulse, const FHitResult& Hit);
    void DetachPart(UStaticMeshComponent* Part, FName PartName, const FVector& HitLocation, const FVector& Impulse);
    void UpdateDamageMaterials();
    void TryApplyHeroVehicleMesh();
    void SetPlaceholderPartsVisible(bool bVisible);
};
