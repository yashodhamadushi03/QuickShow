from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
from app.core.timezone import get_local_now

class Profile(Base):
    __tablename__ = "profiles"

    profile_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    phone_number = Column(String(25), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    preferred_theater_id = Column(Integer, ForeignKey("theaters.theater_id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime, default=get_local_now, onupdate=get_local_now, nullable=False)
    user = relationship("User", backref="profile")
    preferred_theater = relationship("Theater", backref="profiles")
