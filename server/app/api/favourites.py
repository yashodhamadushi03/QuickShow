from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.movie import Movie
from app.models.favourite import Favourite
from app.schemas.movie import MovieOut
from app.api.deps import get_current_user_optional

router = APIRouter(prefix="/favourites", tags=["Favourites"])


class FavouriteCreate(BaseModel):
    movie_id: int
    email: Optional[str] = None


@router.get("", response_model=List[MovieOut])
def get_user_favourites(
    email: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Retrieve all favorited movies for the authenticated user or specified email."""
    target_user = current_user
    if not target_user and email:
        clean_email = email.strip().lower()
        target_user = db.query(User).filter(User.email == clean_email).first()

    if not target_user:
        # Default fallback to first customer if unauthenticated in demo mode
        target_user = db.query(User).filter(User.role == UserRole.CUSTOMER).first()

    if not target_user:
        return []

    favs = db.query(Favourite).filter(Favourite.user_id == target_user.user_id).all()
    movie_ids = [f.movie_id for f in favs]
    if not movie_ids:
        return []

    movies = db.query(Movie).filter(Movie.movie_id.in_(movie_ids)).all()
    return movies


@router.post("", status_code=status.HTTP_201_CREATED)
def add_favourite(
    fav_in: FavouriteCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Add a movie to user's favourites in MySQL database."""
    target_user = current_user
    if not target_user and fav_in.email:
        clean_email = fav_in.email.strip().lower()
        target_user = db.query(User).filter(User.email == clean_email).first()
        if not target_user:
            target_user = User(
                name="Cinema Fan",
                email=clean_email,
                password_hash="fav_user_hash",
                role=UserRole.CUSTOMER
            )
            db.add(target_user)
            db.flush()

    if not target_user:
        target_user = db.query(User).filter(User.role == UserRole.CUSTOMER).first()

    if not target_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User account required to favorite movie")

    movie = db.query(Movie).filter(Movie.movie_id == fav_in.movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")

    existing = db.query(Favourite).filter(
        Favourite.user_id == target_user.user_id,
        Favourite.movie_id == fav_in.movie_id
    ).first()

    if not existing:
        fav = Favourite(user_id=target_user.user_id, movie_id=fav_in.movie_id)
        db.add(fav)
        db.commit()

    return {"status": "success", "message": f"Movie '{movie.title}' added to favourites", "movie_id": fav_in.movie_id}


@router.delete("/{movie_id}", status_code=status.HTTP_200_OK)
def remove_favourite(
    movie_id: int,
    email: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Remove a movie from user's favourites in MySQL database."""
    target_user = current_user
    if not target_user and email:
        clean_email = email.strip().lower()
        target_user = db.query(User).filter(User.email == clean_email).first()

    if not target_user:
        target_user = db.query(User).filter(User.role == UserRole.CUSTOMER).first()

    if not target_user:
        return {"status": "success", "message": "Favourite removed"}

    db.query(Favourite).filter(
        Favourite.user_id == target_user.user_id,
        Favourite.movie_id == movie_id
    ).delete(synchronize_session=False)
    db.commit()

    return {"status": "success", "message": "Movie removed from favourites", "movie_id": movie_id}
