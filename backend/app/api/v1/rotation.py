from fastapi import APIRouter, Depends, Query
from backend.app.models.user import User
from backend.app.schemas.rotation import CropRotationResponse
from backend.app.security.auth import get_current_user
from backend.app.services.rotation import recommend_rotations

router = APIRouter(prefix="/rotation", tags=["Crop Rotation"])


@router.get("/recommend", response_model=CropRotationResponse)
def get_rotation_recommendations(
    previous_crop: str = Query("Cotton", description="Preceding harvested crop"),
    current_user: User = Depends(get_current_user),
):
    """
    Returns rule-based crop rotation suggestions citing biological nitrogen restoration,
    pathogen cycle disruption, and pest breaks.
    """
    return recommend_rotations(previous_crop=previous_crop)
