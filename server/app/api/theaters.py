from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.theater import Theater, Hall
from app.schemas.theater import TheaterOut

router = APIRouter(prefix="/theaters", tags=["Theaters & Halls"])


@router.get("", response_model=List[TheaterOut])
def get_theaters(
    city: Optional[str] = Query(None, description="Filter by city"),
    db: Session = Depends(get_db)
):
    """List all available theaters and screening halls."""
    query = db.query(Theater)
    if city:
        query = query.filter(Theater.city.ilike(f"%{city}%"))
    return query.order_by(Theater.name).all()


@router.get("/{theater_id}", response_model=TheaterOut)
def get_theater_detail(theater_id: int, db: Session = Depends(get_db)):
    """Get details of a specific theater with screening halls."""
    theater = db.query(Theater).filter(Theater.theater_id == theater_id).first()
    if not theater:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Theater not found")
    return theater
