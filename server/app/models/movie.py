from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base


class MovieStatus(str, enum.Enum):
    NOW_SHOWING = "Now Showing"
    COMING_SOON = "Coming Soon"


class Movie(Base):
    __tablename__ = "movies"

    movie_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), index=True, nullable=False)
    description = Column(Text, nullable=True)
    genre = Column(String(50), nullable=False)
    duration_min = Column(Integer, nullable=False)
    language = Column(String(50), nullable=False)
    poster_url = Column(String(500), nullable=True)
    rating = Column(String(10), nullable=True)
    release_date = Column(Date, nullable=True)
    status = Column(Enum(MovieStatus, values_callable=lambda obj: [e.value for e in obj]), default=MovieStatus.NOW_SHOWING, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    showtimes = relationship("Showtime", back_populates="movie", cascade="all, delete-orphan")

    @property
    def synopsis(self):
        return self.description

    @synopsis.setter
    def synopsis(self, value):
        self.description = value

    @property
    def duration(self):
        return self.duration_min

    @duration.setter
    def duration(self, value):
        self.duration_min = value

