from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.user import User, UserRole
from backend.app.schemas.marketplace import (
    AdminVerificationRequest,
    InquiryCreateRequest,
    InquiryResponse,
    InquiryStatusUpdateRequest,
    ListingCreateRequest,
    ListingResponse,
    ListingUpdateRequest,
    ReviewCreateRequest,
    ReviewResponse,
)
from backend.app.security.auth import (
    get_current_user,
    require_role,
    decode_access_token,
    security_scheme,
)


def get_optional_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not auth or not auth.credentials:
        return None
    try:
        payload = decode_access_token(auth.credentials)
        user_id = payload.get("sub")
        if user_id is not None:
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user and user.is_active:
                return user
    except Exception:
        return None
    return None
from backend.app.services.marketplace_service import (
    create_inquiry,
    create_listing,
    create_review,
    delete_listing,
    get_inquiries,
    get_listing_by_id,
    get_listings,
    update_inquiry_status,
    update_listing,
    verify_farmer_workflow,
    verify_listing_workflow,
)

router = APIRouter(prefix="/marketplace", tags=["Farmer-to-Buyer Marketplace"])


@router.get("/listings", response_model=List[ListingResponse])
def read_listings(
    crop: Optional[str] = Query(None, description="Filter by crop name"),
    district: Optional[str] = Query(None, description="Filter by district"),
    status: Optional[str] = Query("active", description="Filter by listing status"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists harvest marketplace listings.
    Privacy policy: Buyer cannot see farmer contact details until farmer accepts their inquiry.
    Owner and Admin always see full contact details.
    """
    return get_listings(
        crop=crop,
        district=district,
        status_filter=status,
        current_user=current_user,
        db=db,
    )


@router.post("/listings", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_harvest_listing(
    req: ListingCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a new harvest listing.
    Role: Authenticated farmers or admins.
    """
    return create_listing(req=req, current_user=current_user, db=db)


@router.get("/listings/{listing_id}", response_model=ListingResponse)
def read_listing(
    listing_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves details for a specific listing with privacy guards.
    """
    return get_listing_by_id(listing_id=listing_id, current_user=current_user, db=db)


@router.put("/listings/{listing_id}", response_model=ListingResponse)
def update_harvest_listing(
    listing_id: int,
    req: ListingUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates an existing harvest listing.
    Permission: Strictly ONLY the listing owner (or Admin) can edit. Others receive HTTP 403 Forbidden.
    """
    return update_listing(
        listing_id=listing_id, req=req, current_user=current_user, db=db
    )


@router.delete("/listings/{listing_id}", status_code=status.HTTP_200_OK)
def remove_harvest_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes / deactivates a harvest listing.
    Permission: Strictly ONLY the listing owner (or Admin) can delete. Others receive HTTP 403 Forbidden.
    """
    delete_listing(listing_id=listing_id, current_user=current_user, db=db)
    return {"deleted": True, "id": listing_id}


@router.post("/inquiries", response_model=InquiryResponse, status_code=status.HTTP_201_CREATED)
def submit_buyer_inquiry(
    req: InquiryCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Buyer submits an inquiry / offer for a harvest listing.
    Contact details of the farmer remain hidden until farmer accepts.
    """
    return create_inquiry(req=req, current_user=current_user, db=db)


@router.get("/inquiries", response_model=List[InquiryResponse])
def read_user_inquiries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns inquiries:
    - Farmers: inquiries received on their harvest listings (with buyer contact info).
    - Buyers: inquiries submitted by them (farmer contact details revealed ONLY IF status is accepted).
    - Admins: all inquiries.
    """
    return get_inquiries(current_user=current_user, db=db)


@router.put("/inquiries/{inquiry_id}/status", response_model=InquiryResponse)
def update_inquiry_decision(
    inquiry_id: int,
    req: InquiryStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Accept or decline a buyer inquiry.
    Permission: Strictly ONLY the farmer who owns the listing (or Admin) can accept or decline.
    Upon acceptance, farmer contact details are revealed to the buyer.
    """
    return update_inquiry_status(
        inquiry_id=inquiry_id,
        new_status=req.status,
        current_user=current_user,
        db=db,
    )


@router.put("/farmers/{farmer_id}/verify")
def verify_farmer_account(
    farmer_id: int,
    req: AdminVerificationRequest,
    admin_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """
    Admin workflow: Grants or revokes 'Verified Seller' badge for a farmer and their listings.
    Permission: Strictly Admin role only.
    """
    verify_farmer_workflow(farmer_id=farmer_id, verified=req.verified, admin_user=admin_user, db=db)
    return {"success": True, "farmer_id": farmer_id, "verified": req.verified}


@router.put("/listings/{listing_id}/verify", response_model=ListingResponse)
def verify_specific_listing(
    listing_id: int,
    req: AdminVerificationRequest,
    admin_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """
    Admin workflow: Verifies a specific harvest listing.
    Permission: Strictly Admin role only.
    """
    return verify_listing_workflow(
        listing_id=listing_id, verified=req.verified, admin_user=admin_user, db=db
    )


@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_farmer_review(
    req: ReviewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submits a 1-5 star rating and comment for a farmer.
    """
    return create_review(req=req, current_user=current_user, db=db)

