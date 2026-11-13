from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.market import FarmerRating, MarketplaceInquiry, MarketplaceListing
from backend.app.models.user import User, UserRole
from backend.app.schemas.marketplace import (
    FarmerContactDetails,
    InquiryCreateRequest,
    InquiryResponse,
    ListingCreateRequest,
    ListingResponse,
    ListingUpdateRequest,
    ReviewCreateRequest,
    ReviewResponse,
)


def _build_listing_response(
    listing: MarketplaceListing,
    current_user: Optional[User],
    db: Session,
) -> ListingResponse:
    is_owner = False
    contact_unlocked = False
    farmer_contact: Optional[FarmerContactDetails] = None

    farmer_user = listing.farmer

    if current_user:
        if current_user.id == listing.farmer_id or current_user.role == UserRole.ADMIN:
            is_owner = True
            contact_unlocked = True
            if farmer_user:
                farmer_contact = FarmerContactDetails(
                    full_name=farmer_user.full_name,
                    phone_number=farmer_user.phone_number,
                    email=farmer_user.email,
                )
        else:
            # Check if this buyer has an accepted inquiry on this listing
            accepted_inquiry = (
                db.query(MarketplaceInquiry)
                .filter(
                    MarketplaceInquiry.listing_id == listing.id,
                    MarketplaceInquiry.buyer_id == current_user.id,
                    MarketplaceInquiry.status == "accepted",
                )
                .first()
            )
            if accepted_inquiry:
                contact_unlocked = True
                if farmer_user:
                    farmer_contact = FarmerContactDetails(
                        full_name=farmer_user.full_name,
                        phone_number=farmer_user.phone_number,
                        email=farmer_user.email,
                    )

    # Calculate average rating
    avg_rating_query = (
        db.query(func.avg(FarmerRating.rating))
        .filter(FarmerRating.farmer_id == listing.farmer_id)
        .scalar()
    )
    avg_rating = round(float(avg_rating_query), 1) if avg_rating_query else None

    # Count inquiries
    inq_count = (
        db.query(func.count(MarketplaceInquiry.id))
        .filter(MarketplaceInquiry.listing_id == listing.id)
        .scalar()
        or 0
    )

    farmer_display_name = farmer_user.full_name if farmer_user else "Farmer"
    if not contact_unlocked and not is_owner:
        # Privacy: show first name and initial only for unaccepted buyer view
        parts = farmer_display_name.split()
        if len(parts) > 1:
            farmer_display_name = f"{parts[0]} {parts[1][0]}."
        else:
            farmer_display_name = parts[0]

    return ListingResponse(
        id=listing.id,
        farmer_id=listing.farmer_id,
        farmer_name=farmer_display_name,
        crop_name=listing.crop_name,
        variety=listing.variety,
        quantity_quintals=listing.quantity_quintals,
        expected_price_per_q=listing.expected_price_per_q,
        state=listing.state,
        district=listing.district,
        village=listing.village,
        harvest_date=listing.harvest_date,
        description=listing.description,
        status=listing.status,
        is_verified_seller=listing.is_verified_seller,
        is_owner=is_owner,
        farmer_contact=farmer_contact,
        contact_unlocked=contact_unlocked,
        inquiry_count=inq_count,
        average_rating=avg_rating,
        created_at=listing.created_at.isoformat(),
        updated_at=listing.updated_at.isoformat(),
    )


def create_listing(
    req: ListingCreateRequest, current_user: User, db: Session
) -> ListingResponse:
    listing = MarketplaceListing(
        farmer_id=current_user.id,
        crop_name=req.crop_name,
        variety=req.variety,
        quantity_quintals=req.quantity_quintals,
        expected_price_per_q=req.expected_price_per_q,
        state=req.state,
        district=req.district,
        village=req.village,
        harvest_date=req.harvest_date,
        description=req.description,
        status="active",
        is_verified_seller=False,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return _build_listing_response(listing, current_user, db)


def get_listings(
    crop: Optional[str] = None,
    district: Optional[str] = None,
    status_filter: Optional[str] = "active",
    current_user: Optional[User] = None,
    db: Session = None,
) -> List[ListingResponse]:
    query = db.query(MarketplaceListing)
    if status_filter:
        query = query.filter(MarketplaceListing.status == status_filter)
    if crop:
        query = query.filter(MarketplaceListing.crop_name.ilike(f"%{crop}%"))
    if district:
        query = query.filter(MarketplaceListing.district.ilike(f"%{district}%"))

    listings = query.order_by(MarketplaceListing.created_at.desc()).all()
    return [_build_listing_response(l, current_user, db) for l in listings]


def get_listing_by_id(
    listing_id: int, current_user: Optional[User], db: Session
) -> ListingResponse:
    listing = (
        db.query(MarketplaceListing)
        .filter(MarketplaceListing.id == listing_id)
        .first()
    )
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Listing with id {listing_id} not found.",
        )
    return _build_listing_response(listing, current_user, db)


def update_listing(
    listing_id: int,
    req: ListingUpdateRequest,
    current_user: User,
    db: Session,
) -> ListingResponse:
    listing = (
        db.query(MarketplaceListing)
        .filter(MarketplaceListing.id == listing_id)
        .first()
    )
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Listing with id {listing_id} not found.",
        )

    # Permission check: Only owner or admin
    if listing.farmer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: Only the listing owner can edit this listing.",
        )

    if req.crop_name is not None:
        listing.crop_name = req.crop_name
    if req.variety is not None:
        listing.variety = req.variety
    if req.quantity_quintals is not None:
        listing.quantity_quintals = req.quantity_quintals
    if req.expected_price_per_q is not None:
        listing.expected_price_per_q = req.expected_price_per_q
    if req.village is not None:
        listing.village = req.village
    if req.harvest_date is not None:
        listing.harvest_date = req.harvest_date
    if req.description is not None:
        listing.description = req.description
    if req.status is not None:
        listing.status = req.status

    db.commit()
    db.refresh(listing)
    return _build_listing_response(listing, current_user, db)


def delete_listing(listing_id: int, current_user: User, db: Session) -> bool:
    listing = (
        db.query(MarketplaceListing)
        .filter(MarketplaceListing.id == listing_id)
        .first()
    )
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Listing with id {listing_id} not found.",
        )

    # Permission check: Only owner or admin
    if listing.farmer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: Only the listing owner can delete this listing.",
        )

    db.delete(listing)
    db.commit()
    return True


def create_inquiry(
    req: InquiryCreateRequest, current_user: User, db: Session
) -> InquiryResponse:
    listing = (
        db.query(MarketplaceListing)
        .filter(MarketplaceListing.id == req.listing_id)
        .first()
    )
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Listing with id {req.listing_id} not found.",
        )

    inquiry = MarketplaceInquiry(
        listing_id=req.listing_id,
        buyer_id=current_user.id,
        offered_price_per_q=req.offered_price_per_q,
        quantity_quintals=req.quantity_quintals,
        message=req.message,
        status="pending",
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)

    # When pending, buyer cannot see farmer contact details yet!
    return InquiryResponse(
        id=inquiry.id,
        listing_id=listing.id,
        listing_crop=listing.crop_name,
        listing_village=listing.village,
        buyer_id=current_user.id,
        buyer_name=current_user.full_name,
        buyer_phone=current_user.phone_number,
        buyer_email=current_user.email,
        offered_price_per_q=inquiry.offered_price_per_q,
        quantity_quintals=inquiry.quantity_quintals,
        message=inquiry.message,
        status=inquiry.status,
        farmer_contact=None,
        contact_unlocked=False,
        created_at=inquiry.created_at.isoformat(),
        updated_at=inquiry.updated_at.isoformat(),
    )


def get_inquiries(current_user: User, db: Session) -> List[InquiryResponse]:
    """
    Returns inquiries relevant to current_user:
    - If Farmer: returns inquiries for all listings owned by this farmer.
    - If Buyer: returns inquiries sent by this buyer. Unlocks farmer contact ONLY IF accepted.
    - If Admin: returns all inquiries with unlocked contacts.
    """
    if current_user.role == UserRole.ADMIN:
        inquiries = db.query(MarketplaceInquiry).order_by(MarketplaceInquiry.created_at.desc()).all()
    elif current_user.role == UserRole.BUYER:
        inquiries = (
            db.query(MarketplaceInquiry)
            .filter(MarketplaceInquiry.buyer_id == current_user.id)
            .order_by(MarketplaceInquiry.created_at.desc())
            .all()
        )
    else:
        # Default: Farmer view (inquiries on farmer's listings)
        inquiries = (
            db.query(MarketplaceInquiry)
            .join(MarketplaceListing, MarketplaceInquiry.listing_id == MarketplaceListing.id)
            .filter(MarketplaceListing.farmer_id == current_user.id)
            .order_by(MarketplaceInquiry.created_at.desc())
            .all()
        )

    results: List[InquiryResponse] = []
    for inq in inquiries:
        listing = inq.listing
        buyer = inq.buyer
        farmer = listing.farmer if listing else None

        contact_unlocked = False
        farmer_contact: Optional[FarmerContactDetails] = None

        is_owner = listing and (listing.farmer_id == current_user.id)
        is_admin = current_user.role == UserRole.ADMIN
        is_buyer = inq.buyer_id == current_user.id

        if is_owner or is_admin:
            contact_unlocked = True
            if farmer:
                farmer_contact = FarmerContactDetails(
                    full_name=farmer.full_name,
                    phone_number=farmer.phone_number,
                    email=farmer.email,
                )
        elif is_buyer:
            # Buyers CANNOT see farmer contact details until farmer accepts!
            if inq.status == "accepted":
                contact_unlocked = True
                if farmer:
                    farmer_contact = FarmerContactDetails(
                        full_name=farmer.full_name,
                        phone_number=farmer.phone_number,
                        email=farmer.email,
                    )
            else:
                contact_unlocked = False
                farmer_contact = None

        results.append(
            InquiryResponse(
                id=inq.id,
                listing_id=inq.listing_id,
                listing_crop=listing.crop_name if listing else "Unknown Crop",
                listing_village=listing.village if listing else "Unknown Village",
                buyer_id=inq.buyer_id,
                buyer_name=buyer.full_name if buyer else "Buyer",
                buyer_phone=buyer.phone_number if (is_owner or is_admin) else None,
                buyer_email=buyer.email if (is_owner or is_admin) else None,
                offered_price_per_q=inq.offered_price_per_q,
                quantity_quintals=inq.quantity_quintals,
                message=inq.message,
                status=inq.status,
                farmer_contact=farmer_contact,
                contact_unlocked=contact_unlocked,
                created_at=inq.created_at.isoformat(),
                updated_at=inq.updated_at.isoformat(),
            )
        )

    return results


def update_inquiry_status(
    inquiry_id: int,
    new_status: str,
    current_user: User,
    db: Session,
) -> InquiryResponse:
    inquiry = (
        db.query(MarketplaceInquiry)
        .filter(MarketplaceInquiry.id == inquiry_id)
        .first()
    )
    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inquiry with id {inquiry_id} not found.",
        )

    listing = inquiry.listing
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated listing not found.",
        )

    # Permission check: Only the farmer who owns the listing (or Admin) can accept/decline
    if listing.farmer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: Only the farmer who owns this listing can accept or decline inquiries.",
        )

    inquiry.status = new_status
    db.commit()
    db.refresh(inquiry)

    farmer = listing.farmer
    farmer_contact = FarmerContactDetails(
        full_name=farmer.full_name,
        phone_number=farmer.phone_number,
        email=farmer.email,
    ) if farmer else None

    return InquiryResponse(
        id=inquiry.id,
        listing_id=listing.id,
        listing_crop=listing.crop_name,
        listing_village=listing.village,
        buyer_id=inquiry.buyer_id,
        buyer_name=inquiry.buyer.full_name if inquiry.buyer else "Buyer",
        buyer_phone=inquiry.buyer.phone_number if inquiry.buyer else None,
        buyer_email=inquiry.buyer.email if inquiry.buyer else None,
        offered_price_per_q=inquiry.offered_price_per_q,
        quantity_quintals=inquiry.quantity_quintals,
        message=inquiry.message,
        status=inquiry.status,
        farmer_contact=farmer_contact,
        contact_unlocked=True if new_status == "accepted" else False,
        created_at=inquiry.created_at.isoformat(),
        updated_at=inquiry.updated_at.isoformat(),
    )


def verify_farmer_workflow(
    farmer_id: int,
    verified: bool,
    admin_user: User,
    db: Session,
) -> bool:
    """Admin workflow: grants or revokes 'Verified' badge for a farmer and all their listings."""
    if admin_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: Only Administrators can grant or revoke Verified Seller badges.",
        )

    farmer = db.query(User).filter(User.id == farmer_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer with id {farmer_id} not found.",
        )

    listings = db.query(MarketplaceListing).filter(MarketplaceListing.farmer_id == farmer_id).all()
    for l in listings:
        l.is_verified_seller = verified

    db.commit()
    return True


def verify_listing_workflow(
    listing_id: int,
    verified: bool,
    admin_user: User,
    db: Session,
) -> ListingResponse:
    """Admin workflow: verifies a specific listing."""
    if admin_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: Only Administrators can verify marketplace listings.",
        )

    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Listing with id {listing_id} not found.",
        )

    listing.is_verified_seller = verified
    db.commit()
    db.refresh(listing)
    return _build_listing_response(listing, admin_user, db)


def create_review(
    req: ReviewCreateRequest, current_user: User, db: Session
) -> ReviewResponse:
    review = FarmerRating(
        farmer_id=req.farmer_id,
        buyer_id=current_user.id,
        listing_id=req.listing_id,
        rating=req.rating,
        comment=req.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return ReviewResponse(
        id=review.id,
        farmer_id=review.farmer_id,
        buyer_id=review.buyer_id,
        buyer_name=current_user.full_name,
        listing_id=review.listing_id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at.isoformat(),
    )

