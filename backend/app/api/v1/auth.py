from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.database.session import get_db
from backend.app.models.user import User, UserRole, Language
from backend.app.models.farm import Farm, OwnershipType, IrrigationMethod, CurrentCropCycle, CropStage
from backend.app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    DemoLoginResponse,
    DemoFarmSummary,
)
from backend.app.security.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )
    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        role=user_in.role,
        preferred_language=user_in.preferred_language,
        is_active=True,
        is_demo_account=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive.",
        )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/demo-login", response_model=DemoLoginResponse)
def demo_login(db: Session = Depends(get_db)):
    """
    One-click Demo Mode:
    Only ever returns demo farmer Ramesh (role Farmer).
    Only permitted when DEMO_MODE=true in settings.
    Admin, Expert, and Buyer roles never receive passwordless login.
    """
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="One-click demo login is disabled in this environment (DEMO_MODE=false).",
        )

    demo_email = "ramesh@agrisage.demo"
    user = db.query(User).filter(User.email == demo_email).first()

    if not user:
        # Create Ramesh
        user = User(
            email=demo_email,
            hashed_password=hash_password(settings.DEMO_FARMER_PASSWORD),
            full_name="Ramesh Kumar (Demo Farmer)",
            phone_number="+919876543210",
            role=UserRole.FARMER,
            preferred_language=Language.TE,
            is_active=True,
            is_demo_account=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Ensure Ramesh has a preloaded farm
    farm = db.query(Farm).filter(Farm.user_id == user.id).first()
    if not farm:
        farm = Farm(
            user_id=user.id,
            name="Rameshwaram Farm (Warangal)",
            area=5.0,
            ownership_type=OwnershipType.MIXED,
            owned_area=3.0,
            leased_area=2.0,
            lease_amount=12000.0,
            soil_type="Red Loam",
            water_source="Borewell & Canal",
            irrigation_method=IrrigationMethod.DRIP,
            budget=45000.0,
            village="Geikonda",
            district="Warangal",
            state="Telangana",
            latitude=17.9689,
            longitude=79.5941,
        )
        db.add(farm)
        db.commit()
        db.refresh(farm)

        # Preload active cotton cycle
        cycle = CurrentCropCycle(
            farm_id=farm.id,
            crop_name="Cotton",
            variety="Bollgard II Hybrid",
            planting_date=date(2026, 8, 15),
            expected_harvest_date=date(2027, 1, 15),
            current_stage=CropStage.FLOWERING,
            is_active=True,
        )
        db.add(cycle)
        db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role.value})

    farm_summary = DemoFarmSummary(
        id=farm.id,
        name=farm.name,
        area=farm.area,
        ownership_type=farm.ownership_type.value,
        owned_area=farm.owned_area,
        leased_area=farm.leased_area,
        lease_amount=farm.lease_amount,
        village=farm.village,
        district=farm.district,
        state=farm.state,
        latitude=farm.latitude,
        longitude=farm.longitude,
    )

    return DemoLoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
        farm=farm_summary,
        active_crop="Cotton (Flowering Stage)",
        message="Demo Mode session initialized successfully for Ramesh (Farmer).",
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

