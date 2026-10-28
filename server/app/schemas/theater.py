from pydantic import BaseModel, ConfigDict
from typing import List, Optional


class SeatBase(BaseModel):
    row_label: str
    seat_number: int
    seat_type: str = "Regular"


class SeatCreate(SeatBase):
    pass


class SeatOut(SeatBase):
    seat_id: int
    hall_id: int
    status: Optional[str] = "Available"  # Available, Booked, Locked

    model_config = ConfigDict(from_attributes=True)


class SeatBatchCreate(BaseModel):
    rows: List[str]  # e.g., ["A", "B", "C"]
    seats_per_row: int  # e.g., 10
    seat_type: str = "Regular"


class TheaterBase(BaseModel):
    name: str
    city: str
    address: str


class TheaterSimpleOut(TheaterBase):
    theater_id: int

    model_config = ConfigDict(from_attributes=True)


class HallBase(BaseModel):
    hall_name: str
    total_capacity: int


class HallCreate(HallBase):
    pass


class HallOut(HallBase):
    hall_id: int
    theater_id: int
    seats: List[SeatOut] = []
    theater: Optional[TheaterSimpleOut] = None

    model_config = ConfigDict(from_attributes=True)


class TheaterCreate(TheaterBase):
    pass


class TheaterOut(TheaterBase):
    theater_id: int
    halls: List[HallOut] = []

    model_config = ConfigDict(from_attributes=True)
