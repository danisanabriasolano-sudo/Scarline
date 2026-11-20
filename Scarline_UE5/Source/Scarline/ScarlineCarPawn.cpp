#include "ScarlineCarPawn.h"
#include "Camera/CameraComponent.h"
#include "GameFramework/SpringArmComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "GameFramework/PlayerController.h"

AScarlineCarPawn::AScarlineCarPawn()
{
    PrimaryActorTick.bCanEverTick = true;
    VehicleBody = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("VehicleBody"));
    RootComponent = VehicleBody;
    VehicleBody->SetSimulatePhysics(true);
    VehicleBody->SetNotifyRigidBodyCollision(true);
    VehicleBody->SetLinearDamping(0.18f);
    VehicleBody->SetAngularDamping(2.2f);
    VehicleBody->SetCollisionProfileName(TEXT("PhysicsActor"));
    VehicleBody->SetMassOverrideInKg(NAME_None, 1380.f, true);

    auto MakePart = [this](FName Name, FVector Location) {
        UStaticMeshComponent* Part = CreateDefaultSubobject<UStaticMeshComponent>(Name);
        Part->SetupAttachment(VehicleBody);
        Part->SetRelativeLocation(Location);
        Part->SetCollisionEnabled(ECollisionEnabled::NoCollision);
        Part->SetSimulatePhysics(false);
        return Part;
    };
    FrontBumper = MakePart(TEXT("FrontBumper_Detachable"), FVector(190.f, 0.f, -5.f));
    RearBumper  = MakePart(TEXT("RearBumper_Detachable"), FVector(-190.f, 0.f, -5.f));
    HoodPanel   = MakePart(TEXT("Hood_Detachable"), FVector(95.f, 0.f, 48.f));
    FrontGlass  = MakePart(TEXT("FrontGlass_Breakable"), FVector(55.f, 0.f, 80.f));

    auto MakeWheel = [this](FName Name, FVector Location) {
        UStaticMeshComponent* Wheel = CreateDefaultSubobject<UStaticMeshComponent>(Name);
        Wheel->SetupAttachment(VehicleBody);
        Wheel->SetRelativeLocation(Location);
        Wheel->SetCollisionEnabled(ECollisionEnabled::NoCollision);
        return Wheel;
    };
    WheelFL = MakeWheel(TEXT("Wheel_FL"), FVector(125.f, -88.f, -32.f));
    WheelFR = MakeWheel(TEXT("Wheel_FR"), FVector(125.f, 88.f, -32.f));
    WheelRL = MakeWheel(TEXT("Wheel_RL"), FVector(-125.f, -88.f, -32.f));
    WheelRR = MakeWheel(TEXT("Wheel_RR"), FVector(-125.f, 88.f, -32.f));

    ChaseBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("ChaseBoom"));
    ChaseBoom->SetupAttachment(RootComponent);
    ChaseBoom->TargetArmLength = 720.f;
    ChaseBoom->SetRelativeLocation(FVector(-20.f, 0.f, 145.f));
    ChaseBoom->SetRelativeRotation(FRotator(-10.f, 0.f, 0.f));
    ChaseBoom->bEnableCameraLag = true;
    ChaseBoom->CameraLagSpeed = 8.f;
    ChaseBoom->bEnableCameraRotationLag = true;
    ChaseBoom->CameraRotationLagSpeed = 7.f;
    ChaseCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("ChaseCamera"));
    ChaseCamera->SetupAttachment(ChaseBoom, USpringArmComponent::SocketName);
    ChaseCamera->SetFieldOfView(88.f);
}

void AScarlineCarPawn::BeginPlay()
{
    Super::BeginPlay();
    VehicleBody->OnComponentHit.AddDynamic(this, &AScarlineCarPawn::OnVehicleHit);
    for (int32 I = 0; I < VehicleBody->GetNumMaterials(); ++I)
        BodyMaterials.Add(VehicleBody->CreateAndSetMaterialInstanceDynamic(I));
}

void AScarlineCarPawn::Tick(float Dt)
{
    Super::Tick(Dt);
    if (!VehicleBody || !VehicleBody->IsSimulatingPhysics()) return;

    const FVector Velocity = VehicleBody->GetPhysicsLinearVelocity();
    SpeedKmh = Velocity.Size() * 0.036f;
    const FVector Forward = VehicleBody->GetForwardVector();
    const float ForwardSpeed = FVector::DotProduct(Velocity, Forward);

    const float DamageForceScale = 1.f - (BodyDamage / 100.f) * MaxSpeedPenaltyPct;
    if (FMath::Abs(Throttle) > 0.01f)
        VehicleBody->AddForce(Forward * Throttle * DriveForce * DamageForceScale);
    if (FMath::Abs(Steering) > 0.01f && FMath::Abs(ForwardSpeed) > 180.f)
    {
        const float SpeedFactor = FMath::Clamp(FMath::Abs(ForwardSpeed) / 1800.f, 0.18f, 1.f);
        VehicleBody->AddTorqueInRadians(FVector(0.f, 0.f, Steering * SteeringTorque * SpeedFactor));
    }
    if (Brake > 0.01f && Velocity.SizeSquared() > 1.f)
        VehicleBody->AddForce(-Velocity.GetSafeNormal() * Brake * BrakeForce);

    if (bBoost && BoostCharge > 0.f)
    {
        VehicleBody->AddForce(Forward * BoostForce);
        BoostCharge = FMath::Max(0.f, BoostCharge - BoostDrainPerSecond * Dt);
    }
    else BoostCharge = FMath::Min(100.f, BoostCharge + BoostRechargePerSecond * Dt);

    WheelSpin += (ForwardSpeed / 35.f) * Dt;
    const FRotator WheelRotation(FMath::RadiansToDegrees(WheelSpin), 0.f, 0.f);
    for (UStaticMeshComponent* Wheel : {WheelFL.Get(), WheelFR.Get(), WheelRL.Get(), WheelRR.Get()})
        if (Wheel) Wheel->SetRelativeRotation(WheelRotation);
    if (ChaseCamera) ChaseCamera->SetFieldOfView(FMath::FInterpTo(ChaseCamera->FieldOfView, 88.f + FMath::Clamp(SpeedKmh / 260.f, 0.f, 1.f) * 9.f, Dt, 2.2f));
}

void AScarlineCarPawn::SetupPlayerInputComponent(UInputComponent* Input)
{
    Super::SetupPlayerInputComponent(Input);
    Input->BindAxis(TEXT("Throttle"), this, &AScarlineCarPawn::SetThrottle);
    Input->BindAxis(TEXT("Steering"), this, &AScarlineCarPawn::SetSteering);
    Input->BindAxis(TEXT("Brake"), this, &AScarlineCarPawn::SetBrake);
    Input->BindAction(TEXT("Boost"), IE_Pressed, this, &AScarlineCarPawn::BoostPressed);
    Input->BindAction(TEXT("Boost"), IE_Released, this, &AScarlineCarPawn::BoostReleased);
}

void AScarlineCarPawn::SetMobileThrottle(float V) { Throttle = FMath::Clamp(V, -1.f, 1.f); }
void AScarlineCarPawn::SetMobileSteering(float V) { Steering = FMath::Clamp(V, -1.f, 1.f); }
void AScarlineCarPawn::SetMobileBrake(float V) { Brake = FMath::Clamp(V, 0.f, 1.f); }
void AScarlineCarPawn::SetMobileBoost(bool bPressed) { bBoost = bPressed; }

void AScarlineCarPawn::OnVehicleHit(UPrimitiveComponent*, AActor*, UPrimitiveComponent*, FVector Impulse, const FHitResult& Hit)
{
    const float Impact = Impulse.Size();
    if (Impact < ImpactThreshold) return;
    const float AddedDamage = FMath::Clamp((Impact - ImpactThreshold) * DamageScale, 0.15f, 8.f);
    BodyDamage = FMath::Clamp(BodyDamage + AddedDamage, 0.f, 100.f);
    UpdateDamageMaterials();
    BP_OnDamageChanged(BodyDamage);
    BP_OnImpact(Hit.ImpactPoint, Impact);

    const FVector LocalHit = VehicleBody->GetComponentTransform().InverseTransformPosition(Hit.ImpactPoint);
    if (LocalHit.X > 105.f && BodyDamage >= DetachThreshold && FrontBumper && FrontBumper->IsAttachedTo(VehicleBody))
        DetachPart(FrontBumper, TEXT("FrontBumper"), Hit.ImpactPoint, Impulse);
    else if (LocalHit.X < -105.f && BodyDamage >= DetachThreshold && RearBumper && RearBumper->IsAttachedTo(VehicleBody))
        DetachPart(RearBumper, TEXT("RearBumper"), Hit.ImpactPoint, Impulse);
    else if (LocalHit.X > 15.f && LocalHit.X < 150.f && LocalHit.Z > 25.f && BodyDamage >= DetachThreshold + 12.f && HoodPanel && HoodPanel->IsAttachedTo(VehicleBody))
        DetachPart(HoodPanel, TEXT("Hood"), Hit.ImpactPoint, Impulse);
    else if (LocalHit.X > 35.f && LocalHit.Z > 55.f && BodyDamage >= DetachThreshold + 22.f && !bFrontGlassBroken)
    {
        bFrontGlassBroken = true;
        if (FrontGlass) FrontGlass->SetVisibility(false, true);
        BP_OnPartDetached(TEXT("FrontGlassBroken"), Hit.ImpactPoint);
    }
}

void AScarlineCarPawn::DetachPart(UStaticMeshComponent* Part, FName PartName, const FVector& HitLocation, const FVector& Impulse)
{
    if (!Part || !Part->IsAttachedTo(VehicleBody)) return;
    Part->DetachFromComponent(FDetachmentTransformRules::KeepWorldTransform);
    Part->SetCollisionProfileName(TEXT("PhysicsActor"));
    Part->SetSimulatePhysics(true);
    Part->SetEnableGravity(true);
    Part->AddImpulse(Impulse.GetClampedToMaxSize(120000.f) * 0.28f + (HitLocation - GetActorLocation()).GetSafeNormal() * 22000.f);
    Part->AddAngularImpulseInDegrees(FVector(18000.f, 12000.f, 9000.f));
    BP_OnPartDetached(PartName, HitLocation);
}

void AScarlineCarPawn::UpdateDamageMaterials()
{
    for (UMaterialInstanceDynamic* MID : BodyMaterials)
        if (MID) MID->SetScalarParameterValue(TEXT("Damage"), BodyDamage / 100.f);
}

void AScarlineCarPawn::RepairVehicle()
{
    BodyDamage = 0.f;
    BoostCharge = 100.f;
    bFrontGlassBroken = false;
    for (UStaticMeshComponent* Part : {FrontBumper.Get(), RearBumper.Get(), HoodPanel.Get(), FrontGlass.Get()})
    {
        if (!Part) continue;
        if (!Part->IsAttachedTo(VehicleBody))
        {
            Part->SetSimulatePhysics(false);
            Part->SetCollisionEnabled(ECollisionEnabled::NoCollision);
            Part->AttachToComponent(VehicleBody, FAttachmentTransformRules::KeepRelativeTransform);
        }
        Part->SetVisibility(true, true);
    }
    UpdateDamageMaterials();
    BP_OnDamageChanged(BodyDamage);
}
