from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from backend.app.database.session import Base, utc_now
import enum


class UserRole(str, enum.Enum):
    FARMER = "Farmer"
    EXPERT = "Expert"
    BUYER = "Buyer"
    ADMIN = "Admin"


class Language(str, enum.Enum):
    EN = "en"
    TE = "te"
    HI = "hi"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.FARMER, nullable=False)
    preferred_language = Column(SQLEnum(Language), default=Language.EN, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_demo_account = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    farms = relationship("Farm", back_populates="owner", cascade="all, delete-orphan")
