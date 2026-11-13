"""
Machinery API Endpoints: Mechanization Guide, Distance-Ranked Search & Booking Flow
Yuktik 2026 Hackathon | AgriSage AI Machinery Module
"""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.database.session import get_db, utc_now
from backend.app.security.auth import get_current_user
from backend.app.models.user import User
from backend.app.models.farm import Farm
from backend.app.models.machinery import MachineryListing, MachineryBooking
from backend.app.schemas.machinery import (
    MachineryGuideResponse,
    MachineryListingCreate,
    MachineryListingResponse,
    MachineryBookingCreate,
    MachineryBookingResponse,
    BookingStatusUpdate,
)
from backend.app.services.machinery_service import (
    get_machinery_guide_for_crop,
    haversine_distance,
)

router = APIRouter(prefix="/machinery", tags=["Machinery Rental Hub"])


def _format_owner_alias(full_name: str) -> str:
    parts = full_name.strip().split()
    if len(parts) >= 2:
        return f"{parts[0]} {parts[1][0]}."
    elif parts:
        return parts[0]
    return "Owner"


# ==============================================================================
# 1. Agronomic Crop-Stage Mechanization Guide
# ==============================================================================

@router.get("/guide", response_model=MachineryGuideResponse)
def get_machinery_guide(crop: Optional[str] = Query(default=None, description="Crop name (e.g., Cotton, Rice, Wheat)")):
    """
    Returns rule-based machinery recommendations per crop and phenological stage.
    Indicative, to verify. Not from a published source.
    """
    data = get_machinery_guide_for_crop(crop)
    return MachineryGuideResponse(**data)


# ==============================================================================
# 2. Machinery Listings & Haversine Distance Search
# ==============================================================================

@router.get("/listings", response_model=List[MachineryListingResponse])
def search_machinery_listings(
    lat: Optional[float] = Query(default=None, ge=-90.0, le=90.0),
    lon: Optional[float] = Query(default=None, ge=-180.0, le=180.0),
    village: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    max_distance_km: Optional[float] = Query(default=None, gt=0),
    only_available: bool = Query(default=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Searches machinery listings ranked by Haversine distance from the user's farm/village centroid.
    Masks contact details unless the owner has explicitly opted in.
    """
    # Resolve reference coordinates
    ref_lat = lat
    ref_lon = lon
    if ref_lat is None or ref_lon is None:
        user_farm = db.query(Farm).filter(Farm.user_id == current_user.id).first()
        if user_farm:
            ref_lat = user_farm.latitude
            ref_lon = user_farm.longitude
        else:
            # Default to Geikonda, Warangal centroid
            ref_lat = 17.9689
            ref_lon = 79.5941

    query = db.query(MachineryListing)
    if only_available:
        query = query.filter(MachineryListing.is_available.is_(True))
    if category and category.lower() != "all":
        query = query.filter(MachineryListing.category == category.lower())
    if village:
        query = query.filter(MachineryListing.village.ilike(village.strip()))

    raw_listings = query.all()

    annotated = []
    for l in raw_listings:
        dist = haversine_distance(ref_lat, ref_lon, l.latitude, l.longitude)
        if max_distance_km is not None and dist > max_distance_km:
            continue

        owner = db.query(User).filter(User.id == l.owner_id).first()
        owner_name = owner.full_name if owner else "Owner"

        is_self = l.owner_id == current_user.id
        show_phone = is_self or l.contact_phone_opt_in

        annotated.append((
            dist,
            MachineryListingResponse(
                id=l.id,
                owner_id=l.owner_id,
                owner_name_or_alias=owner_name if is_self else _format_owner_alias(owner_name),
                owner_phone=owner.phone_number if (owner and show_phone) else None,
                name=l.name,
                category=l.category,
                hourly_rate=l.hourly_rate,
                daily_rate=l.daily_rate,
                village=l.village,
                district=l.district,
                state=l.state,
                latitude=l.latitude,
                longitude=l.longitude,
                distance_km=dist,
                is_available=l.is_available,
                contact_phone_opt_in=l.contact_phone_opt_in,
                description=l.description,
                is_demo=l.is_demo,
                created_at=l.created_at,
            )
        ))

    # Sort listings strictly by distance ascending
    annotated.sort(key=lambda x: x[0])
    return [item[1] for item in annotated]


@router.post("/listings", response_model=MachineryListingResponse, status_code=status.HTTP_201_CREATED)
def create_machinery_listing(
    payload: MachineryListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Owner lists machinery for peer rental.
    """
    listing = MachineryListing(
        owner_id=current_user.id,
        name=payload.name,
        category=payload.category,
        hourly_rate=payload.hourly_rate,
        daily_rate=payload.daily_rate,
        village=payload.village,
        district=payload.district,
        state=payload.state,
        latitude=payload.latitude,
        longitude=payload.longitude,
        contact_phone_opt_in=payload.contact_phone_opt_in,
        description=payload.description,
        is_available=True,
        is_demo=current_user.is_demo_account,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    return MachineryListingResponse(
        id=listing.id,
        owner_id=listing.owner_id,
        owner_name_or_alias=current_user.full_name,
        owner_phone=current_user.phone_number if payload.contact_phone_opt_in else None,
        name=listing.name,
        category=listing.category,
        hourly_rate=listing.hourly_rate,
        daily_rate=listing.daily_rate,
        village=listing.village,
        district=listing.district,
        state=listing.state,
        latitude=listing.latitude,
        longitude=listing.longitude,
        distance_km=0.0,
        is_available=listing.is_available,
        contact_phone_opt_in=listing.contact_phone_opt_in,
        description=listing.description,
        is_demo=listing.is_demo,
        created_at=listing.created_at,
    )


# ==============================================================================
# 3. Machinery Booking Flow (Request & Approval, No Online Payments)
# ==============================================================================

@router.post("/bookings", response_model=MachineryBookingResponse, status_code=status.HTTP_201_CREATED)
def create_machinery_booking(
    payload: MachineryBookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submits a peer custom-hiring booking request.
    Strict rule: No online payment processing; settlements occur directly between farmers.
    """
    listing = db.query(MachineryListing).filter(MachineryListing.id == payload.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Machinery listing not found.")

    if not listing.is_available:
        raise HTTPException(status_code=400, detail="This machine is currently marked unavailable by the owner.")

    if listing.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot book your own machinery listing.")

    if payload.end_date < payload.start_date:
        raise HTTPException(status_code=422, detail="End date cannot be prior to start date.")

    # Calculate estimated rental cost
    if payload.rate_type == "hourly":
        hours = payload.duration_hours or 4.0
        estimated_total = round(listing.hourly_rate * hours, 2)
    else:
        num_days = max(1, (payload.end_date - payload.start_date).days + 1)
        estimated_total = round(listing.daily_rate * num_days, 2)

    booking = MachineryBooking(
        listing_id=listing.id,
        renter_id=current_user.id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        duration_hours=payload.duration_hours,
        rate_type=payload.rate_type,
        estimated_total=estimated_total,
        crop_purpose=payload.crop_purpose,
        status="PENDING",
        notes=payload.notes,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return MachineryBookingResponse(
        id=booking.id,
        listing_id=listing.id,
        listing_name=listing.name,
        owner_id=listing.owner_id,
        renter_id=booking.renter_id,
        renter_alias=current_user.full_name,
        start_date=booking.start_date,
        end_date=booking.end_date,
        duration_hours=booking.duration_hours,
        rate_type=booking.rate_type,
        estimated_total=booking.estimated_total,
        crop_purpose=booking.crop_purpose,
        status=booking.status,
        notes=booking.notes,
        created_at=booking.created_at,
        booking_note="Custom hiring request submitted. Settle payment directly offline with machinery owner (no online payments).",
    )


@router.get("/bookings", response_model=List[MachineryBookingResponse])
def get_user_bookings(
    role: Optional[str] = Query(default="renter", description="'renter' or 'owner'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves bookings associated with the current user either as a renter or as machine owner.
    """
    if role == "owner":
        # Bookings for machines owned by current user
        bookings = (
            db.query(MachineryBooking)
            .join(MachineryListing, MachineryBooking.listing_id == MachineryListing.id)
            .filter(MachineryListing.owner_id == current_user.id)
            .order_by(MachineryBooking.created_at.desc())
            .all()
        )
    else:
        # Bookings made by current user
        bookings = (
            db.query(MachineryBooking)
            .filter(MachineryBooking.renter_id == current_user.id)
            .order_by(MachineryBooking.created_at.desc())
            .all()
        )

    results = []
    for b in bookings:
        listing = db.query(MachineryListing).filter(MachineryListing.id == b.listing_id).first()
        renter = db.query(User).filter(User.id == b.renter_id).first()
        listing_name = listing.name if listing else "Machinery"
        owner_id = listing.owner_id if listing else 0

        renter_name = renter.full_name if renter else "Farmer"
        if b.renter_id != current_user.id and owner_id != current_user.id:
            renter_name = _format_owner_alias(renter_name)

        results.append(
            MachineryBookingResponse(
                id=b.id,
                listing_id=b.listing_id,
                listing_name=listing_name,
                owner_id=owner_id,
                renter_id=b.renter_id,
                renter_alias=renter_name,
                start_date=b.start_date,
                end_date=b.end_date,
                duration_hours=b.duration_hours,
                rate_type=b.rate_type,
                estimated_total=b.estimated_total,
                crop_purpose=b.crop_purpose,
                status=b.status,
                notes=b.notes,
                created_at=b.created_at,
                booking_note="Custom hiring booking. Settle payment directly offline with machinery owner (no online payments).",
            )
        )

    return results


@router.put("/bookings/{booking_id}/status", response_model=MachineryBookingResponse)
def update_booking_status(
    booking_id: int,
    payload: BookingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Owner updates booking status to APPROVED or REJECTED.
    Renter can CANCEL a pending booking.
    """
    booking = db.query(MachineryBooking).filter(MachineryBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    listing = db.query(MachineryListing).filter(MachineryListing.id == booking.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Machinery listing not found.")

    is_owner = listing.owner_id == current_user.id
    is_renter = booking.renter_id == current_user.id

    if not (is_owner or is_renter):
        raise HTTPException(status_code=403, detail="Not authorized to update this booking.")

    if is_renter and payload.status not in ["CANCELLED"]:
        raise HTTPException(status_code=403, detail="Renters can only cancel pending booking requests.")

    booking.status = payload.status
    db.commit()
    db.refresh(booking)

    renter = db.query(User).filter(User.id == booking.renter_id).first()
    return MachineryBookingResponse(
        id=booking.id,
        listing_id=listing.id,
        listing_name=listing.name,
        owner_id=listing.owner_id,
        renter_id=booking.renter_id,
        renter_alias=renter.full_name if renter else "Farmer",
        start_date=booking.start_date,
        end_date=booking.end_date,
        duration_hours=booking.duration_hours,
        rate_type=booking.rate_type,
        estimated_total=booking.estimated_total,
        crop_purpose=booking.crop_purpose,
        status=booking.status,
        notes=booking.notes,
        created_at=booking.created_at,
        booking_note=f"Booking status updated to {booking.status}. Payment is handled offline.",
    )

