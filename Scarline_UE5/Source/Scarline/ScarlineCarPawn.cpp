#include "ScarlineCarPawn.h"
#include "Camera/CameraComponent.h"
#include "GameFramework/SpringArmComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "GameFramework/PlayerController.h"
#include "UObject/ConstructorHelpers.h"
#include "Engine/StaticMesh.h"
#include "AssetRegistry/AssetRegistryModule.h"

AScarlineCarPawn::AScarlineCarPawn()
{
    PrimaryActorTick.bCanEverTick = true;
    VehicleBody = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("VehicleBody"));
    RootComponent = VehicleBody;
    static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeMesh(TEXT("/Engine/BasicShapes/Cube.Cube"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> CylMesh(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
    static ConstructorHelpers::FObjectFinder<UMaterialInterface> CarMat(
        TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial"));
    if (CubeMesh.Succeeded())
    {
        VehicleBody->SetStaticMesh(CubeMesh.Object);
        VehicleBody->SetRelativeScale3D(FVector(4.2f, 2.0f, 0.62f));
    }
    if (CarMat.Succeeded())
    {
        if (UMaterialInstanceDynamic* MID = UMaterialInstanceDynamic::Create(CarMat.Object, this))
        {
            MID->SetVectorParameterValue(FName(TEXT("Color")), FLinearColor(0.05f, 0.22f, 0.55f));
            VehicleBody->SetMaterial(0, MID);
        }
    }
    VehicleBody->SetCollisionProfileName(TEXT("PhysicsActor"));
    if (!HasAnyFlags(RF_ClassDefaultObject))
    {
        VehicleBody->SetSimulatePhysics(true);
        VehicleBody->SetNotifyRigidBodyCollision(true);
        VehicleBody->SetLinearDamping(0.18f);
        VehicleBody->SetAngularDamping(2.2f);
        VehicleBody->SetMassOverrideInKg(NAME_None, 1380.f, true);
    }

    UStaticMesh* CubeAsset = CubeMesh.Succeeded() ? CubeMesh.Object : nullptr;
    UStaticMesh* CylAsset = CylMesh.Succeeded() ? CylMesh.Object : nullptr;

    auto MakePart = [this, CubeAsset](FName Name, FVector Location) {
        UStaticMeshComponent* Part = CreateDefaultSubobject<UStaticMeshComponent>(Name);
        Part->SetupAttachment(VehicleBody);
        Part->SetRelativeLocation(Location);
        Part->SetCollisionEnabled(ECollisionEnabled::NoCollision);
        Part->SetSimulatePhysics(false);
        if (CubeAsset) Part->SetStaticMesh(CubeAsset);
        return Part;
    };
    FrontBumper = MakePart(TEXT("FrontBumper_Detachable"), FVector(190.f, 0.f, -5.f));
    RearBumper  = MakePart(TEXT("RearBumper_Detachable"), FVector(-190.f, 0.f, -5.f));
    HoodPanel   = MakePart(TEXT("Hood_Detachable"), FVector(95.f, 0.f, 48.f));
    FrontGlass  = MakePart(TEXT("FrontGlass_Breakable"), FVector(55.f, 0.f, 80.f));

    auto MakeWheel = [this, CylAsset](FName Name, FVector Location) {
        UStaticMeshComponent* Wheel = CreateDefaultSubobject<UStaticMeshComponent>(Name);
        Wheel->SetupAttachment(VehicleBody);
        Wheel->SetRelativeLocation(Location);
        Wheel->SetCollisionEnabled(ECollisionEnabled::NoCollision);
        if (CylAsset)
        {
            Wheel->SetStaticMesh(CylAsset);
            Wheel->SetRelativeRotation(FRotator(0.f, 0.f, 90.f));
            Wheel->SetRelativeScale3D(FVector(0.48f, 0.48f, 0.28f));
        }
        return Wheel;
    };
    WheelFL = MakeWheel(TEXT("Wheel_FL"), FVector(158.f, -98.f, -38.f));
    WheelFR = MakeWheel(TEXT("Wheel_FR"), FVector(158.f, 98.f, -38.f));
    WheelRL = MakeWheel(TEXT("Wheel_RL"), FVector(-148.f, -98.f, -38.f));
    WheelRR = MakeWheel(TEXT("Wheel_RR"), FVector(-148.f, 98.f, -38.f));

    if (CarMat.Succeeded())
    {
        const auto Paint = [](UStaticMeshComponent* Part, const FLinearColor& Color, UMaterialInterface* BaseMat, UObject* Outer) {
            if (!Part || !BaseMat) return;
            if (UMaterialInstanceDynamic* MID = UMaterialInstanceDynamic::Create(BaseMat, Outer))
            {
                MID->SetVectorParameterValue(FName(TEXT("Color")), Color);
                Part->SetMaterial(0, MID);
            }
        };
        UMaterialInterface* BaseMat = CarMat.Object;
        Paint(FrontBumper, FLinearColor(0.08f, 0.10f, 0.12f), BaseMat, this);
        Paint(RearBumper, FLinearColor(0.08f, 0.10f, 0.12f), BaseMat, this);
        Paint(HoodPanel, FLinearColor(0.07f, 0.20f, 0.48f), BaseMat, this);
        Paint(FrontGlass, FLinearColor(0.12f, 0.18f, 0.28f), BaseMat, this);
        for (UStaticMeshComponent* Wheel : {WheelFL.Get(), WheelFR.Get(), WheelRL.Get(), WheelRR.Get()})
        {
            Paint(Wheel, FLinearColor(0.06f, 0.06f, 0.07f), BaseMat, this);
        }
    }

    ChaseBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("ChaseBoom"));
    ChaseBoom->SetupAttachment(RootComponent);
    ChaseBoom->TargetArmLength = 520.f;
    ChaseBoom->SetRelativeLocation(FVector(-95.f, 0.f, 118.f));
    ChaseBoom->SetRelativeRotation(FRotator(-8.f, 0.f, 0.f));
    ChaseBoom->SocketOffset = FVector(0.f, 0.f, 72.f);
    ChaseBoom->bDoCollisionTest = true;
    ChaseBoom->ProbeSize = 36.f;
    ChaseBoom->ProbeChannel = ECC_Camera;
    ChaseBoom->bUsePawnControlRotation = false;
    ChaseBoom->bInheritPitch = true;
    ChaseBoom->bInheritYaw = true;
    ChaseBoom->bInheritRoll = false;
    ChaseBoom->bEnableCameraLag = true;
    ChaseBoom->CameraLagSpeed = 8.f;
    ChaseBoom->bEnableCameraRotationLag = true;
    ChaseBoom->CameraRotationLagSpeed = 7.f;
    ChaseCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("ChaseCamera"));
    ChaseCamera->SetupAttachment(ChaseBoom, USpringArmComponent::SocketName);
    ChaseCamera->SetFieldOfView(78.f);
}

void AScarlineCarPawn::BeginPlay()
{
    Super::BeginPlay();
    if (VehicleBody && !VehicleBody->IsSimulatingPhysics())
    {
        VehicleBody->SetSimulatePhysics(true);
        VehicleBody->SetNotifyRigidBodyCollision(true);
        VehicleBody->SetLinearDamping(0.18f);
        VehicleBody->SetAngularDamping(2.2f);
        VehicleBody->SetMassOverrideInKg(NAME_None, 1380.f, true);
    }
    VehicleBody->OnComponentHit.AddDynamic(this, &AScarlineCarPawn::OnVehicleHit);
    for (int32 I = 0; I < VehicleBody->GetNumMaterials(); ++I)
        BodyMaterials.Add(VehicleBody->CreateAndSetMaterialInstanceDynamic(I));
    if (ChaseBoom)
    {
        ChaseBoom->TargetArmLength = 520.f;
        ChaseBoom->bDoCollisionTest = true;
    }
    if (APlayerController* PC = Cast<APlayerController>(GetController()))
        PC->SetViewTarget(this);
    TryApplyHeroVehicleMesh();
}

void AScarlineCarPawn::SetPlaceholderPartsVisible(bool bVisible)
{
    for (UStaticMeshComponent* Part :
         {FrontBumper.Get(), RearBumper.Get(), HoodPanel.Get(), FrontGlass.Get(), WheelFL.Get(), WheelFR.Get(),
          WheelRL.Get(), WheelRR.Get()})
    {
        if (Part) Part->SetVisibility(bVisible, true);
    }
}

void AScarlineCarPawn::TryApplyHeroVehicleMesh()
{
    if (!VehicleBody) return;

    UStaticMesh* Hero = nullptr;
    static const TCHAR* Paths[] = {
        TEXT("/Game/Vehicles/SpectralGT/Spectral_GT_RS_CC0/StaticMeshes/BODY_Shell_Hero.BODY_Shell_Hero"),
        TEXT("/Game/Vehicles/SpectralGT/Spectral_GT_RS_CC0/Spectral_GT_RS_CC0"),
    };
    for (const TCHAR* Path : Paths)
    {
        Hero = LoadObject<UStaticMesh>(nullptr, Path);
        if (Hero) break;
    }
    if (!Hero)
    {
        FAssetRegistryModule& Registry =
            FModuleManager::LoadModuleChecked<FAssetRegistryModule>(TEXT("AssetRegistry"));
        FARFilter Filter;
        Filter.PackagePaths.Add(TEXT("/Game/Vehicles/SpectralGT"));
        Filter.bRecursivePaths = true;
        Filter.ClassPaths.Add(UStaticMesh::StaticClass()->GetClassPathName());
        TArray<FAssetData> Assets;
        Registry.Get().GetAssets(Filter, Assets);
        for (const FAssetData& Data : Assets)
        {
            Hero = Cast<UStaticMesh>(Data.GetAsset());
            if (Hero) break;
        }
    }
    if (!Hero) return;

    VehicleBody->SetStaticMesh(Hero);
    const FBoxSphereBounds Bounds = Hero->GetBounds();
    const FVector Size = Bounds.BoxExtent * 2.f;
    const float TargetLength = 430.f;
    const float UniformScale = TargetLength / FMath::Max3(Size.X, Size.Y, Size.Z);
    VehicleBody->SetRelativeScale3D(FVector(UniformScale));
    VehicleBody->SetRelativeLocation(FVector(0.f, 0.f, -Bounds.Origin.Z * UniformScale + 52.f));
    if (UStaticMesh* Hub = LoadObject<UStaticMesh>(
            nullptr, TEXT("/Game/Vehicles/SpectralGT/Spectral_GT_RS_CC0/SkeletalMeshes/Wheel_Hub.Wheel_Hub")))
    {
        for (UStaticMeshComponent* Wheel : {WheelFL.Get(), WheelFR.Get(), WheelRL.Get(), WheelRR.Get()})
        {
            if (!Wheel) continue;
            Wheel->SetStaticMesh(Hub);
            Wheel->SetRelativeScale3D(FVector(0.85f, 0.85f, 0.85f));
            Wheel->SetVisibility(true, true);
        }
    }
    SetPlaceholderPartsVisible(false);
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
    {
        if (Wheel)
        {
            Wheel->SetRelativeRotation(FRotator(FMath::RadiansToDegrees(WheelSpin), 0.f, 90.f));
        }
    }
    if (ChaseCamera)
    {
        ChaseCamera->SetFieldOfView(
            FMath::FInterpTo(ChaseCamera->FieldOfView, 78.f + FMath::Clamp(SpeedKmh / 260.f, 0.f, 1.f) * 8.f, Dt, 2.2f));
    }
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
