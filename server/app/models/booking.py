from sqlalchemy import Column, Integer, Numeric, String, DateTime, ForeignKey, UniqueConstraint, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base
from app.core.timezone import get_local_now


class BookingStatus(str, enum.Enum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    CANCELLED = "Cancelled"


class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    showtime_id = Column(Integer, ForeignKey("showtimes.showtime_id", ondelete="CASCADE"), nullable=False, index=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(BookingStatus, values_callable=lambda obj: [e.value for e in obj]), default=BookingStatus.PENDING, nullable=False, index=True)
    customer_name = Column(String(100), nullable=True)
    customer_email = Column(String(150), nullable=True, index=True)
    customer_phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=get_local_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="bookings")
    showtime = relationship("Showtime", back_populates="bookings")
    booking_seats = relationship("BookingSeat", back_populates="booking", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    fb_orders = relationship("FBOrder", back_populates="booking", cascade="all, delete-orphan")


class BookingSeat(Base):
    """
    Junction table for reserved seats per booking.
    Includes composite unique constraint on (showtime_id, seat_id) to strictly prevent
    double-booking at the MySQL database layer.
    """
    __tablename__ = "booking_seats"

    booking_seat_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.booking_id", ondelete="CASCADE"), nullable=False)
    seat_id = Column(Integer, ForeignKey("seats.seat_id", ondelete="CASCADE"), nullable=False)
    showtime_id = Column(Integer, ForeignKey("showtimes.showtime_id", ondelete="CASCADE"), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)

    # Relationships
    booking = relationship("Booking", back_populates="booking_seats")
    seat = relationship("Seat", back_populates="booking_seats")
    showtime = relationship("Showtime", back_populates="booking_seats")

    __table_args__ = (
        UniqueConstraint("showtime_id", "seat_id", name="uq_showtime_seat"),
    )
