from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.farm import Farm
from backend.app.schemas.farm import FarmCreate, FarmUpdate, FarmResponse
from backend.app.security.auth import get_current_user

router = APIRouter(prefix="/farms", tags=["Farms"])


@router.get("", response_model=List[FarmResponse])
def list_farms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    farms = db.query(Farm).filter(Farm.user_id == current_user.id).all()
    return farms


@router.post("", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
def create_farm(
    farm_in: FarmCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    farm = Farm(
        user_id=current_user.id,
        name=farm_in.name,
        area=farm_in.area,
        ownership_type=farm_in.ownership_type,
        owned_area=farm_in.owned_area,
        leased_area=farm_in.leased_area,
        lease_amount=farm_in.lease_amount,
        soil_type=farm_in.soil_type,
        water_source=farm_in.water_source,
        irrigation_method=farm_in.irrigation_method,
        budget=farm_in.budget,
        village=farm_in.village,
        district=farm_in.district,
        state=farm_in.state,
        latitude=farm_in.latitude,
        longitude=farm_in.longitude,
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("/{id}", response_model=FarmResponse)
def get_farm(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    farm = db.query(Farm).filter(Farm.id == id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with id {id} not found or does not belong to the authenticated user.",
        )
    return farm


@router.put("/{id}", response_model=FarmResponse)
def update_farm(
    id: int,
    farm_in: FarmUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    farm = db.query(Farm).filter(Farm.id == id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with id {id} not found.",
        )

    update_data = farm_in.model_dump(exclude_unset=True)

    # Validate ownership consistency on update
    new_area = update_data.get("area", farm.area)
    new_type = update_data.get("ownership_type", farm.ownership_type)
    new_owned = update_data.get("owned_area", farm.owned_area)
    new_leased = update_data.get("leased_area", farm.leased_area)

    if new_type == "mixed":
        if abs((new_owned + new_leased) - new_area) > 0.01:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Owned area ({new_owned}) + Leased area ({new_leased}) must equal total area ({new_area}).",
            )

    for key, value in update_data.items():
        setattr(farm, key, value)

    db.commit()
    db.refresh(farm)
    return farm

