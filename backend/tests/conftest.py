import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from backend.app.database.session import Base, get_db
from backend.app.main import app
from backend.app.security.auth import hash_password, create_access_token
from backend.app.models.user import User, UserRole, Language

# Use an isolated in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def demo_farmer(db_session: Session) -> User:
    user = User(
        email="ramesh@agrisage.demo",
        hashed_password=hash_password("FarmerRamesh@2026"),
        full_name="Ramesh Kumar (Demo Farmer)",
        role=UserRole.FARMER,
        preferred_language=Language.TE,
        is_active=True,
        is_demo_account=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def farmer_token(demo_farmer: User) -> str:
    return create_access_token({"sub": str(demo_farmer.id), "role": demo_farmer.role.value})


@pytest.fixture
def farmer_headers(farmer_token: str) -> dict:
    return {"Authorization": f"Bearer {farmer_token}"}


@pytest.fixture
def demo_admin(db_session: Session) -> User:
    admin = User(
        email="admin@agrisage.demo",
        hashed_password=hash_password("AdminDemo@2026"),
        full_name="System Administrator (Admin)",
        role=UserRole.ADMIN,
        preferred_language=Language.EN,
        is_active=True,
        is_demo_account=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def admin_token(demo_admin: User) -> str:
    return create_access_token({"sub": str(demo_admin.id), "role": demo_admin.role.value})


@pytest.fixture
def admin_headers(admin_token: str) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}

