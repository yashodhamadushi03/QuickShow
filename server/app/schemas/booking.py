from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from app.models.booking import BookingStatus
from app.schemas.theater import SeatOut
from app.schemas.showtime import ShowtimeOut


class BookingCreate(BaseModel):
    showtime_id: int
    seat_ids: List[int]
    customer_email: Optional[EmailStr] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None


class BookingSeatOut(BaseModel):
    booking_seat_id: int
    seat_id: int
    showtime_id: int
    price: Decimal
    seat: Optional[SeatOut] = None

    model_config = ConfigDict(from_attributes=True)


class BookingOut(BaseModel):
    booking_id: int
    user_id: int
    showtime_id: int
    total_amount: Decimal
    status: BookingStatus
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    created_at: datetime
    showtime: Optional[ShowtimeOut] = None
    booking_seats: List[BookingSeatOut] = []

    model_config = ConfigDict(from_attributes=True)
