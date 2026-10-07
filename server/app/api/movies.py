from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.movie import Movie
from app.models.showtime import Showtime
from app.models.theater import Theater, Hall
from app.schemas.movie import MovieOut
from app.schemas.showtime import ShowtimeOut, ShowtimeGroupedByTheater
from app.schemas.theater import TheaterOut

router = APIRouter(prefix="/movies", tags=["Movies & Showtimes"])


@router.get("", response_model=List[MovieOut])
def get_movies(
    search: Optional[str] = Query(None, description="Search title"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    language: Optional[str] = Query(None, description="Filter by language"),
    db: Session = Depends(get_db)
):
    """List all available movies with optional search/genre/language filtering."""
    query = db.query(Movie)
    if search:
        query = query.filter(Movie.title.ilike(f"%{search}%"))
    if genre:
        query = query.filter(Movie.genre.ilike(f"%{genre}%"))
    if language:
        query = query.filter(Movie.language.ilike(f"%{language}%"))
    return query.order_by(Movie.release_date.desc()).all()


@router.get("/{movie_id}", response_model=MovieOut)
def get_movie_detail(movie_id: int, db: Session = Depends(get_db)):
    """Get details of a specific movie."""
    movie = db.query(Movie).filter(Movie.movie_id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    return movie


@router.get("/{movie_id}/showtimes", response_model=List[ShowtimeGroupedByTheater])
def get_movie_showtimes(movie_id: int, db: Session = Depends(get_db)):
    """Get available showtimes grouped by theater for a specific movie."""
    movie = db.query(Movie).filter(Movie.movie_id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")

    showtimes = (
        db.query(Showtime)
        .join(Hall, Showtime.hall_id == Hall.hall_id)
        .join(Theater, Hall.theater_id == Theater.theater_id)
        .filter(Showtime.movie_id == movie_id)
        .order_by(Theater.theater_id, Showtime.start_time)
        .all()
    )

    # Group showtimes by theater
    grouped_map = {}
    for st in showtimes:
        theater = st.hall.theater
        if theater.theater_id not in grouped_map:
            grouped_map[theater.theater_id] = {
                "theater": TheaterOut.model_validate(theater),
                "showtimes": []
            }
        grouped_map[theater.theater_id]["showtimes"].append(ShowtimeOut.model_validate(st))

    return list(grouped_map.values())
