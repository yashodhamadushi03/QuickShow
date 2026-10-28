from sqlalchemy import Column, Integer, Numeric, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base


class FBOrderStatus(str, enum.Enum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"


class FBOrder(Base):
    """
    Food & Beverage (Concession) Orders table for cinema multiplexes.
    Can be bundled with ticket bookings or ordered independently.
    """
    __tablename__ = "f_b_orders"

    order_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.booking_id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    item_name = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(FBOrderStatus, values_callable=lambda obj: [e.value for e in obj]), default=FBOrderStatus.CONFIRMED, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    booking = relationship("Booking", back_populates="fb_orders")
    user = relationship("User", back_populates="fb_orders")
