"""
Test SQLite startup migration for soil_health_cards table:
- Builds a legacy SQLite database missing 'test_date' and 'source' columns.
- Runs idempotent migration.
- Verifies columns are added.
- Proves saving and reading SoilHealthCard works.
- Verifies idempotency by running migration again.
"""

import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from backend.app.database.migrations import run_soil_card_migrations
from backend.app.models.user import User
from backend.app.models.farm import Farm
from backend.app.models.soil_card import SoilHealthCard


def test_soil_card_startup_migration(tmp_path):
    db_file = tmp_path / "legacy_agrisage.db"
    db_url = f"sqlite:///{db_file}"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

    # 1. Create tables: users and farms via their models, and legacy soil_health_cards via raw SQL without test_date and source
    User.__table__.create(engine)
    Farm.__table__.create(engine)

    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE soil_health_cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                farm_id INTEGER NOT NULL,
                nitrogen_kg_ha FLOAT,
                phosphorus_kg_ha FLOAT,
                potassium_kg_ha FLOAT,
                ph FLOAT,
                organic_carbon_pct FLOAT,
                electrical_conductivity_ds_m FLOAT,
                soil_texture VARCHAR(100),
                extraction_method VARCHAR(50) DEFAULT 'manual',
                overall_confidence FLOAT DEFAULT 1.0,
                field_confidences_json TEXT,
                is_confirmed BOOLEAN DEFAULT 1,
                image_stored BOOLEAN DEFAULT 0,
                image_path VARCHAR(500),
                created_at DATETIME,
                updated_at DATETIME,
                FOREIGN KEY(farm_id) REFERENCES farms(id)
            )
        """))
        conn.commit()

    # 2. Inspect table to confirm columns are missing before migration
    inspector_before = inspect(engine)
    cols_before = {c["name"].lower() for c in inspector_before.get_columns("soil_health_cards")}
    assert "test_date" not in cols_before, "test_date should not exist in legacy schema"
    assert "source" not in cols_before, "source should not exist in legacy schema"

    # 3. Run the migration
    run_soil_card_migrations(bind=engine)

    # 4. Inspect table to confirm columns now exist
    inspector_after = inspect(engine)
    cols_after = {c["name"].lower() for c in inspector_after.get_columns("soil_health_cards")}
    assert "test_date" in cols_after, "test_date should have been added by migration"
    assert "source" in cols_after, "source should have been added by migration"

    # 5. Prove saving and reading work with the SQLAlchemy model
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()

    user = User(email="test_mig@example.com", hashed_password="fakehash123", full_name="Test Farmer")
    session.add(user)
    session.commit()
    session.refresh(user)

    farm = Farm(
        user_id=user.id,
        name="Parcel Alpha",
        area=4.5,
        village="Geikonda",
        district="Warangal",
        state="Telangana",
        latitude=17.98,
        longitude=79.6,
    )
    session.add(farm)
    session.commit()
    session.refresh(farm)

    card = SoilHealthCard(
        farm_id=farm.id,
        nitrogen_kg_ha=260.0,
        phosphorus_kg_ha=18.5,
        potassium_kg_ha=320.0,
        ph=7.2,
        organic_carbon_pct=0.55,
        electrical_conductivity_ds_m=0.35,
        soil_texture="Sandy Loam",
        extraction_method="gemini_vision",
        source="photo read by AI",
        test_date="2026-05-12",
        overall_confidence=0.92,
        is_confirmed=True,
    )
    session.add(card)
    session.commit()
    session.refresh(card)

    saved_id = card.id
    saved_farm_id = farm.id
    session.close()

    # Read back in fresh session
    read_session = TestingSession()
    retrieved = read_session.query(SoilHealthCard).filter_by(id=saved_id).first()
    assert retrieved is not None
    assert retrieved.farm_id == saved_farm_id
    assert retrieved.nitrogen_kg_ha == 260.0
    assert retrieved.test_date == "2026-05-12"
    assert retrieved.source == "photo read by AI"
    assert retrieved.extraction_method == "gemini_vision"
    read_session.close()

    # 6. Prove idempotency: run migration again on already-migrated database
    run_soil_card_migrations(bind=engine)

    # Verify data is still intact
    read_session2 = TestingSession()
    retrieved2 = read_session2.query(SoilHealthCard).filter_by(id=saved_id).first()
    assert retrieved2 is not None
    assert retrieved2.test_date == "2026-05-12"
    assert retrieved2.source == "photo read by AI"
    read_session2.close()
