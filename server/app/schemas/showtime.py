from pydantic import BaseModel, ConfigDict
from datetime import datetime
from decimal import Decimal
from typing import Optional
from app.schemas.movie import MovieOut
from app.schemas.theater import HallOut, TheaterOut


class ShowtimeCreate(BaseModel):
    movie_id: int
    hall_id: int
    start_time: datetime
    end_time: datetime
    base_price: Decimal


class ShowtimeOut(BaseModel):
    showtime_id: int
    movie_id: int
    hall_id: int
    start_time: datetime
    end_time: datetime
    base_price: Decimal
    movie: Optional[MovieOut] = None
    hall: Optional[HallOut] = None

    model_config = ConfigDict(from_attributes=True)


class ShowtimeGroupedByTheater(BaseModel):
    theater: TheaterOut
    showtimes: list[ShowtimeOut]
