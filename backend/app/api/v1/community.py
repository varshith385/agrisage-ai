"""
Community API Endpoints: Groups, Opt-In Consent Flow, Pooled Requests & Cost Calculator
Yuktik 2026 Hackathon | AgriSage AI Community Module
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import distinct

from backend.app.database.session import get_db, utc_now
from backend.app.security.auth import get_current_user
from backend.app.models.user import User
from backend.app.models.farm import Farm, CurrentCropCycle
from backend.app.models.community import (
    FarmerGroup,
    GroupMember,
    CommunityRequest,
    RequestParticipant,
)
from backend.app.schemas.community import (
    GroupCreate,
    GroupResponse,
    GroupMemberResponse,
    GroupJoinInput,
    ConsentUpdateInput,
    NearbyFarmerResponse,
    CommunityRequestCreate,
    CommunityRequestResponse,
    JoinRequestInput,
    ParticipantResponse,
)
from backend.app.services.cost_split import (
    calculate_cost_split,
    ParticipantInput,
    CostSplitResult,
)

router = APIRouter(prefix="/community", tags=["Community & Peer Collaboration"])


def _format_alias(full_name: str) -> str:
    """Returns safe alias/first name (e.g., 'Ramesh K.' or 'Srinivas') to protect privacy."""
    parts = full_name.strip().split()
    if len(parts) >= 2:
        return f"{parts[0]} {parts[1][0]}."
    elif parts:
        return parts[0]
    return "Farmer"


# ==============================================================================
# 1. Nearby Farmers Discovery (Village-Level Only, No Exact Coordinates)
# ==============================================================================

@router.get("/nearby-farmers", response_model=List[NearbyFarmerResponse])
def get_nearby_farmers(
    village: Optional[str] = None,
    district: Optional[str] = "Warangal",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Discovers nearby farmers at village-level only.
    Strict privacy rule: Exact farm coordinates and full contact details are NEVER
    exposed to other farmers unless explicit reciprocal consent is established.
    """
    query = (
        db.query(Farm, User)
        .join(User, Farm.user_id == User.id)
        .filter(User.id != current_user.id)
    )

    if village:
        query = query.filter(Farm.village.ilike(village.strip()))
    elif district:
        query = query.filter(Farm.district.ilike(district.strip()))

    results = query.limit(30).all()

    # Find mutual groups where both have consented to share contacts
    consented_user_ids = set()
    user_consented_groups = (
        db.query(GroupMember.group_id)
        .filter(
            GroupMember.user_id == current_user.id,
            GroupMember.consent_share_contact.is_(True),
        )
        .all()
    )
    group_ids = [g[0] for g in user_consented_groups]

    if group_ids:
        mutual_members = (
            db.query(GroupMember.user_id)
            .filter(
                GroupMember.group_id.in_(group_ids),
                GroupMember.consent_share_contact.is_(True),
            )
            .all()
        )
        consented_user_ids = set(m[0] for m in mutual_members)

    seen_users = set()
    nearby_list = []

    for farm, user in results:
        if user.id in seen_users:
            continue
        seen_users.add(user.id)

        # Get crops grown
        cycles = (
            db.query(CurrentCropCycle.crop_name)
            .filter(CurrentCropCycle.farm_id == farm.id)
            .all()
        )
        crops = list(set(c[0] for c in cycles if c[0]))
        if not crops:
            crops = ["Cotton"]  # Regional staple fallback

        has_mutual_consent = user.id in consented_user_ids

        nearby_list.append(
            NearbyFarmerResponse(
                user_id=user.id,
                alias_or_name=user.full_name if has_mutual_consent else _format_alias(user.full_name),
                village=farm.village,
                district=farm.district,
                crops_grown=crops,
                has_shared_contact=has_mutual_consent,
                phone_number=user.phone_number if has_mutual_consent else None,
            )
        )

    return nearby_list


# ==============================================================================
# 2. Farmer Groups & Opt-In Contact Sharing Flow
# ==============================================================================

@router.get("/groups", response_model=List[GroupResponse])
def list_groups(
    village: Optional[str] = None,
    district: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists farmer community groups with membership and consent status.
    """
    query = db.query(FarmerGroup)
    if village:
        query = query.filter(FarmerGroup.village.ilike(village.strip()))
    if district:
        query = query.filter(FarmerGroup.district.ilike(district.strip()))

    groups = query.order_by(FarmerGroup.created_at.desc()).all()

    # Get user memberships in batch
    user_memberships = {
        m.group_id: m
        for m in db.query(GroupMember)
        .filter(GroupMember.user_id == current_user.id)
        .all()
    }

    result = []
    for g in groups:
        membership = user_memberships.get(g.id)
        member_count = db.query(GroupMember).filter(GroupMember.group_id == g.id).count()

        result.append(
            GroupResponse(
                id=g.id,
                name=g.name,
                description=g.description,
                village=g.village,
                district=g.district,
                state=g.state,
                crop_focus=g.crop_focus,
                created_by_user_id=g.created_by_user_id,
                member_count=member_count,
                is_member=membership is not None,
                user_has_consented=membership.consent_share_contact if membership else False,
                created_at=g.created_at,
                is_demo=g.is_demo,
            )
        )

    return result


@router.post("/groups", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    payload: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a new farmer group and registers the creator as an initial member.
    """
    group = FarmerGroup(
        name=payload.name,
        description=payload.description,
        village=payload.village,
        district=payload.district,
        state=payload.state,
        crop_focus=payload.crop_focus,
        created_by_user_id=current_user.id,
        is_demo=current_user.is_demo_account,
    )
    db.add(group)
    db.commit()
    db.refresh(group)

    # Add creator as group member with their initial consent choice
    member = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        role="creator",
        consent_share_contact=payload.consent_share_contact,
        consent_at=utc_now() if payload.consent_share_contact else None,
    )
    db.add(member)
    db.commit()

    return GroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        village=group.village,
        district=group.district,
        state=group.state,
        crop_focus=group.crop_focus,
        created_by_user_id=group.created_by_user_id,
        member_count=1,
        is_member=True,
        user_has_consented=payload.consent_share_contact,
        created_at=group.created_at,
        is_demo=group.is_demo,
    )


@router.post("/groups/{group_id}/join", response_model=GroupResponse)
def join_group(
    group_id: int,
    payload: GroupJoinInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Joins a group with explicit, recorded contact-sharing consent choice.
    """
    group = db.query(FarmerGroup).filter(FarmerGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Farmer group not found.")

    existing_member = (
        db.query(GroupMember)
        .filter(GroupMember.group_id == group_id, GroupMember.user_id == current_user.id)
        .first()
    )
    if existing_member:
        raise HTTPException(status_code=400, detail="You are already a member of this group.")

    member = GroupMember(
        group_id=group_id,
        user_id=current_user.id,
        role="member",
        consent_share_contact=payload.consent_share_contact,
        consent_at=utc_now() if payload.consent_share_contact else None,
    )
    db.add(member)
    db.commit()

    member_count = db.query(GroupMember).filter(GroupMember.group_id == group_id).count()

    return GroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        village=group.village,
        district=group.district,
        state=group.state,
        crop_focus=group.crop_focus,
        created_by_user_id=group.created_by_user_id,
        member_count=member_count,
        is_member=True,
        user_has_consented=payload.consent_share_contact,
        created_at=group.created_at,
        is_demo=group.is_demo,
    )


@router.delete("/groups/{group_id}/leave", status_code=status.HTTP_200_OK)
def leave_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Leaves a farmer group and revokes any contact sharing.
    """
    member = (
        db.query(GroupMember)
        .filter(GroupMember.group_id == group_id, GroupMember.user_id == current_user.id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="You are not a member of this group.")

    db.delete(member)
    db.commit()
    return {"message": "Successfully left the group.", "group_id": group_id}


@router.put("/groups/{group_id}/consent", status_code=status.HTTP_200_OK)
def update_group_consent(
    group_id: int,
    payload: ConsentUpdateInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Explicitly updates or revokes contact-sharing consent for this group.
    Revocation immediately scrubs the phone number from other members' views.
    """
    member = (
        db.query(GroupMember)
        .filter(GroupMember.group_id == group_id, GroupMember.user_id == current_user.id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="You must be a member of the group to update consent.")

    member.consent_share_contact = payload.consent_share_contact
    member.consent_at = utc_now() if payload.consent_share_contact else None
    db.commit()
    db.refresh(member)

    return {
        "group_id": group_id,
        "consent_share_contact": member.consent_share_contact,
        "consent_at": member.consent_at.isoformat() if member.consent_at else None,
        "message": (
            "Contact sharing enabled for opted-in members."
            if member.consent_share_contact
            else "Contact sharing revoked. Your phone number is now hidden from other members."
        ),
    }


@router.get("/groups/{group_id}/members", response_model=List[GroupMemberResponse])
def get_group_members(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists group members enforcing strict permission and privacy boundaries.
    
    PRIVACY RULES:
    1. A user who is not a member or who has NOT consented receives NO phone numbers from any endpoint.
    2. A member who has consented sees phone numbers ONLY for other members who have also consented.
    3. Any member who has not consented appears with their alias and village only; phone is strictly None.
    4. A user can always see their own details.
    """
    group = db.query(FarmerGroup).filter(FarmerGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Farmer group not found.")

    # Determine caller's consent status in this group
    caller_member = (
        db.query(GroupMember)
        .filter(GroupMember.group_id == group_id, GroupMember.user_id == current_user.id)
        .first()
    )
    caller_consented = caller_member.consent_share_contact if caller_member else False

    members = (
        db.query(GroupMember, User)
        .join(User, GroupMember.user_id == User.id)
        .filter(GroupMember.group_id == group_id)
        .order_by(GroupMember.joined_at.asc())
        .all()
    )

    response_list = []
    for gm, u in members:
        is_self = u.id == current_user.id
        can_view_contact = is_self or (caller_consented and gm.consent_share_contact)

        # Retrieve user village from their primary farm
        user_farm = db.query(Farm).filter(Farm.user_id == u.id).first()
        village_name = user_farm.village if user_farm else group.village

        response_list.append(
            GroupMemberResponse(
                user_id=u.id,
                alias_or_name=u.full_name if can_view_contact else _format_alias(u.full_name),
                village=village_name,
                role=gm.role,
                consent_share_contact=gm.consent_share_contact,
                consent_at=gm.consent_at,
                phone_number=u.phone_number if can_view_contact else None,
                joined_at=gm.joined_at,
            )
        )

    return response_list


# ==============================================================================
# 3. Shared Logistics & Group Requests (Transport, Input Purchase, Pooled Sale)
# ==============================================================================

@router.get("/requests", response_model=List[CommunityRequestResponse])
def list_requests(
    request_type: Optional[str] = None,
    village: Optional[str] = None,
    district: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists active community collaboration requests.
    """
    query = db.query(CommunityRequest)
    if request_type:
        query = query.filter(CommunityRequest.request_type == request_type)
    if village:
        query = query.filter(CommunityRequest.village.ilike(village.strip()))
    if district:
        query = query.filter(CommunityRequest.district.ilike(district.strip()))

    requests = query.order_by(CommunityRequest.created_at.desc()).all()

    results = []
    for r in requests:
        participants = (
            db.query(RequestParticipant, User)
            .join(User, RequestParticipant.user_id == User.id)
            .filter(RequestParticipant.request_id == r.id)
            .all()
        )

        p_list = []
        is_part = False
        for p, u in participants:
            if u.id == current_user.id:
                is_part = True
            farm = db.query(Farm).filter(Farm.user_id == u.id).first()
            p_list.append(
                ParticipantResponse(
                    id=p.id,
                    user_id=u.id,
                    alias_or_name=u.full_name if u.id == current_user.id else _format_alias(u.full_name),
                    village=farm.village if farm else r.village,
                    quantity_or_weight=p.quantity_or_weight,
                    distance_km=p.distance_km,
                    estimated_cost=p.estimated_cost,
                    savings_vs_solo=p.savings_vs_solo,
                    notes=p.notes,
                    created_at=p.created_at,
                )
            )

        # Dynamic cost split calculation for transport requests
        cost_split_data = None
        if r.request_type == "transport" and p_list and r.base_truck_cost:
            try:
                calc_inputs = [
                    ParticipantInput(
                        name_or_alias=p.alias_or_name,
                        weight_quintals=p.quantity_or_weight,
                        pickup_distance_km=p.distance_km or r.distance_km or 25.0,
                    )
                    for p in p_list
                ]
                split_res = calculate_cost_split(
                    base_truck_cost=r.base_truck_cost,
                    rate_per_km=r.rate_per_km or 35.0,
                    total_distance_km=r.distance_km or 25.0,
                    participants=calc_inputs,
                )
                cost_split_data = {
                    "total_truck_cost": split_res.total_truck_cost,
                    "total_solo_cost": split_res.total_solo_cost,
                    "total_savings": split_res.total_savings,
                    "total_savings_pct": split_res.total_savings_percentage,
                }
            except Exception:
                pass

        creator = db.query(User).filter(User.id == r.created_by_user_id).first()
        creator_alias = _format_alias(creator.full_name) if creator else "Farmer"

        results.append(
            CommunityRequestResponse(
                id=r.id,
                group_id=r.group_id,
                created_by_user_id=r.created_by_user_id,
                creator_alias=creator_alias,
                request_type=r.request_type,
                title=r.title,
                description=r.description,
                target_date=r.target_date,
                status=r.status,
                village=r.village,
                district=r.district,
                state=r.state,
                destination=r.destination,
                total_capacity_quintals=r.total_capacity_quintals,
                current_weight_quintals=r.current_weight_quintals,
                base_truck_cost=r.base_truck_cost,
                rate_per_km=r.rate_per_km,
                distance_km=r.distance_km,
                item_name=r.item_name,
                target_quantity=r.target_quantity,
                unit=r.unit,
                bulk_price_per_unit=r.bulk_price_per_unit,
                retail_price_per_unit=r.retail_price_per_unit,
                crop_name=r.crop_name,
                target_quantity_quintals=r.target_quantity_quintals,
                expected_price_per_quintal=r.expected_price_per_quintal,
                is_demo=r.is_demo,
                created_at=r.created_at,
                participants=p_list,
                is_participant=is_part,
                cost_split_summary=cost_split_data,
            )
        )

    return results


@router.post("/requests", response_model=CommunityRequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(
    payload: CommunityRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a new community request (pooled transport, input purchase, or pooled sale).
    Registers the creator as the first participant.
    """
    req = CommunityRequest(
        group_id=payload.group_id,
        created_by_user_id=current_user.id,
        request_type=payload.request_type,
        title=payload.title,
        description=payload.description,
        target_date=payload.target_date,
        status="OPEN",
        village=payload.village,
        district=payload.district,
        state=payload.state,
        destination=payload.destination,
        total_capacity_quintals=payload.total_capacity_quintals,
        current_weight_quintals=payload.creator_quantity_or_weight,
        base_truck_cost=payload.base_truck_cost,
        rate_per_km=payload.rate_per_km,
        distance_km=payload.distance_km,
        item_name=payload.item_name,
        target_quantity=payload.target_quantity,
        unit=payload.unit,
        bulk_price_per_unit=payload.bulk_price_per_unit,
        retail_price_per_unit=payload.retail_price_per_unit,
        crop_name=payload.crop_name,
        target_quantity_quintals=payload.target_quantity_quintals,
        expected_price_per_quintal=payload.expected_price_per_quintal,
        is_demo=current_user.is_demo_account,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Add creator as participant
    participant = RequestParticipant(
        request_id=req.id,
        user_id=current_user.id,
        quantity_or_weight=payload.creator_quantity_or_weight,
        distance_km=payload.creator_distance_km or (payload.distance_km or 0.0),
        notes="Request Creator",
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)

    creator_alias = _format_alias(current_user.full_name)
    p_response = ParticipantResponse(
        id=participant.id,
        user_id=current_user.id,
        alias_or_name=current_user.full_name,
        village=payload.village,
        quantity_or_weight=participant.quantity_or_weight,
        distance_km=participant.distance_km,
        notes=participant.notes,
        created_at=participant.created_at,
    )

    return CommunityRequestResponse(
        id=req.id,
        group_id=req.group_id,
        created_by_user_id=req.created_by_user_id,
        creator_alias=creator_alias,
        request_type=req.request_type,
        title=req.title,
        description=req.description,
        target_date=req.target_date,
        status=req.status,
        village=req.village,
        district=req.district,
        state=req.state,
        destination=req.destination,
        total_capacity_quintals=req.total_capacity_quintals,
        current_weight_quintals=req.current_weight_quintals,
        base_truck_cost=req.base_truck_cost,
        rate_per_km=req.rate_per_km,
        distance_km=req.distance_km,
        item_name=req.item_name,
        target_quantity=req.target_quantity,
        unit=req.unit,
        bulk_price_per_unit=req.bulk_price_per_unit,
        retail_price_per_unit=req.retail_price_per_unit,
        crop_name=req.crop_name,
        target_quantity_quintals=req.target_quantity_quintals,
        expected_price_per_quintal=req.expected_price_per_quintal,
        is_demo=req.is_demo,
        created_at=req.created_at,
        participants=[p_response],
        is_participant=True,
    )


@router.post("/requests/{request_id}/join", response_model=CommunityRequestResponse)
def join_request(
    request_id: int,
    payload: JoinRequestInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Participates in a shared request with a specified load weight or purchase quantity.
    """
    req = db.query(CommunityRequest).filter(CommunityRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")

    if req.status != "OPEN":
        raise HTTPException(status_code=400, detail="This request is no longer open for participation.")

    # Check if user already participating
    existing = (
        db.query(RequestParticipant)
        .filter(RequestParticipant.request_id == request_id, RequestParticipant.user_id == current_user.id)
        .first()
    )
    if existing:
        existing.quantity_or_weight += payload.quantity_or_weight
        existing.notes = payload.notes or existing.notes
    else:
        new_part = RequestParticipant(
            request_id=request_id,
            user_id=current_user.id,
            quantity_or_weight=payload.quantity_or_weight,
            distance_km=payload.distance_km or (req.distance_km or 0.0),
            notes=payload.notes,
        )
        db.add(new_part)

    req.current_weight_quintals += payload.quantity_or_weight
    if req.total_capacity_quintals and req.current_weight_quintals >= req.total_capacity_quintals:
        req.status = "FULL"

    db.commit()

    # Return refreshed request details
    return list_requests(request_type=None, village=None, district=None, current_user=current_user, db=db)[0]


# ==============================================================================
# 4. Standalone Cost-Splitting Calculator Endpoint
# ==============================================================================

class CostSplitCalculationInput(BaseModel):
    base_truck_cost: float = Field(..., gt=0, description="Base truck hire in INR")
    rate_per_km: float = Field(..., ge=0, description="Rate per km in INR")
    total_distance_km: float = Field(..., gt=0, description="Total travel distance in km")
    solo_tempo_base: float = Field(default=1200.0, ge=0)
    solo_rate_per_km: float = Field(default=25.0, ge=0)
    split_method: str = Field(default="weight_share", pattern="^(weight_share|ton_km)$")
    participants: List[ParticipantInput]


@router.post("/transport/cost-split", response_model=CostSplitResult)
def calculate_transport_split(payload: CostSplitCalculationInput):
    """
    Computes transparent cost-splitting breakdown and individual savings vs solo alternative.
    """
    return calculate_cost_split(
        base_truck_cost=payload.base_truck_cost,
        rate_per_km=payload.rate_per_km,
        total_distance_km=payload.total_distance_km,
        participants=payload.participants,
        solo_tempo_base=payload.solo_tempo_base,
        solo_rate_per_km=payload.solo_rate_per_km,
        split_method=payload.split_method,
    )
