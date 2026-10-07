from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User
from app.models.movie import Movie
from app.models.theater import Theater, Hall, Seat
from app.models.showtime import Showtime
from app.schemas.movie import MovieCreate, MovieUpdate, MovieOut
from app.schemas.theater import TheaterCreate, TheaterOut, HallCreate, HallOut, SeatBatchCreate, SeatOut
from app.schemas.showtime import ShowtimeCreate, ShowtimeOut
from app.api.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin Operations"])


# --- Movies Management ---

@router.post("/movies", response_model=MovieOut, status_code=status.HTTP_201_CREATED)
def create_movie(
    movie_in: MovieCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Add a new movie (Now Showing or Coming Soon)."""
    movie = Movie(**movie_in.model_dump())
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return movie


@router.put("/movies/{movie_id}", response_model=MovieOut)
def update_movie(
    movie_id: int,
    movie_in: MovieUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Update an existing movie's details or status."""
    movie = db.query(Movie).filter(Movie.movie_id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    
    update_data = movie_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(movie, field, val)
    
    db.commit()
    db.refresh(movie)
    return movie


@router.delete("/movies/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movie(
    movie_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Delete a movie."""
    movie = db.query(Movie).filter(Movie.movie_id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    
    db.delete(movie)
    db.commit()
    return None


# --- Theaters & Halls Management ---

@router.post("/theaters", response_model=TheaterOut, status_code=status.HTTP_201_CREATED)
def create_theater(
    theater_in: TheaterCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Add a new theater location."""
    theater = Theater(**theater_in.model_dump())
    db.add(theater)
    db.commit()
    db.refresh(theater)
    return theater


@router.post("/theaters/{theater_id}/halls", response_model=HallOut, status_code=status.HTTP_201_CREATED)
def create_hall(
    theater_id: int,
    hall_in: HallCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Add a screening hall to a theater."""
    theater = db.query(Theater).filter(Theater.theater_id == theater_id).first()
    if not theater:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Theater not found")
    
    hall = Hall(theater_id=theater_id, **hall_in.model_dump())
    db.add(hall)
    db.commit()
    db.refresh(hall)
    return hall


@router.post("/halls/{hall_id}/seats/batch", response_model=List[SeatOut], status_code=status.HTTP_201_CREATED)
def generate_seat_grid(
    hall_id: int,
    batch_in: SeatBatchCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Batch generate a seat grid (e.g., rows A-E with 10 seats each) for a hall."""
    hall = db.query(Hall).filter(Hall.hall_id == hall_id).first()
    if not hall:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hall not found")
    
    created_seats = []
    for row in batch_in.rows:
        for num in range(1, batch_in.seats_per_row + 1):
            # Check if seat exists
            existing = db.query(Seat).filter(
                Seat.hall_id == hall_id,
                Seat.row_label == row,
                Seat.seat_number == num
            ).first()
            
            if not existing:
                stype = "VIP" if row in ["D", "E"] else batch_in.seat_type
                seat = Seat(
                    hall_id=hall_id,
                    row_label=row,
                    seat_number=num,
                    seat_type=stype
                )
                db.add(seat)
                created_seats.append(seat)
    
    # Update total capacity of hall
    db.flush()
    total_count = db.query(Seat).filter(Seat.hall_id == hall_id).count()
    hall.total_capacity = total_count

    db.commit()
    for s in created_seats:
        db.refresh(s)
    return created_seats


# --- Showtimes Management ---

@router.post("/showtimes", response_model=ShowtimeOut, status_code=status.HTTP_201_CREATED)
def create_showtime(
    st_in: ShowtimeCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Create a showtime for a movie in a specific hall."""
    movie = db.query(Movie).filter(Movie.movie_id == st_in.movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    
    hall = db.query(Hall).filter(Hall.hall_id == st_in.hall_id).first()
    if not hall:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hall not found")
    
    st = Showtime(**st_in.model_dump())
    db.add(st)
    db.commit()
    db.refresh(st)
    return st
