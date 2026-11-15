"""
AgriSage AI — Database Schema Migrations
Provides idempotent schema migrations for relational backends (SQLite / PostgreSQL).
"""

import logging
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine, Connection

logger = logging.getLogger(__name__)


def run_soil_card_migrations(bind=None) -> None:
    """
    Idempotent schema migration for soil_health_cards.
    Inspects existing columns in 'soil_health_cards' and adds missing columns:
      - test_date (VARCHAR(50))
      - source (VARCHAR(100))
    Safe to run repeatedly on SQLite or PostgreSQL.
    """
    from backend.app.database.session import engine as default_engine

    target = bind or default_engine

    if isinstance(target, Engine):
        with target.connect() as conn:
            _apply_soil_card_columns(conn)
            conn.commit()
    elif isinstance(target, Connection):
        _apply_soil_card_columns(target)
        try:
            target.commit()
        except Exception:
            pass
    else:
        # Fallback if target has connect method or is a connection-like object
        if hasattr(target, "connect"):
            with target.connect() as conn:
                _apply_soil_card_columns(conn)
                conn.commit()
        else:
            _apply_soil_card_columns(target)


def _apply_soil_card_columns(conn) -> None:
    inspector = inspect(conn)
    tables = inspector.get_table_names()
    if "soil_health_cards" not in tables:
        return

    existing_columns = {col["name"].lower() for col in inspector.get_columns("soil_health_cards")}

    if "test_date" not in existing_columns:
        logger.info("Migrating soil_health_cards: adding missing column 'test_date'")
        conn.execute(text("ALTER TABLE soil_health_cards ADD COLUMN test_date VARCHAR(50)"))

    if "source" not in existing_columns:
        logger.info("Migrating soil_health_cards: adding missing column 'source'")
        conn.execute(text("ALTER TABLE soil_health_cards ADD COLUMN source VARCHAR(100)"))
