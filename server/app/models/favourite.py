from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
from app.core.timezone import get_local_now

class Favourite(Base):
    __tablename__ = "favourites"

    favourite_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    movie_id = Column(Integer, ForeignKey("movies.movie_id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=get_local_now, nullable=False)
    user = relationship("User", backref="favourites")
    movie = relationship("Movie", backref="favourites")

    __table_args__ = (
        UniqueConstraint("user_id", "movie_id", name="uq_user_movie_favourite"),
    )
