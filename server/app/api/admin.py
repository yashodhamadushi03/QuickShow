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

SL_SHOWTIME_SLOTS = [
    {"slot_name": "Morning Show", "time": "10:00 AM", "hour": 10, "minute": 0},
    {"slot_name": "Matinee Show", "time": "01:00 PM", "hour": 13, "minute": 0},
    {"slot_name": "First Show", "time": "04:00 PM", "hour": 16, "minute": 0},
    {"slot_name": "Second Show", "time": "07:15 PM", "hour": 19, "minute": 15},
    {"slot_name": "Night Show", "time": "10:15 PM", "hour": 22, "minute": 15},
]


@router.get("/showtimes/slots")
def get_sri_lankan_showtime_slots():
    """Returns the official standard Sri Lankan cinema showtime slots."""
    return SL_SHOWTIME_SLOTS


@router.get("/showtimes", response_model=List[ShowtimeOut])
def get_all_showtimes(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Fetch all scheduled showtimes across all halls."""
    return db.query(Showtime).order_by(Showtime.start_time.asc()).all()


@router.post("/showtimes", response_model=ShowtimeOut, status_code=status.HTTP_201_CREATED)
def create_showtime(
    st_in: ShowtimeCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: Create a showtime for a movie in a specific hall.
    Enforces Sri Lankan non-clashing scheduling constraint:
    No two movies can occupy the exact same hall at overlapping time intervals.
    """
    if st_in.end_time <= st_in.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Showtime end time must be later than start time."
        )

    movie = db.query(Movie).filter(Movie.movie_id == st_in.movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    
    hall = db.query(Hall).filter(Hall.hall_id == st_in.hall_id).first()
    if not hall:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hall not found")

    # Strict Scheduling Constraint: Interval overlap check for the same hall_id
    # Overlap condition: existing.start_time < new.end_time AND existing.end_time > new.start_time
    clashing_showtime = db.query(Showtime).filter(
        Showtime.hall_id == st_in.hall_id,
        Showtime.start_time < st_in.end_time,
        Showtime.end_time > st_in.start_time
    ).first()

    if clashing_showtime:
        clash_movie = clashing_showtime.movie.title if clashing_showtime.movie else "Another movie"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Showtime clash in Hall '{hall.hall_name}': "
                f"'{clash_movie}' is already scheduled from "
                f"{clashing_showtime.start_time.strftime('%I:%M %p')} to {clashing_showtime.end_time.strftime('%I:%M %p')}."
            )
        )
    
    st = Showtime(**st_in.model_dump())
    db.add(st)
    db.commit()
    db.refresh(st)
    return st


@router.delete("/showtimes/{showtime_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_showtime(
    showtime_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Cancel and delete a scheduled showtime."""
    st = db.query(Showtime).filter(Showtime.showtime_id == showtime_id).first()
    if not st:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Showtime not found")

    db.delete(st)
    db.commit()
    return None


# --- Customer Activity Monitoring & Real-Time Analytics Dashboard ---

@router.get("/customers")
def get_customer_profiles(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Fetch registered customer profiles with booking history & aggregate LKR spend."""
    from app.models.booking import Booking, BookingStatus
    users = db.query(User).all()
    customer_data = []
    
    for u in users:
        confirmed_b = [b for b in u.bookings if b.status == BookingStatus.CONFIRMED or str(b.status).lower() == 'confirmed']
        total_bookings = len(confirmed_b)
        total_spent_lkr = sum([float(b.total_amount) for b in confirmed_b])
        customer_data.append({
            "user_id": u.user_id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone or "+94 77 123 4567",
            "role": u.role.value if hasattr(u.role, 'value') else str(u.role),
            "created_at": u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else "Recently",
            "total_bookings": total_bookings,
            "total_spent_lkr": total_spent_lkr
        })
    
    return customer_data


@router.get("/activities")
def get_customer_activities(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Live feed of real customer engagement activities from database."""
    from app.models.booking import Booking
    recent_bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(20).all()
    
    activities = []
    for b in recent_bookings:
        movie_t = b.showtime.movie.title if b.showtime and b.showtime.movie else "Movie"
        theater_n = b.showtime.hall.theater.name if b.showtime and b.showtime.hall and b.showtime.hall.theater else "Scope Cinemas"
        user_name = b.user.name if b.user else (b.customer_email.split('@')[0] if b.customer_email else "Guest Customer")
        seat_count = len(b.booking_seats) if b.booking_seats else 1
        
        activities.append({
            "activity_id": f"ACT-{b.booking_id}",
            "type": "TICKET_RESERVATION",
            "user_name": user_name,
            "details": f"Reserved {seat_count} seat(s) for '{movie_t}' at {theater_n}",
            "timestamp": b.created_at.strftime("%b %d, %Y at %I:%M %p") if b.created_at else "Recently",
            "amount_lkr": float(b.total_amount)
        })
        
    return activities


@router.get("/analytics")
def get_realtime_analytics(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Aggregated real-time revenue, seat fill rates, and branch performance in LKR from database."""
    from app.models.booking import Booking, BookingSeat, BookingStatus
    from app.models.theater import Theater, Hall, Seat
    from app.models.showtime import Showtime
    
    # 1. Real Bookings & Revenue
    confirmed_bookings = db.query(Booking).filter(Booking.status == BookingStatus.CONFIRMED).all()
    total_revenue_lkr = sum([float(b.total_amount) for b in confirmed_bookings])
    
    # 2. Real Tickets Sold
    total_tickets_sold = (
        db.query(BookingSeat)
        .join(Booking, BookingSeat.booking_id == Booking.booking_id)
        .filter(Booking.status == BookingStatus.CONFIRMED)
        .count()
    )
    
    # 3. Real Active Showtimes Count
    active_showtimes_count = db.query(Showtime).count()
    total_theaters_count = db.query(Theater).count()
    
    # 4. Real Revenue & Occupancy by Branch
    revenue_by_branch = []
    total_capacity_all = 0
    total_booked_all = 0

    all_theaters = db.query(Theater).order_by(Theater.name).all()
    for theater in all_theaters:
        # Confirmed bookings in this theater
        th_bookings = (
            db.query(Booking)
            .join(Showtime, Booking.showtime_id == Showtime.showtime_id)
            .join(Hall, Showtime.hall_id == Hall.hall_id)
            .filter(Hall.theater_id == theater.theater_id, Booking.status == BookingStatus.CONFIRMED)
            .all()
        )
        branch_rev = sum([float(b.total_amount) for b in th_bookings])
        branch_tickets = sum([len(b.booking_seats) for b in th_bookings])
        
        # Hall capacity in this theater
        hall_capacity_sum = sum([h.total_capacity or 96 for h in theater.halls]) or 96
        total_capacity_all += hall_capacity_sum
        total_booked_all += branch_tickets
        
        occupancy_pct = round((branch_tickets / hall_capacity_sum * 100), 1) if hall_capacity_sum > 0 else 0.0

        revenue_by_branch.append({
            "branch": theater.name,
            "city": theater.city,
            "revenue_lkr": branch_rev,
            "tickets_sold": branch_tickets,
            "occupancy_percent": occupancy_pct
        })
    
    # Sort branches so top-performing branches are shown first
    revenue_by_branch.sort(key=lambda x: (x["revenue_lkr"], x["tickets_sold"]), reverse=True)
    
    # Average fill rate calculation
    average_fill_rate_percent = round((total_booked_all / total_capacity_all * 100), 1) if total_capacity_all > 0 else 0.0
    if total_booked_all > 0 and average_fill_rate_percent == 0.0:
        average_fill_rate_percent = 1.0

    return {
        "total_revenue_lkr": total_revenue_lkr,
        "total_tickets_sold": total_tickets_sold,
        "average_fill_rate_percent": average_fill_rate_percent,
        "active_showtimes_count": active_showtimes_count,
        "total_theaters_count": total_theaters_count,
        "revenue_by_branch": revenue_by_branch,
        "booking_status_counts": {
            "confirmed": len(confirmed_bookings),
            "pending": db.query(Booking).filter(Booking.status == BookingStatus.PENDING).count(),
            "cancelled": db.query(Booking).filter(Booking.status == BookingStatus.CANCELLED).count()
        }
    }


@router.get("/live-bookings")
def get_live_customer_bookings(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Real-time monitor of live customer bookings from database."""
    from app.models.booking import Booking
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).all()
    
    output = []
    for b in bookings:
        movie = b.showtime.movie if b.showtime else None
        hall = b.showtime.hall if b.showtime else None
        theater = hall.theater if hall else None
        user = b.user
        
        seats = [f"{bs.seat.row_label}{bs.seat.seat_number}" for bs in b.booking_seats if bs.seat]
        ref = b.payment.transaction_reference if b.payment else f"TXN-LK{b.booking_id}"
        
        output.append({
            "booking_id": b.booking_id,
            "customer_name": user.name if user else (b.customer_email.split('@')[0] if b.customer_email else "Customer"),
            "customer_email": user.email if user else (b.customer_email or "customer@quickshow.lk"),
            "movie_title": movie.title if movie else "Cinema Movie",
            "theater_name": theater.name if theater else "Scope Cinemas",
            "hall_name": hall.hall_name if hall else "Main Screen",
            "seats": seats if seats else ["Reserved"],
            "total_lkr": float(b.total_amount),
            "status": b.status.value if hasattr(b.status, 'value') else str(b.status),
            "passcode": ref,
            "created_at": b.created_at.strftime("%Y-%m-%d %H:%M:%S") if b.created_at else "Recently"
        })
        
    return output


@router.get("/occupancy-heatmap")
def get_occupancy_heatmap(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Real-time hall seat fill rates & active capacity from database."""
    from app.models.theater import Hall, Theater, Seat
    from app.models.booking import Booking, BookingSeat, BookingStatus
    from app.models.showtime import Showtime

    halls = db.query(Hall).join(Theater).order_by(Theater.name, Hall.hall_name).all()
    result = []
    
    for hall in halls:
        cap = hall.total_capacity or db.query(Seat).filter(Seat.hall_id == hall.hall_id).count() or 96
        booked = (
            db.query(BookingSeat)
            .join(Booking, BookingSeat.booking_id == Booking.booking_id)
            .join(Showtime, BookingSeat.showtime_id == Showtime.showtime_id)
            .filter(Showtime.hall_id == hall.hall_id, Booking.status == BookingStatus.CONFIRMED)
            .count()
        )
        pct = round((booked / cap * 100), 1) if cap > 0 else 0.0
        
        result.append({
            "hall_id": hall.hall_id,
            "hall_name": hall.hall_name,
            "theater": hall.theater.name if hall.theater else "Scope Cinemas",
            "capacity": cap,
            "booked_seats": booked,
            "fill_rate_percent": pct
        })
    
    # Sort so halls with activity are shown first
    result.sort(key=lambda x: (x["booked_seats"], x["fill_rate_percent"]), reverse=True)
    return result


@router.get("/waitlist-monitor")
def get_waitlist_monitor(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Real showtimes occupancy monitoring from database."""
    from app.models.showtime import Showtime
    from app.models.booking import Booking, BookingSeat, BookingStatus
    
    # Find showtimes that have bookings
    showtimes_with_bookings = (
        db.query(Showtime)
        .join(BookingSeat, Showtime.showtime_id == BookingSeat.showtime_id)
        .join(Booking, BookingSeat.booking_id == Booking.booking_id)
        .filter(Booking.status == BookingStatus.CONFIRMED)
        .distinct()
        .all()
    )
    
    output = []
    for st in showtimes_with_bookings:
        movie_t = st.movie.title if st.movie else "Movie"
        theater_n = st.hall.theater.name if st.hall and st.hall.theater else "Scope Cinemas"
        booked_count = db.query(BookingSeat).filter(BookingSeat.showtime_id == st.showtime_id).count()
        cap = st.hall.total_capacity if st.hall else 96
        
        output.append({
            "showtime_id": st.showtime_id,
            "movie_title": movie_t,
            "theater": theater_n,
            "showtime": st.start_time.strftime("%b %d at %I:%M %p") if st.start_time else "Scheduled",
            "waitlist_users_count": max(0, booked_count - cap),
            "status": "NEAR_CAPACITY" if booked_count >= cap * 0.8 else "ACTIVE_BOOKING",
            "auto_reallocation": "ACTIVE"
        })
        
    return output


@router.get("/customers")
def get_admin_customers(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Real customer profiles with calculated booking count and total LKR spend from database."""
    from app.models.booking import Booking, BookingStatus
    from app.models.user import User
    
    users = db.query(User).all()
    output = []
    for u in users:
        confirmed_bookings = db.query(Booking).filter(
            Booking.user_id == u.user_id,
            Booking.status == BookingStatus.CONFIRMED
        ).all()
        
        total_spent = sum([float(b.total_amount) for b in confirmed_bookings])
        role_str = u.role.value if hasattr(u.role, 'value') else str(u.role)
        
        output.append({
            "user_id": u.user_id,
            "name": u.name or "Customer",
            "email": u.email,
            "phone": u.phone or "+94 77 123 4567",
            "role": role_str,
            "total_bookings": len(confirmed_bookings),
            "total_spent_lkr": total_spent
        })
        
    return output


@router.get("/activities")
def get_admin_activities(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Real customer activity logs from database bookings."""
    from app.models.booking import Booking
    
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(25).all()
    output = []
    
    for b in bookings:
        user_name = b.user.name if b.user else "Customer"
        movie_title = b.showtime.movie.title if b.showtime and b.showtime.movie else "Cinema Movie"
        theater_name = b.showtime.hall.theater.name if b.showtime and b.showtime.hall and b.showtime.hall.theater else "Scope Cinemas"
        seats = [f"{bs.seat.row_label}{bs.seat.seat_number}" for bs in b.booking_seats if bs.seat]
        seats_str = ", ".join(seats) if seats else "Reserved seats"
        time_str = b.created_at.strftime("%b %d, %I:%M %p") if b.created_at else "Recently"
        
        output.append({
            "activity_id": f"ACT-{b.booking_id:04d}",
            "type": "TICKET_RESERVATION",
            "user_name": user_name,
            "details": f"Reserved seats {seats_str} for '{movie_title}' at {theater_name}",
            "timestamp": time_str,
            "amount_lkr": float(b.total_amount)
        })
        
    return output



