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
from backend.app.database.session import SessionLocal, init_db
from backend.app.models.user import User, UserRole, Language
from backend.app.models.farm import (
    Farm,
    OwnershipType,
    IrrigationMethod,
    CropHistory,
    CurrentCropCycle,
    CropStage,
)
from backend.app.models.market import MarketplaceListing, MarketplaceInquiry, FarmerRating
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

        # 6. Seed Demo Marketplace Listings and Inquiries
        listing_cotton = db.query(MarketplaceListing).filter(
            MarketplaceListing.farmer_id == farmer.id,
            MarketplaceListing.crop_name == "Cotton",
        ).first()
        if not listing_cotton:
            print("Creating Ramesh's demo cotton harvest listing...")
            listing_cotton = MarketplaceListing(
                farmer_id=farmer.id,
                crop_name="Cotton",
                variety="Bollgard II Hybrid",
                quantity_quintals=40.0,
                expected_price_per_q=7250.0,
                state="Telangana",
                district="Warangal",
                village="Geikonda",
                harvest_date="2027-01-15",
                description="Quality Bollgard II cotton harvest from drip-irrigated holding in Geikonda. Moisture below 8%, clean staple.",
                status="active",
                is_verified_seller=True,
            )
            db.add(listing_cotton)
            db.commit()
            db.refresh(listing_cotton)

            # Seed Buyer inquiry from Suresh Reddy
            inq = MarketplaceInquiry(
                listing_id=listing_cotton.id,
                buyer_id=buyer.id,
                offered_price_per_q=7200.0,
                quantity_quintals=40.0,
                message="Warangal Cotton FPO procurement offer. Immediate electronic settlement on mandi weighment.",
                status="pending",
            )
            db.add(inq)
            db.commit()

            # Seed demo rating
            review = FarmerRating(
                farmer_id=farmer.id,
                buyer_id=buyer.id,
                listing_id=listing_cotton.id,
                rating=5,
                comment="Reliable harvest, genuine sample quality and prompt communication.",
            )
            db.add(review)
            db.commit()
            print("Demo marketplace listing, inquiry, and review seeded.")

        print("\n=== Idempotent Seeding Completed Successfully! ===")
        print(f"Demo Farmer : {farmer_email} (One-Click Demo Mode supported)")
        print(f"Demo Expert : {expert_email} (Password: {settings.DEMO_EXPERT_PASSWORD})")
        print(f"Demo Buyer  : {buyer_email} (Password: {settings.DEMO_BUYER_PASSWORD})")
        print(f"Demo Admin  : {admin_email} (Password: {settings.DEMO_ADMIN_PASSWORD})")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
