"""
Idempotent Database Seeder for AgriSage AI
Seeds initial demo profiles, Ramesh's farm and crop cycle, and role accounts.
Run with: & .venv\\Scripts\\python scripts/seed.py
"""

from datetime import date, datetime
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.config import settings
import json
from backend.app.database.session import SessionLocal, init_db, utc_now
from backend.app.models.user import User, UserRole, Language
from backend.app.models.farm import (
    Farm,
    OwnershipType,
    IrrigationMethod,
    CropHistory,
    CurrentCropCycle,
    CropStage,
)
from backend.app.models.community import (
    FarmerGroup,
    GroupMember,
    CommunityRequest,
    RequestParticipant,
)
from backend.app.models.machinery import MachineryListing
from backend.app.models.disease_prediction import DiseasePrediction
from backend.app.security.auth import hash_password


def seed_database():
    print("Initializing database tables...")
    init_db()
    db = SessionLocal()

    try:
        # 1. Seed Demo Farmer: Ramesh
        farmer_email = "ramesh@agrisage.demo"
        farmer = db.query(User).filter(User.email == farmer_email).first()
        if not farmer:
            print(f"Creating demo farmer: {farmer_email}...")
            farmer = User(
                email=farmer_email,
                hashed_password=hash_password(settings.DEMO_FARMER_PASSWORD),
                full_name="Ramesh Kumar (Demo Farmer)",
                phone_number="+919876543210",
                role=UserRole.FARMER,
                preferred_language=Language.TE,
                is_active=True,
                is_demo_account=True,
            )
            db.add(farmer)
            db.commit()
            db.refresh(farmer)
        else:
            print(f"Demo farmer {farmer_email} already exists.")

        # 2. Seed Ramesh's Farm
        farm = db.query(Farm).filter(Farm.user_id == farmer.id).first()
        if not farm:
            print("Creating Ramesh's mixed tenure farm...")
            farm = Farm(
                user_id=farmer.id,
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

            # Historical harvest
            history = CropHistory(
                farm_id=farm.id,
                crop_name="Cotton",
                season="Kharif",
                year=2025,
                yield_obtained=18.5,
                profit_realized=42000.0,
            )
            db.add(history)

            # Active crop cycle
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
            print("Ramesh's farm, history, and active cotton cycle seeded.")

        # 3. Seed Demo Expert (Requires password from .env.example)
        expert_email = "expert@agrisage.demo"
        expert = db.query(User).filter(User.email == expert_email).first()
        if not expert:
            print(f"Creating demo expert: {expert_email}...")
            expert = User(
                email=expert_email,
                hashed_password=hash_password(settings.DEMO_EXPERT_PASSWORD),
                full_name="Dr. Ananya Rao (Demo Agronomist)",
                phone_number="+919876543211",
                role=UserRole.EXPERT,
                preferred_language=Language.EN,
                is_active=True,
                is_demo_account=True,
            )
            db.add(expert)
            db.commit()

        # 4. Seed Demo Buyer (Requires password from .env.example)
        buyer_email = "buyer@agrisage.demo"
        buyer = db.query(User).filter(User.email == buyer_email).first()
        if not buyer:
            print(f"Creating demo buyer: {buyer_email}...")
            buyer = User(
                email=buyer_email,
                hashed_password=hash_password(settings.DEMO_BUYER_PASSWORD),
                full_name="Suresh Reddy (Demo Procurement / FPO)",
                phone_number="+919876543212",
                role=UserRole.BUYER,
                preferred_language=Language.TE,
                is_active=True,
                is_demo_account=True,
            )
            db.add(buyer)
            db.commit()

        # 5. Seed Demo Admin (Requires password from .env.example)
        admin_email = "admin@agrisage.demo"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            print(f"Creating demo admin: {admin_email}...")
            admin = User(
                email=admin_email,
                hashed_password=hash_password(settings.DEMO_ADMIN_PASSWORD),
                full_name="System Administrator (Demo Admin)",
                phone_number="+919876543213",
                role=UserRole.ADMIN,
                preferred_language=Language.EN,
                is_active=True,
                is_demo_account=True,
            )
            db.add(admin)
            db.commit()

        # 6. Seed Realistic Community, Machinery & Outbreak DEMO Data
        demo_json_path = Path(__file__).resolve().parent.parent / "datasets" / "demo" / "community_demo_data.json"
        if demo_json_path.exists():
            print("Seeding realistic Community, Machinery, and Outbreak DEMO datasets...")
            with open(demo_json_path, "r", encoding="utf-8") as f:
                demo_data = json.load(f)

            # Seed demo farmers and their farms
            seeded_users = {}
            for f_info in demo_data.get("demo_farmers", []):
                u = db.query(User).filter(User.email == f_info["email"]).first()
                if not u:
                    u = User(
                        email=f_info["email"],
                        hashed_password=hash_password(settings.DEMO_FARMER_PASSWORD),
                        full_name=f_info["full_name"],
                        phone_number=f_info["phone_number"],
                        role=UserRole.FARMER,
                        preferred_language=Language.TE,
                        is_active=True,
                        is_demo_account=True,
                    )
                    db.add(u)
                    db.commit()
                    db.refresh(u)

                    # Create corresponding farm
                    f_farm = Farm(
                        user_id=u.id,
                        name=f"{f_info['village']} Parcel",
                        area=4.0,
                        ownership_type=OwnershipType.OWNED,
                        owned_area=4.0,
                        leased_area=0.0,
                        lease_amount=0.0,
                        village=f_info["village"],
                        district=f_info["district"],
                        state=f_info["state"],
                        latitude=f_info["lat"],
                        longitude=f_info["lon"],
                    )
                    db.add(f_farm)
                    db.commit()
                    db.refresh(f_farm)

                    # Add active crop cycle
                    for c_name in f_info.get("crops", ["Cotton"]):
                        cycle = CurrentCropCycle(
                            farm_id=f_farm.id,
                            crop_name=c_name,
                            variety="Hybrid",
                            planting_date=date(2026, 8, 20),
                            current_stage=CropStage.FLOWERING,
                            is_active=True,
                        )
                        db.add(cycle)
                    db.commit()

                seeded_users[f_info["village"]] = u

            # Seed Farmer Groups
            seeded_groups = {}
            for g_info in demo_data.get("farmer_groups", []):
                g = db.query(FarmerGroup).filter(FarmerGroup.name == g_info["name"]).first()
                creator = seeded_users.get(g_info["village"], farmer)
                if not g:
                    g = FarmerGroup(
                        name=g_info["name"],
                        description=g_info["description"],
                        village=g_info["village"],
                        district=g_info["district"],
                        state=g_info["state"],
                        crop_focus=g_info["crop_focus"],
                        created_by_user_id=creator.id,
                        is_demo=True,
                    )
                    db.add(g)
                    db.commit()
                    db.refresh(g)

                    # Add creator as consented member
                    m_creator = GroupMember(
                        group_id=g.id,
                        user_id=creator.id,
                        role="creator",
                        consent_share_contact=True,
                        consent_at=utc_now(),
                    )
                    db.add(m_creator)

                    # Add Ramesh as member with explicit consent in Warangal Cotton Collective
                    if g.name == "Warangal Cotton Collective":
                        m_ramesh = GroupMember(
                            group_id=g.id,
                            user_id=farmer.id,
                            role="member",
                            consent_share_contact=True,
                            consent_at=utc_now(),
                        )
                        db.add(m_ramesh)

                    # Add other neighboring farmers
                    for u in seeded_users.values():
                        if u.id != creator.id and (g.name != "Warangal Cotton Collective" or u.id != farmer.id):
                            # Mallesh and Kavitha opt in; Venkatesh opts out to test boundaries
                            consent = "Venkatesh" not in u.full_name
                            m_other = GroupMember(
                                group_id=g.id,
                                user_id=u.id,
                                role="member",
                                consent_share_contact=consent,
                                consent_at=utc_now() if consent else None,
                            )
                            db.add(m_other)
                    db.commit()

                seeded_groups[g.name] = g

            # Seed Requests
            for r_info in demo_data.get("requests", []):
                existing_req = db.query(CommunityRequest).filter(CommunityRequest.title == r_info["title"]).first()
                if not existing_req:
                    g_target = seeded_groups.get("Warangal Cotton Collective")
                    req = CommunityRequest(
                        group_id=g_target.id if g_target else None,
                        created_by_user_id=farmer.id,
                        request_type=r_info["request_type"],
                        title=r_info["title"],
                        description=r_info["description"],
                        target_date=utc_now(),
                        status="OPEN",
                        village=r_info["village"],
                        district=r_info["district"],
                        state="Telangana",
                        destination=r_info.get("destination"),
                        total_capacity_quintals=r_info.get("total_capacity_quintals"),
                        current_weight_quintals=r_info.get("creator_quantity", 10.0),
                        base_truck_cost=r_info.get("base_truck_cost"),
                        rate_per_km=r_info.get("rate_per_km"),
                        distance_km=r_info.get("distance_km"),
                        item_name=r_info.get("item_name"),
                        target_quantity=r_info.get("target_quantity"),
                        unit=r_info.get("unit"),
                        bulk_price_per_unit=r_info.get("bulk_price_per_unit"),
                        retail_price_per_unit=r_info.get("retail_price_per_unit"),
                        crop_name=r_info.get("crop_name"),
                        target_quantity_quintals=r_info.get("target_quantity_quintals"),
                        expected_price_per_quintal=r_info.get("expected_price_per_quintal"),
                        is_demo=True,
                    )
                    db.add(req)
                    db.commit()
                    db.refresh(req)

                    # Add Ramesh as first participant
                    p1 = RequestParticipant(
                        request_id=req.id,
                        user_id=farmer.id,
                        quantity_or_weight=r_info.get("creator_quantity", 10.0),
                        distance_km=r_info.get("distance_km", 25.0) or 25.0,
                        notes="Ramesh (Demo Farmer - Host)",
                    )
                    db.add(p1)

                    # If transport, add 2 neighboring participants (Mallesh with 15q, Kavitha with 10q)
                    if r_info["request_type"] == "transport":
                        u_mallesh = db.query(User).filter(User.email == "mallesh.demo@agrisage.demo").first()
                        u_kavitha = db.query(User).filter(User.email == "kavitha.demo@agrisage.demo").first()
                        if u_mallesh:
                            db.add(RequestParticipant(
                                request_id=req.id,
                                user_id=u_mallesh.id,
                                quantity_or_weight=15.0,
                                distance_km=28.0,
                                notes="Mallesh Goud (Dharmasagar)",
                            ))
                            req.current_weight_quintals += 15.0
                        if u_kavitha:
                            db.add(RequestParticipant(
                                request_id=req.id,
                                user_id=u_kavitha.id,
                                quantity_or_weight=10.0,
                                distance_km=24.0,
                                notes="Kavitha Reddy (Hasanparthy)",
                            ))
                            req.current_weight_quintals += 10.0
                    db.commit()

            # Seed Machinery Listings
            for m_info in demo_data.get("machinery_listings", []):
                m_exist = db.query(MachineryListing).filter(MachineryListing.name == m_info["name"]).first()
                if not m_exist:
                    owner_user = seeded_users.get(m_info["village"], farmer)
                    m_item = MachineryListing(
                        owner_id=owner_user.id,
                        name=m_info["name"],
                        category=m_info["category"],
                        hourly_rate=m_info["hourly_rate"],
                        daily_rate=m_info["daily_rate"],
                        village=m_info["village"],
                        district=m_info["district"],
                        state="Telangana",
                        latitude=m_info["lat"],
                        longitude=m_info["lon"],
                        is_available=True,
                        contact_phone_opt_in=m_info.get("contact_phone_opt_in", False),
                        description=m_info["description"],
                        is_demo=True,
                    )
                    db.add(m_item)
            db.commit()

            # Seed Disease Outbreaks
            for o_info in demo_data.get("disease_outbreaks", []):
                # Check if outbreaks already seeded for village/disease
                exist_outbreak = (
                    db.query(DiseasePrediction)
                    .filter(
                        DiseasePrediction.village == o_info["village"],
                        DiseasePrediction.predicted_disease == o_info["predicted_disease"],
                    )
                    .first()
                )
                if not exist_outbreak:
                    for _ in range(o_info.get("count", 1)):
                        dp = DiseasePrediction(
                            farm_id=farm.id,
                            user_id=farmer.id,
                            image_path=None,
                            crop_hint=o_info["crop_hint"],
                            predicted_disease=o_info["predicted_disease"],
                            confidence=o_info["confidence"],
                            top3_json="[]",
                            village=o_info["village"],
                            district=o_info["district"],
                            state=o_info["state"],
                            reported_to_outbreak=True,
                            created_at=utc_now(),
                        )
                        db.add(dp)
            db.commit()
            print("Community, Machinery, and Outbreak DEMO datasets successfully seeded.")

        print("\n=== Idempotent Seeding Completed Successfully! ===")
        print(f"Demo Farmer : {farmer_email} (One-Click Demo Mode supported)")
        print(f"Demo Expert : {expert_email} (Password: {settings.DEMO_EXPERT_PASSWORD})")
        print(f"Demo Buyer  : {buyer_email} (Password: {settings.DEMO_BUYER_PASSWORD})")
        print(f"Demo Admin  : {admin_email} (Password: {settings.DEMO_ADMIN_PASSWORD})")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
