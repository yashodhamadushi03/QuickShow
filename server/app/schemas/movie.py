from pydantic import BaseModel, ConfigDict, model_validator, computed_field
from typing import Optional, Any
from datetime import date, datetime
from app.models.movie import MovieStatus


class MovieBase(BaseModel):
    title: str
    description: Optional[str] = None
    genre: str
    duration_min: int
    language: str
    poster_url: Optional[str] = None
    rating: Optional[str] = "PG-13"
    release_date: Optional[date] = None
    status: Optional[MovieStatus] = MovieStatus.NOW_SHOWING

    @model_validator(mode="before")
    @classmethod
    def map_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "synopsis" in data and ("description" not in data or data["description"] is None):
                data["description"] = data["synopsis"]
            if "duration" in data and ("duration_min" not in data or data["duration_min"] is None):
                try:
                    data["duration_min"] = int(data["duration"])
                except (ValueError, TypeError):
                    pass
        return data


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

    @model_validator(mode="before")
    @classmethod
    def map_update_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "synopsis" in data and ("description" not in data or data["description"] is None):
                data["description"] = data["synopsis"]
            if "duration" in data and ("duration_min" not in data or data["duration_min"] is None):
                try:
                    data["duration_min"] = int(data["duration"])
                except (ValueError, TypeError):
                    pass
        return data


class MovieOut(MovieBase):
    movie_id: int
    created_at: datetime
    showtimes_count: Optional[int] = 0

    @computed_field
    @property
    def synopsis(self) -> Optional[str]:
        return self.description

    @computed_field
    @property
    def duration(self) -> int:
        return self.duration_min

    model_config = ConfigDict(from_attributes=True)

