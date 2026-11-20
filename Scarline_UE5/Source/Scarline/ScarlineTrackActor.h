#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "ScarlineTrackActor.generated.h"

class USplineComponent;
class USplineMeshComponent;
class UStaticMesh;
class UMaterialInterface;

UCLASS()
class SCARLINE_API AScarlineTrackActor : public AActor
{
    GENERATED_BODY()
public:
    AScarlineTrackActor();
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Track") TObjectPtr<USplineComponent> Route;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Track|Road", meta=(ClampMin="700.0")) float RoadWidth = 1400.f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Track|Road") TObjectPtr<UStaticMesh> RoadSegmentMesh;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Track|Materials") TObjectPtr<UMaterialInterface> RoadMaterial;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Track|Materials") TObjectPtr<UMaterialInterface> KerbMaterial;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Track|Materials") TObjectPtr<UMaterialInterface> BarrierMaterial;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Track|Road", meta=(ClampMin="10.0")) float RoadThickness = 28.f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Track|Road", meta=(ClampMin="4", ClampMax="40")) int32 SegmentsPerSpan = 16;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Track|Details") bool bBuildSafetyBarriers = true;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Track|Details") bool bBuildKerbs = true;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Track|Details") float BarrierOffset = 850.f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Track|Details") float BarrierHeight = 115.f;
    UFUNCTION(CallInEditor, Category="Track") void RebuildTrack();
    UFUNCTION(CallInEditor, Category="Track") void UseCoastalLayout();
    UFUNCTION(CallInEditor, Category="Track") void UseIndustrialLayout();
protected:
    virtual void OnConstruction(const FTransform& Transform) override;
private:
    UPROPERTY(Transient) TArray<TObjectPtr<USplineMeshComponent>> GeneratedMeshes;
    void ClearGenerated();
    void BuildSplineStrip(float LateralOffset, float Width, float Height, float ZOffset, UMaterialInterface* Material);
    void SetRoute(const TArray<FVector>& Points);
};
