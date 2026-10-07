from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.showtime import Showtime
from app.models.theater import Seat
from app.models.booking import Booking, BookingSeat, BookingStatus
from app.schemas.showtime import ShowtimeOut
from app.schemas.theater import SeatOut
from app.services.ai_recommendation import AIRecommendationEngine

router = APIRouter(prefix="/showtimes", tags=["Showtimes & Seats"])


@router.get("/{showtime_id}", response_model=ShowtimeOut)
def get_showtime(showtime_id: int, db: Session = Depends(get_db)):
    """Get details of a specific showtime."""
    st = db.query(Showtime).filter(Showtime.showtime_id == showtime_id).first()
    if not st:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Showtime not found")
    return st


@router.get("/{showtime_id}/seats", response_model=List[SeatOut])
def get_showtime_seat_layout(showtime_id: int, db: Session = Depends(get_db)):
    """
    Get the complete layout of seats for a showtime, with real-time status:
    - Available: Seat is free to be booked.
    - Locked: Temporarily reserved in a Pending booking transaction.
    - Booked: Already confirmed and paid for.
    """
    st = db.query(Showtime).filter(Showtime.showtime_id == showtime_id).first()
    if not st:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Showtime not found")

    # Retrieve all physical seats in the hall
    all_seats = (
        db.query(Seat)
        .filter(Seat.hall_id == st.hall_id)
        .order_by(Seat.row_label, Seat.seat_number)
        .all()
    )

    # Find all reserved/locked seats for this showtime
    active_bookings = (
        db.query(BookingSeat.seat_id, Booking.status)
        .join(Booking, BookingSeat.booking_id == Booking.booking_id)
        .filter(
            BookingSeat.showtime_id == showtime_id,
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING])
        )
        .all()
    )

    booked_map = {}
    for seat_id, booking_status in active_bookings:
        if booking_status == BookingStatus.CONFIRMED:
            booked_map[seat_id] = "Booked"
        elif booking_status == BookingStatus.PENDING:
            booked_map[seat_id] = "Locked"

    result = []
    for s in all_seats:
        seat_dict = SeatOut.model_validate(s)
        seat_dict.status = booked_map.get(s.seat_id, "Available")
        result.append(seat_dict)

    return result


@router.get("/{showtime_id}/best-seats", response_model=List[int])
def get_best_seats_recommendation(
    showtime_id: int,
    count: int = Query(2, ge=1, le=10, description="Number of seats requested"),
    db: Session = Depends(get_db)
):
    """
    Smart Seat Optimizer Algorithm ("Best Seat in the House"):
    Evaluates acoustic sweet-spot (Rows D, E, F) and center viewing angles (Seats 5, 6, 7, 8).
    Returns list of recommended seat IDs.
    """
    seats_layout = get_showtime_seat_layout(showtime_id, db)
    return AIRecommendationEngine.recommend_best_seats(seats_layout, count=count)
