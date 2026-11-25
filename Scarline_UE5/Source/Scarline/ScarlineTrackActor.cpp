#include "ScarlineTrackActor.h"
#include "Components/SplineComponent.h"
#include "Components/SplineMeshComponent.h"
#include "UObject/ConstructorHelpers.h"
#include "Engine/StaticMesh.h"
#include "Materials/MaterialInterface.h"

AScarlineTrackActor::AScarlineTrackActor()
{
    PrimaryActorTick.bCanEverTick = false;
    Route = CreateDefaultSubobject<USplineComponent>(TEXT("TrackRoute"));
    RootComponent = Route;
    Route->SetClosedLoop(true);
    Route->SetDrawDebug(false);
}

void AScarlineTrackActor::OnConstruction(const FTransform& Transform)
{
    Super::OnConstruction(Transform);
    if (Route->GetNumberOfSplinePoints() < 4)
    {
        const TArray<FVector> DefaultPoints = {
            FVector(-12000.f, -3000.f, 0.f), FVector(-4500.f, -3000.f, 0.f),
            FVector(2500.f, -3000.f, 0.f), FVector(9500.f, -2500.f, 0.f),
            FVector(13200.f, 500.f, 0.f), FVector(14000.f, 5200.f, 0.f),
            FVector(11200.f, 8500.f, 0.f), FVector(6500.f, 9000.f, 0.f),
            FVector(2500.f, 6500.f, 0.f), FVector(-1000.f, 7800.f, 0.f),
            FVector(-6500.f, 9200.f, 0.f), FVector(-10500.f, 6500.f, 0.f),
            FVector(-12500.f, 2500.f, 0.f)
        };
        SetRoute(DefaultPoints);
    }
    RebuildTrack();
}

void AScarlineTrackActor::SetRoute(const TArray<FVector>& Points)
{
    Route->ClearSplinePoints(false);
    for (const FVector& Point : Points) Route->AddSplinePoint(Point, ESplineCoordinateSpace::Local, false);
    Route->SetClosedLoop(true, false);
    Route->SetSplinePointType(0, ESplinePointType::Curve, false);
    Route->UpdateSpline();
}

void AScarlineTrackActor::UseCoastalLayout()
{
    SetRoute({ FVector(-15000,-4500,0), FVector(-7000,-4500,0), FVector(1000,-4500,0), FVector(9000,-4000,0),
        FVector(13500,-1500,0), FVector(14500,2500,0), FVector(13000,5000,0), FVector(9000,5600,0),
        FVector(6500,3500,0), FVector(3000,2500,0), FVector(-1500,4000,0), FVector(-6500,6500,0),
        FVector(-11500,5000,0), FVector(-14500,1000,0) });
    RebuildTrack();
}

void AScarlineTrackActor::UseIndustrialLayout()
{
    SetRoute({ FVector(-13000,-6500,0), FVector(-3000,-6500,0), FVector(7000,-6500,0), FVector(10500,-5000,0),
        FVector(10500,-1800,0), FVector(7000,-800,0), FVector(4500,1800,0), FVector(8500,4000,0),
        FVector(11000,7000,0), FVector(6500,8500,0), FVector(1000,7000,0), FVector(-3500,8500,0),
        FVector(-8500,6500,0), FVector(-10500,3500,0), FVector(-7000,1000,0), FVector(-12000,-1000,0) });
    RebuildTrack();
}

void AScarlineTrackActor::ClearGenerated()
{
    for (USplineMeshComponent* Mesh : GeneratedMeshes)
        if (IsValid(Mesh)) Mesh->DestroyComponent();
    GeneratedMeshes.Reset();
}

void AScarlineTrackActor::BuildSplineStrip(float LateralOffset, float Width, float Height, float ZOffset, UMaterialInterface* Material)
{
    UStaticMesh* Cube = RoadSegmentMesh ? RoadSegmentMesh.Get() : LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cube.Cube"));
    if (!Cube || Route->GetNumberOfSplinePoints() < 2) return;
    const int32 SpanCount = Route->IsClosedLoop() ? Route->GetNumberOfSplinePoints() : Route->GetNumberOfSplinePoints() - 1;
    for (int32 Span = 0; Span < SpanCount; ++Span)
    {
        const float StartDistance = Route->GetDistanceAlongSplineAtSplinePoint(Span);
        const float EndDistance = (Span == SpanCount - 1 && Route->IsClosedLoop()) ? Route->GetSplineLength() : Route->GetDistanceAlongSplineAtSplinePoint(Span + 1);
        const int32 Count = FMath::Max(2, SegmentsPerSpan);
        for (int32 Segment = 0; Segment < Count; ++Segment)
        {
            const float A = FMath::Lerp(StartDistance, EndDistance, float(Segment) / Count);
            const float B = FMath::Lerp(StartDistance, EndDistance, float(Segment + 1) / Count);
            const FVector P0 = Route->GetLocationAtDistanceAlongSpline(A, ESplineCoordinateSpace::Local);
            const FVector P1 = Route->GetLocationAtDistanceAlongSpline(B, ESplineCoordinateSpace::Local);
            const FVector T0 = Route->GetTangentAtDistanceAlongSpline(A, ESplineCoordinateSpace::Local);
            const FVector T1 = Route->GetTangentAtDistanceAlongSpline(B, ESplineCoordinateSpace::Local);
            const FVector R0 = FVector::CrossProduct(FVector::UpVector, T0.GetSafeNormal()).GetSafeNormal();
            const FVector R1 = FVector::CrossProduct(FVector::UpVector, T1.GetSafeNormal()).GetSafeNormal();
            const float SeamOverlap = 14.f;
            const FVector Dir0 = T0.GetSafeNormal();
            const FVector Dir1 = T1.GetSafeNormal();
            const FVector Start = P0 + R0 * LateralOffset + FVector(0, 0, ZOffset) - Dir0 * (Segment > 0 ? SeamOverlap * 0.5f : 0.f);
            const FVector End = P1 + R1 * LateralOffset + FVector(0, 0, ZOffset) + Dir1 * SeamOverlap;
            USplineMeshComponent* Mesh = NewObject<USplineMeshComponent>(this);
            Mesh->SetMobility(EComponentMobility::Movable);
            Mesh->SetStaticMesh(Cube);
            if (Material) Mesh->SetMaterial(0, Material);
            Mesh->SetForwardAxis(ESplineMeshAxis::X, false);
            Mesh->SetStartAndEnd(Start, T0, End, T1, true);
            const float ScaleW = (Width / 100.f) * 1.012f;
            const float ScaleH = Height / 100.f;
            Mesh->SetStartScale(FVector2D(ScaleW, ScaleH));
            Mesh->SetEndScale(FVector2D(ScaleW, ScaleH));
            Mesh->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
            Mesh->SetCollisionProfileName(TEXT("BlockAll"));
            Mesh->AttachToComponent(RootComponent, FAttachmentTransformRules::KeepRelativeTransform);
            Mesh->RegisterComponent();
            GeneratedMeshes.Add(Mesh);
        }
    }
}

void AScarlineTrackActor::RebuildTrack()
{
    ClearGenerated();
    if (!Route || Route->GetNumberOfSplinePoints() < 4) return;
    BuildSplineStrip(0.f, RoadWidth, RoadThickness, -RoadThickness * 0.5f, RoadMaterial);
    if (bBuildCenterLine && CenterLineMaterial)
    {
        BuildSplineStrip(0.f, 38.f, 6.f, RoadThickness * 0.25f, CenterLineMaterial);
    }
    if (bBuildKerbs)
    {
        BuildSplineStrip(-(RoadWidth * 0.5f + 45.f), 90.f, 14.f, 2.f, KerbMaterial);
        BuildSplineStrip( (RoadWidth * 0.5f + 45.f), 90.f, 14.f, 2.f, KerbMaterial);
    }
    if (bBuildSafetyBarriers)
    {
        BuildSplineStrip(-BarrierOffset, 42.f, BarrierHeight, BarrierHeight * 0.5f, BarrierMaterial);
        BuildSplineStrip( BarrierOffset, 42.f, BarrierHeight, BarrierHeight * 0.5f, BarrierMaterial);
    }
}
