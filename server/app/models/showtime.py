from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Showtime(Base):
    __tablename__ = "showtimes"

    showtime_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    movie_id = Column(Integer, ForeignKey("movies.movie_id", ondelete="CASCADE"), nullable=False)
    hall_id = Column(Integer, ForeignKey("halls.hall_id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    base_price = Column(Numeric(10, 2), nullable=False)
    movie = relationship("Movie", back_populates="showtimes")
    hall = relationship("Hall", back_populates="showtimes")
    bookings = relationship("Booking", back_populates="showtime", cascade="all, delete-orphan")
    booking_seats = relationship("BookingSeat", back_populates="showtime", cascade="all, delete-orphan")
