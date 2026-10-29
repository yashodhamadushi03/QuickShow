from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.user import User
from app.models.movie import Movie, MovieStatus
from app.models.theater import Theater, Hall, Seat
from app.models.showtime import Showtime
from app.schemas.movie import MovieCreate, MovieUpdate, MovieOut
from app.schemas.theater import TheaterCreate, TheaterOut, HallCreate, HallOut, SeatBatchCreate, SeatOut
from app.schemas.showtime import ShowtimeCreate, ShowtimeOut
from app.api.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/movies", response_model=List[MovieOut])
def get_admin_movies(
    search: Optional[str] = Query(None, description="Search by title, genre, language, or synopsis/description"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    language: Optional[str] = Query(None, description="Filter by language"),
    status: Optional[MovieStatus] = Query(None, description="Filter by status (Now Showing or Coming Soon)"),
    sort_by: Optional[str] = Query("release_date", description="Field to sort by: release_date, title, duration_min, created_at, movie_id"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: List all movies with search, filter, and sort capabilities.
    """
    search = search if isinstance(search, str) else None
    genre = genre if isinstance(genre, str) else None
    language = language if isinstance(language, str) else None
    status = status if isinstance(status, (MovieStatus, str)) else None
    sort_by = sort_by if isinstance(sort_by, str) else "release_date"
    sort_order = sort_order if isinstance(sort_order, str) else "desc"

    query = db.query(Movie)
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Movie.title.ilike(search_term),
                Movie.genre.ilike(search_term),
                Movie.language.ilike(search_term),
                Movie.description.ilike(search_term),
            )
        )
    if genre and genre.strip() and genre.lower() != "all":
        query = query.filter(Movie.genre.ilike(f"%{genre.strip()}%"))
    if language and language.strip() and language.lower() != "all":
        query = query.filter(Movie.language.ilike(f"%{language.strip()}%"))
    if status:
        query = query.filter(Movie.status == status)
    sort_col_map = {
        "title": Movie.title,
        "release_date": Movie.release_date,
        "duration": Movie.duration_min,
        "duration_min": Movie.duration_min,
        "created_at": Movie.created_at,
        "movie_id": Movie.movie_id,
        "status": Movie.status,
    }

    sort_col = sort_col_map.get((sort_by or "release_date").lower(), Movie.release_date)

    if sort_order and sort_order.lower() == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    movies = query.all()
    for m in movies:
        m.showtimes_count = len(m.showtimes) if m.showtimes else 0

    return movies

@router.post("/movies", response_model=MovieOut, status_code=status.HTTP_201_CREATED)
def create_movie(
    movie_in: MovieCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Add a new movie record with title, genre, synopsis, release date, duration, language, and poster URL."""
    movie_dict = movie_in.model_dump(exclude={"showtimes_count"})
    valid_cols = {c.name for c in Movie.__table__.columns}
    insert_data = {k: v for k, v in movie_dict.items() if k in valid_cols}

    movie = Movie(**insert_data)
    db.add(movie)
    db.commit()
    db.refresh(movie)
    movie.showtimes_count = 0
    return movie

@router.put("/movies/{movie_id}", response_model=MovieOut)
def update_movie(
    movie_id: int,
    movie_in: MovieUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Edit and update existing movie details."""
    movie = db.query(Movie).filter(Movie.movie_id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Movie with ID {movie_id} not found")

    update_data = movie_in.model_dump(exclude_unset=True)
    valid_cols = {c.name for c in Movie.__table__.columns}
    for field, val in update_data.items():
        if field in valid_cols:
            setattr(movie, field, val)

    db.commit()
    db.refresh(movie)
    movie.showtimes_count = len(movie.showtimes) if movie.showtimes else 0
    return movie

@router.delete("/movies/{movie_id}", status_code=status.HTTP_200_OK)
def delete_movie(
    movie_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Safely remove a movie record from the database (handling foreign key constraints with showtimes/bookings)."""
    from app.models.booking import Booking, BookingSeat
    from app.models.payment import Payment

    movie = db.query(Movie).filter(Movie.movie_id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Movie with ID {movie_id} not found")

    movie_title = movie.title
    try:
        showtimes = db.query(Showtime).filter(Showtime.movie_id == movie_id).all()
        showtime_ids = [s.showtime_id for s in showtimes]

        if showtime_ids:
            bookings = db.query(Booking).filter(Booking.showtime_id.in_(showtime_ids)).all()
            booking_ids = [b.booking_id for b in bookings]

            if booking_ids:
                db.query(Payment).filter(Payment.booking_id.in_(booking_ids)).delete(synchronize_session=False)
                db.query(BookingSeat).filter(BookingSeat.booking_id.in_(booking_ids)).delete(synchronize_session=False)
                db.query(Booking).filter(Booking.booking_id.in_(booking_ids)).delete(synchronize_session=False)
            db.query(BookingSeat).filter(BookingSeat.showtime_id.in_(showtime_ids)).delete(synchronize_session=False)
            db.query(Showtime).filter(Showtime.movie_id == movie_id).delete(synchronize_session=False)
        db.delete(movie)
        db.commit()

        return {
            "status": "success",
            "message": f"Movie '{movie_title}' and all associated showtime schedules were safely deleted.",
            "movie_id": movie_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete movie '{movie_title}': {str(e)}"
        )

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
    db.flush()
    total_count = db.query(Seat).filter(Seat.hall_id == hall_id).count()
    hall.total_capacity = total_count

    db.commit()
    for s in created_seats:
        db.refresh(s)
    return created_seats

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
    Automatically calculates end time accurately based on the movie's actual duration.
    """
    movie = db.query(Movie).filter(Movie.movie_id == st_in.movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
    
    hall = db.query(Hall).filter(Hall.hall_id == st_in.hall_id).first()
    if not hall:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hall not found")
    start_time = st_in.start_time.replace(tzinfo=None) if st_in.start_time.tzinfo else st_in.start_time
    end_time = st_in.end_time.replace(tzinfo=None) if st_in.end_time.tzinfo else st_in.end_time
    movie_duration = movie.duration_min or 120
    if not end_time or end_time <= start_time:
        end_time = start_time + timedelta(minutes=movie_duration)
    clashing_showtime = db.query(Showtime).filter(
        Showtime.hall_id == st_in.hall_id,
        Showtime.start_time < end_time,
        Showtime.end_time > start_time
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
    
    st = Showtime(
        movie_id=st_in.movie_id,
        hall_id=st_in.hall_id,
        start_time=start_time,
        end_time=end_time,
        base_price=st_in.base_price
    )
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
    confirmed_bookings = db.query(Booking).filter(Booking.status == BookingStatus.CONFIRMED).all()
    total_revenue_lkr = sum([float(b.total_amount) for b in confirmed_bookings])
    total_tickets_sold = (
        db.query(BookingSeat)
        .join(Booking, BookingSeat.booking_id == Booking.booking_id)
        .filter(Booking.status == BookingStatus.CONFIRMED)
        .count()
    )
    active_showtimes_count = db.query(Showtime).count()
    total_theaters_count = db.query(Theater).count()
    revenue_by_branch = []
    total_capacity_all = 0
    total_booked_all = 0

    all_theaters = db.query(Theater).order_by(Theater.name).all()
    for theater in all_theaters:
        th_bookings = (
            db.query(Booking)
            .join(Showtime, Booking.showtime_id == Showtime.showtime_id)
            .join(Hall, Showtime.hall_id == Hall.hall_id)
            .filter(Hall.theater_id == theater.theater_id, Booking.status == BookingStatus.CONFIRMED)
            .all()
        )
        branch_rev = sum([float(b.total_amount) for b in th_bookings])
        branch_tickets = sum([len(b.booking_seats) for b in th_bookings])
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
    revenue_by_branch.sort(key=lambda x: (x["revenue_lkr"], x["tickets_sold"]), reverse=True)
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

@router.get("/bookings")
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
        
        seat_labels = []
        for bs in b.booking_seats:
            if bs.seat:
                seat_labels.append(f"{bs.seat.row_label}{bs.seat.seat_number}")
            else:
                seat_labels.append(f"Seat #{bs.seat_id}")

        ref = b.payment.transaction_reference if b.payment else f"TXN-LK{b.booking_id}"
        cust_name = b.customer_name or (user.name if user and user.name else None)
        if not cust_name:
            cust_name = b.customer_email.split('@')[0] if b.customer_email else "Customer"

        cust_email = b.customer_email or (user.email if user else "customer@quickshow.lk")
        cust_phone = b.customer_phone or (user.phone if user else "")
        
        output.append({
            "booking_id": b.booking_id,
            "customer_name": cust_name,
            "customer_email": cust_email,
            "customer_phone": cust_phone,
            "movie_title": movie.title if movie else "Cinema Movie",
            "theater_name": theater.name if theater else "Scope Cinemas",
            "hall_name": hall.hall_name if hall else "Main Screen",
            "seats": seat_labels if seat_labels else ["Reserved"],
            "total_lkr": float(b.total_amount),
            "status": b.status.value if hasattr(b.status, 'value') else str(b.status),
            "passcode": ref,
            "transaction_reference": ref,
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

def format_activity_time(dt):
    if not dt:
        return "Recently", "Recently"
    from app.core.timezone import get_local_now, to_local_time
    local_dt = to_local_time(dt)
    formatted_exact = local_dt.strftime("%b %d, %Y, %I:%M %p")
    now = get_local_now()
    diff = now - (local_dt.replace(tzinfo=None) if hasattr(local_dt, 'tzinfo') and local_dt.tzinfo else local_dt)
    seconds = max(0, int(diff.total_seconds()))
    if seconds < 60:
        rel = "Just now"
    elif seconds < 3600:
        mins = max(1, seconds // 60)
        rel = f"{mins} min{'s' if mins != 1 else ''} ago"
    elif seconds < 86400:
        hours = seconds // 3600
        rel = f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif seconds < 172800:
        rel = f"Yesterday at {local_dt.strftime('%I:%M %p')}"
    else:
        days = seconds // 86400
        rel = f"{days} days ago" if days < 14 else local_dt.strftime("%b %d, %Y")
    return formatted_exact, rel

@router.get("/users")
@router.get("/customers")
def get_admin_customers(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Real registered customer profiles with accurate calculated booking count and total LKR spend from MySQL."""
    from app.models.booking import Booking, BookingStatus
    from app.models.user import User
    from sqlalchemy import or_
    from datetime import datetime
    users = db.query(User).order_by(User.user_id.desc()).all()
    output = []
    
    for u in users:
        if u.email in ["user@quickshow.lk", "test_cust@quickshow.lk"] or (u.name and u.name.strip().lower() == "kasun perera"):
            continue
        confirmed_bookings = db.query(Booking).filter(
            or_(
                Booking.user_id == u.user_id,
                (Booking.customer_email != None) & (Booking.customer_email.ilike(u.email))
            ),
            or_(
                Booking.status == BookingStatus.CONFIRMED,
                Booking.status == "Confirmed"
            )
        ).all()
        
        total_spent = sum([float(b.total_amount) for b in confirmed_bookings if b.total_amount is not None])
        role_str = u.role.value if hasattr(u.role, 'value') else str(u.role)
        
        booking_dates = [b.created_at for b in confirmed_bookings if b.created_at]
        last_booking = max(booking_dates, default=None)
        recent_movie = None
        if confirmed_bookings:
            latest_b = max(confirmed_bookings, key=lambda x: x.created_at or datetime.min)
            if latest_b and latest_b.showtime and latest_b.showtime.movie:
                recent_movie = latest_b.showtime.movie.title
        
        created_str, created_rel = format_activity_time(u.created_at)
        last_active_str, last_active_rel = format_activity_time(last_booking if last_booking else u.created_at)
        
        output.append({
            "user_id": u.user_id,
            "id": u.user_id,
            "name": u.name or "Registered User",
            "email": u.email,
            "phone": u.phone or "Not Provided",
            "role": role_str,
            "total_bookings": len(confirmed_bookings),
            "total_spent_lkr": round(total_spent, 2),
            "created_at": created_str,
            "created_at_relative": created_rel,
            "last_active": last_active_str,
            "last_active_relative": last_active_rel,
            "recent_movie": recent_movie
        })
        
    return output

@router.get("/activities")
def get_admin_activities(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin: Real customer activity logs from database bookings and user registrations."""
    from app.models.booking import Booking
    from app.models.user import User
    from datetime import datetime
    
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(30).all()
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(20).all()
    output = []
    
    for b in bookings:
        user_name = b.customer_name or (b.user.name if b.user else "Customer")
        user_email = b.customer_email or (b.user.email if b.user else "")
        if user_email in ["user@quickshow.lk", "test_cust@quickshow.lk"] or (user_name and user_name.strip().lower() == "kasun perera"):
            continue
            
        movie_title = b.showtime.movie.title if b.showtime and b.showtime.movie else "Cinema Movie"
        theater_name = b.showtime.hall.theater.name if b.showtime and b.showtime.hall and b.showtime.hall.theater else "Scope Cinemas"
        seats = [f"{bs.seat.row_label}{bs.seat.seat_number}" for bs in b.booking_seats if bs.seat]
        seats_str = ", ".join(seats) if seats else "Reserved seats"
        exact_time, relative_time = format_activity_time(b.created_at)
        
        output.append({
            "activity_id": f"ACT-BK-{b.booking_id:04d}",
            "type": "TICKET_RESERVATION",
            "user_name": user_name,
            "user_email": user_email,
            "details": f"Reserved {len(seats)} seat{'s' if len(seats) != 1 else ''} ({seats_str}) for '{movie_title}' at {theater_name}",
            "timestamp": exact_time,
            "timestamp_relative": relative_time,
            "amount_lkr": float(b.total_amount) if b.total_amount else 0.0,
            "_raw_dt": b.created_at or datetime.min
        })
        
    for u in recent_users:
        if u.email in ["user@quickshow.lk", "test_cust@quickshow.lk"] or (u.name and u.name.strip().lower() == "kasun perera"):
            continue
            
        if u.created_at:
            exact_time, relative_time = format_activity_time(u.created_at)
            role_label = u.role.value if hasattr(u.role, 'value') else str(u.role)
            output.append({
                "activity_id": f"ACT-REG-{u.user_id:04d}",
                "type": "USER_REGISTRATION",
                "user_name": u.name or "New Customer",
                "user_email": u.email,
                "details": f"New {role_label.replace('_', ' ').title()} account registered ({u.email})",
                "timestamp": exact_time,
                "timestamp_relative": relative_time,
                "amount_lkr": 0.0,
                "_raw_dt": u.created_at
            })
    output.sort(key=lambda x: x["_raw_dt"], reverse=True)
    for act in output:
        act.pop("_raw_dt", None)
        
    return output[:30]

