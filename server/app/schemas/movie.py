from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime
from app.models.movie import MovieStatus


class MovieBase(BaseModel):
    title: str
    description: Optional[str] = None
    genre: str
    duration_min: int
    language: str
    poster_url: Optional[str] = None
    rating: Optional[str] = None
    release_date: Optional[date] = None
    status: Optional[MovieStatus] = MovieStatus.NOW_SHOWING


class MovieCreate(MovieBase):
    pass


class MovieUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    genre: Optional[str] = None
    duration_min: Optional[int] = None
    language: Optional[str] = None
    poster_url: Optional[str] = None
    rating: Optional[str] = None
    release_date: Optional[date] = None
    status: Optional[MovieStatus] = None


class MovieOut(MovieBase):
    movie_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
