from sqlalchemy import Column, Integer, String, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class Theater(Base):
    __tablename__ = "theaters"

    theater_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    city = Column(String(100), index=True, nullable=False)
    address = Column(Text, nullable=False)
    halls = relationship("Hall", back_populates="theater", cascade="all, delete-orphan")

class Hall(Base):
    __tablename__ = "halls"

    hall_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    theater_id = Column(Integer, ForeignKey("theaters.theater_id", ondelete="CASCADE"), nullable=False)
    hall_name = Column(String(100), nullable=False)
    total_capacity = Column(Integer, nullable=False, default=0)
    theater = relationship("Theater", back_populates="halls")
    seats = relationship("Seat", back_populates="hall", cascade="all, delete-orphan")
    showtimes = relationship("Showtime", back_populates="hall", cascade="all, delete-orphan")

class Seat(Base):
    __tablename__ = "seats"

    seat_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hall_id = Column(Integer, ForeignKey("halls.hall_id", ondelete="CASCADE"), nullable=False)
    row_label = Column(String(10), nullable=False)
    seat_number = Column(Integer, nullable=False)
    seat_type = Column(String(30), nullable=False, default="Regular")  # Regular, VIP, Balcony
    hall = relationship("Hall", back_populates="seats")
    booking_seats = relationship("BookingSeat", back_populates="seat", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("hall_id", "row_label", "seat_number", name="uq_hall_row_seat"),
    )
