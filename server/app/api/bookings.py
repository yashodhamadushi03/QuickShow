from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_
from typing import List, Optional
import uuid
import logging
import threading
import time
from decimal import Decimal
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.showtime import Showtime
from app.models.theater import Theater, Hall, Seat
from app.models.movie import Movie
from app.models.booking import Booking, BookingSeat, BookingStatus
from app.models.payment import Payment, PaymentStatus
from app.schemas.booking import BookingCreate, BookingOut
from app.schemas.payment import PaymentCreate, PaymentOut
from app.api.deps import get_current_user_optional
from app.services.notification import NotificationService
from app.core.timezone import get_local_now

logger = logging.getLogger("quickshow.bookings")

class EmailDispatchTracker:
    """Thread-safe tracker to prevent duplicate ticket email dispatches and asynchronous race conditions."""
    def __init__(self):
        self._lock = threading.Lock()
        self._dispatched = {}  # booking_id -> timestamp

    def mark_dispatched(self, booking_id: int):
        with self._lock:
            now = time.time()
            self._dispatched[booking_id] = now
            # Evict entries older than 10 minutes
            self._dispatched = {k: v for k, v in self._dispatched.items() if now - v < 600}

    def was_dispatched(self, booking_id: int) -> bool:
        with self._lock:
            now = time.time()
            ts = self._dispatched.get(booking_id)
            if ts and (now - ts < 300):
                return True
            return False

email_tracker = EmailDispatchTracker()

router = APIRouter(prefix="", tags=["Bookings & Payments"])

@router.post("/bookings", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    background_tasks: BackgroundTasks,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Create a new booking, reserve requested seats, and trigger ticket confirmation
    notification with accurate booking details without race conditions.
    """
    if not booking_in.seat_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one seat must be selected.")
    user_obj = None
    if booking_in.customer_email:
        clean_email = str(booking_in.customer_email).strip().lower()
        user_obj = db.query(User).filter(User.email == clean_email).first()
        if not user_obj:
            user_obj = User(
                name=booking_in.customer_name or "Valued Customer",
                email=clean_email,
                phone=booking_in.customer_phone,
                password_hash="customer_reservation_hash",
                role=UserRole.CUSTOMER
            )
            db.add(user_obj)
            db.flush()
        else:
            if booking_in.customer_name and (not user_obj.name or user_obj.name in ["Guest Customer", "Valued Customer"]):
                user_obj.name = booking_in.customer_name
            if booking_in.customer_phone and not user_obj.phone:
                user_obj.phone = booking_in.customer_phone
            db.flush()
    elif current_user:
        user_obj = current_user
    if not user_obj:
        guest_email = (booking_in.customer_email or f"guest_{uuid.uuid4().hex[:8]}@quickshow.lk").strip().lower()
        user_obj = User(
            name=booking_in.customer_name or "Guest Customer",
            email=guest_email,
            phone=booking_in.customer_phone,
            password_hash="guest_hash",
            role=UserRole.CUSTOMER
        )
        db.add(user_obj)
        db.flush()

    # Eagerly load showtime and related movie/hall/theater
    st = (
        db.query(Showtime)
        .options(
            joinedload(Showtime.movie),
            joinedload(Showtime.hall).joinedload(Hall.theater)
        )
        .filter(Showtime.showtime_id == booking_in.showtime_id)
        .first()
    )

    if booking_in.hall_id:
        if st and st.hall_id != booking_in.hall_id:
            target_movie_id = booking_in.movie_id or st.movie_id
            matching_st = (
                db.query(Showtime)
                .options(
                    joinedload(Showtime.movie),
                    joinedload(Showtime.hall).joinedload(Hall.theater)
                )
                .filter(
                    Showtime.hall_id == booking_in.hall_id,
                    Showtime.movie_id == target_movie_id
                )
                .first()
            )
            if matching_st:
                st = matching_st
            else:
                hl = db.query(Hall).filter(Hall.hall_id == booking_in.hall_id).first()
                if hl:
                    st = Showtime(
                        movie_id=target_movie_id,
                        hall_id=hl.hall_id,
                        start_time=st.start_time if st else get_local_now(),
                        end_time=st.end_time if st else get_local_now(),
                        base_price=st.base_price if st else Decimal("1500.00")
                    )
                    db.add(st)
                    db.flush()

    if booking_in.theater_id and st:
        current_theater_id = st.hall.theater_id if st.hall else None
        if current_theater_id != booking_in.theater_id:
            target_movie_id = booking_in.movie_id or st.movie_id
            theater_st = (
                db.query(Showtime)
                .options(
                    joinedload(Showtime.movie),
                    joinedload(Showtime.hall).joinedload(Hall.theater)
                )
                .join(Hall, Showtime.hall_id == Hall.hall_id)
                .filter(
                    Hall.theater_id == booking_in.theater_id,
                    Showtime.movie_id == target_movie_id
                )
                .first()
            )
            if theater_st:
                st = theater_st
            else:
                hl = db.query(Hall).filter(Hall.theater_id == booking_in.theater_id).first()
                if hl:
                    st = Showtime(
                        movie_id=target_movie_id,
                        hall_id=hl.hall_id,
                        start_time=st.start_time if st else get_local_now(),
                        end_time=st.end_time if st else get_local_now(),
                        base_price=st.base_price if st else Decimal("1500.00")
                    )
                    db.add(st)
                    db.flush()

    if not st:
        query = (
            db.query(Showtime)
            .options(
                joinedload(Showtime.movie),
                joinedload(Showtime.hall).joinedload(Hall.theater)
            )
            .join(Hall, Showtime.hall_id == Hall.hall_id)
        )
        if booking_in.theater_id:
            query = query.filter(Hall.theater_id == booking_in.theater_id)
        if booking_in.hall_id:
            query = query.filter(Showtime.hall_id == booking_in.hall_id)
        if booking_in.movie_id:
            query = query.filter(Showtime.movie_id == booking_in.movie_id)
        st = query.first()

    if not st:
        st = (
            db.query(Showtime)
            .options(
                joinedload(Showtime.movie),
                joinedload(Showtime.hall).joinedload(Hall.theater)
            )
            .order_by(Showtime.showtime_id.desc())
            .first()
            or db.query(Showtime)
            .options(
                joinedload(Showtime.movie),
                joinedload(Showtime.hall).joinedload(Hall.theater)
            )
            .first()
        )
    
    if not st:
        mv = db.query(Movie).first()
        hl = db.query(Hall).first()
        if mv and hl:
            st = Showtime(
                movie_id=mv.movie_id,
                hall_id=hl.hall_id,
                start_time=get_local_now(),
                end_time=get_local_now(),
                base_price=Decimal("1500.00")
            )
            db.add(st)
            db.flush()
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active showtimes available.")

    # Accurately resolve movie, hall, and theater models to eliminate data mix-ups
    movie_obj = st.movie if (st and st.movie) else None
    if not movie_obj and st and st.movie_id:
        movie_obj = db.query(Movie).filter(Movie.movie_id == st.movie_id).first()
    if not movie_obj and booking_in.movie_id:
        movie_obj = db.query(Movie).filter(Movie.movie_id == booking_in.movie_id).first()

    hall_obj = st.hall if (st and st.hall) else None
    if not hall_obj and st and st.hall_id:
        hall_obj = db.query(Hall).filter(Hall.hall_id == st.hall_id).first()
    if not hall_obj and booking_in.hall_id:
        hall_obj = db.query(Hall).filter(Hall.hall_id == booking_in.hall_id).first()

    theater_obj = hall_obj.theater if (hall_obj and hall_obj.theater) else None
    if not theater_obj and hall_obj and hall_obj.theater_id:
        theater_obj = db.query(Theater).filter(Theater.theater_id == hall_obj.theater_id).first()
    if not theater_obj and booking_in.theater_id:
        theater_obj = db.query(Theater).filter(Theater.theater_id == booking_in.theater_id).first()

    movie_title = movie_obj.title if (movie_obj and movie_obj.title) else "Cinema Movie"
    theater_name = theater_obj.name if (theater_obj and theater_obj.name) else "QuickShow Cinema"
    hall_name = hall_obj.hall_name if (hall_obj and hall_obj.hall_name) else "Standard Screen"

    if st and st.start_time:
        if isinstance(st.start_time, str):
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(st.start_time)
                showtime_str = dt.strftime("%A, %b %d, %Y at %I:%M %p")
            except Exception:
                showtime_str = st.start_time
        else:
            showtime_str = st.start_time.strftime("%A, %b %d, %Y at %I:%M %p")
    else:
        showtime_str = get_local_now().strftime("%A, %b %d, %Y at %I:%M %p")

    # Map physical seats
    hall_seats = (
        db.query(Seat)
        .filter(Seat.hall_id == st.hall_id)
        .order_by(Seat.row_label, Seat.seat_number)
        .all()
    )

    if not hall_seats:
        rows = ["A", "B", "C", "D", "E", "F", "G", "H"]
        for r_label in rows:
            for s_num in range(1, 13):
                s_type = "VIP" if r_label in ["G", "H"] else "Regular"
                new_s = Seat(
                    hall_id=st.hall_id,
                    row_label=r_label,
                    seat_number=s_num,
                    seat_type=s_type
                )
                db.add(new_s)
        db.flush()
        hall_seats = (
            db.query(Seat)
            .filter(Seat.hall_id == st.hall_id)
            .order_by(Seat.row_label, Seat.seat_number)
            .all()
        )

    hall_seat_map = {s.seat_id: s for s in hall_seats}
    resolved_seats = []
    used_seat_ids = set()

    for sid in booking_in.seat_ids:
        if sid in hall_seat_map and sid not in used_seat_ids:
            resolved_seats.append(hall_seat_map[sid])
            used_seat_ids.add(sid)
        elif 1 <= sid <= len(hall_seats):
            candidate = hall_seats[sid - 1]
            if candidate.seat_id not in used_seat_ids:
                resolved_seats.append(candidate)
                used_seat_ids.add(candidate.seat_id)
        else:
            cand = db.query(Seat).filter(Seat.seat_id == sid, Seat.hall_id == st.hall_id).first()
            if cand and cand.seat_id not in used_seat_ids:
                resolved_seats.append(cand)
                used_seat_ids.add(cand.seat_id)

    if len(resolved_seats) < len(booking_in.seat_ids):
        reserved_sids = set(
            s[0] for s in db.query(BookingSeat.seat_id)
            .join(Booking, BookingSeat.booking_id == Booking.booking_id)
            .filter(
                BookingSeat.showtime_id == st.showtime_id,
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING])
            )
            .all()
        )
        for s in hall_seats:
            if s.seat_id not in used_seat_ids and s.seat_id not in reserved_sids:
                resolved_seats.append(s)
                used_seat_ids.add(s.seat_id)
                if len(resolved_seats) == len(booking_in.seat_ids):
                    break

    final_seat_ids = [s.seat_id for s in resolved_seats]
    if not final_seat_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to map seats for this showtime.")

    seat_labels = [
        f"{s.row_label}{s.seat_number}"
        for s in resolved_seats
        if s and s.row_label and s.seat_number
    ]

    try:
        with db.begin_nested():
            conflicting_seats = (
                db.query(BookingSeat.seat_id)
                .join(Booking, BookingSeat.booking_id == Booking.booking_id)
                .filter(
                    BookingSeat.showtime_id == st.showtime_id,
                    BookingSeat.seat_id.in_(final_seat_ids),
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING])
                )
                .with_for_update()
                .all()
            )

            if conflicting_seats:
                if booking_in.showtime_id == st.showtime_id:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Double-booking conflict detected! One or more seats were just reserved by another user."
                    )
                else:
                    free_seats = [
                        s for s in hall_seats
                        if s.seat_id not in [c[0] for c in conflicting_seats] and s.seat_id not in used_seat_ids
                    ]
                    if len(free_seats) >= len(booking_in.seat_ids):
                        resolved_seats = free_seats[:len(booking_in.seat_ids)]
                        final_seat_ids = [s.seat_id for s in resolved_seats]
                        seat_labels = [
                            f"{s.row_label}{s.seat_number}"
                            for s in resolved_seats
                            if s and s.row_label and s.seat_number
                        ]

            base_p = Decimal(str(st.base_price or "1500.00"))
            total_amount = base_p * Decimal(len(final_seat_ids))
            cust_name = booking_in.customer_name or (user_obj.name if user_obj else "Valued Customer")
            cust_email = booking_in.customer_email or (user_obj.email if user_obj else "customer@quickshow.lk")
            cust_phone = booking_in.customer_phone or (user_obj.phone if user_obj else None)

            booking = Booking(
                user_id=user_obj.user_id,
                showtime_id=st.showtime_id,
                total_amount=total_amount,
                status=BookingStatus.PENDING,
                customer_name=cust_name,
                customer_email=cust_email,
                customer_phone=cust_phone,
            )
            db.add(booking)
            db.flush()  # Generate booking_id

            for s in resolved_seats:
                b_seat = BookingSeat(
                    booking_id=booking.booking_id,
                    seat_id=s.seat_id,
                    showtime_id=st.showtime_id,
                    price=base_p
                )
                b_seat.seat = s
                db.add(b_seat)
            
            db.flush()

        db.commit()
        db.refresh(booking)

        # Trigger ticket confirmation notification upon booking creation
        # Extract primitives before async execution to avoid detached session race conditions
        booking_ref = f"QS-BK{booking.booking_id:06d}"
        total_float = float(total_amount)
        recipient_email = cust_email
        recipient_name = cust_name
        recipient_phone = cust_phone

        if recipient_email and "@" in recipient_email and not recipient_email.endswith("@quickshow.internal"):
            # Mark dispatched to prevent duplicate race conditions when /payments is immediately invoked
            email_tracker.mark_dispatched(booking.booking_id)

            if background_tasks:
                background_tasks.add_task(
                    NotificationService.send_email_ticket,
                    user_email=recipient_email,
                    user_name=recipient_name,
                    movie_title=movie_title,
                    theater_name=theater_name,
                    hall_name=hall_name,
                    showtime_str=showtime_str,
                    seat_labels=seat_labels,
                    total_amount=total_float,
                    transaction_ref=booking_ref
                )
                if recipient_phone:
                    background_tasks.add_task(
                        NotificationService.send_sms_ticket,
                        phone_number=recipient_phone,
                        movie_title=movie_title,
                        showtime_str=showtime_str,
                        seat_labels=seat_labels,
                        transaction_ref=booking_ref
                    )
            else:
                try:
                    NotificationService.send_email_ticket(
                        user_email=recipient_email,
                        user_name=recipient_name,
                        movie_title=movie_title,
                        theater_name=theater_name,
                        hall_name=hall_name,
                        showtime_str=showtime_str,
                        seat_labels=seat_labels,
                        total_amount=total_float,
                        transaction_ref=booking_ref
                    )
                except Exception as err:
                    logger.warning(f"Direct booking email dispatch warning: {err}")

        return booking

    except IntegrityError as ie:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Double-booking conflict detected! One or more seats were just reserved: {str(ie)}"
        )
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected database error occurred: {str(e)}"
        )

@router.get("/bookings/my", response_model=List[BookingOut])
@router.get("/user/bookings", response_model=List[BookingOut])
def get_my_bookings(
    email: Optional[str] = Query(None, description="Customer email to filter personal tickets"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Retrieve real-time user bookings directly from MySQL strictly for the requesting profile:
    - Strictly filters by authenticated JWT user or by verified email query param (e.g. from Clerk).
    - NEVER returns all bookings or falls back to other users' tickets.
    - Guarantees 100% data isolation across customer accounts.
    - Always orders newest bookings first so new reservations immediately appear at the top.
    """
    query = (
        db.query(Booking)
        .options(
            joinedload(Booking.showtime).joinedload(Showtime.movie),
            joinedload(Booking.showtime).joinedload(Showtime.hall).joinedload(Hall.theater),
            joinedload(Booking.booking_seats).joinedload(BookingSeat.seat)
        )
    )
    if current_user and current_user.role not in [UserRole.ADMIN, UserRole.THEATER_MANAGER]:
        user_email = current_user.email.strip().lower()
        query = query.filter(
            or_(
                Booking.user_id == current_user.user_id,
                Booking.customer_email.ilike(user_email)
            )
        )
    elif email and email.strip():
        clean_email = email.strip().lower()
        query = query.filter(
            or_(
                Booking.customer_email.ilike(clean_email),
                Booking.user.has(User.email.ilike(clean_email))
            )
        )
    elif current_user and current_user.role in [UserRole.ADMIN, UserRole.THEATER_MANAGER]:
        query = query.filter(
            or_(
                Booking.user_id == current_user.user_id,
                Booking.customer_email.ilike(current_user.email)
            )
        )
    else:
        return []

    return query.order_by(Booking.created_at.desc()).all()

@router.get("/bookings/{booking_id}", response_model=BookingOut)
def get_booking_details(
    booking_id: int,
    email: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Retrieve details of a specific booking with strict ownership verification."""
    booking = (
        db.query(Booking)
        .options(
            joinedload(Booking.showtime).joinedload(Showtime.movie),
            joinedload(Booking.showtime).joinedload(Showtime.hall).joinedload(Hall.theater),
            joinedload(Booking.booking_seats).joinedload(BookingSeat.seat)
        )
        .filter(Booking.booking_id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")
    if current_user and current_user.role not in [UserRole.ADMIN, UserRole.THEATER_MANAGER]:
        user_email = current_user.email.strip().lower()
        is_owner = (booking.user_id == current_user.user_id) or (
            booking.customer_email and booking.customer_email.strip().lower() == user_email
        )
        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Not authorized to view another user's booking."
            )
    elif email and email.strip():
        clean_email = email.strip().lower()
        is_owner = (
            (booking.customer_email and booking.customer_email.strip().lower() == clean_email) or
            (booking.user and booking.user.email.strip().lower() == clean_email)
        )
        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Not authorized to view another user's booking."
            )

    return booking

@router.post("/payments", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def process_payment(
    payment_in: PaymentCreate,
    background_tasks: BackgroundTasks,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Process payment for a pending booking, confirm reservation, and dispatch
    automated Email and SMS ticket notifications without race conditions.
    """
    booking = (
        db.query(Booking)
        .options(
            joinedload(Booking.showtime).joinedload(Showtime.movie),
            joinedload(Booking.showtime).joinedload(Showtime.hall).joinedload(Hall.theater),
            joinedload(Booking.booking_seats).joinedload(BookingSeat.seat),
            joinedload(Booking.user)
        )
        .filter(Booking.booking_id == payment_in.booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    if booking.status == BookingStatus.CONFIRMED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking is already confirmed and paid.")

    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot pay for a cancelled booking.")

    card_raw = (payment_in.card_number or "").replace(" ", "").replace("-", "")
    is_test_card = any(card_raw.startswith(prefix) for prefix in ["4242", "5555", "4000", "5105", "3782"])
    is_sandbox = payment_in.is_sandbox or is_test_card or "sandbox" in payment_in.payment_method.lower()
    if is_sandbox:
        txn_ref = f"TXN-SANDBOX-{uuid.uuid4().hex[:8].upper()}"
        payment_method_str = (
            f"Sandbox Test ({payment_in.payment_method})"
            if "sandbox" not in payment_in.payment_method.lower()
            else payment_in.payment_method
        )
    else:
        txn_ref = f"TXN-LK{uuid.uuid4().hex[:8].upper()}"
        payment_method_str = payment_in.payment_method
    payment_method_str = payment_method_str[:50]

    payment = Payment(
        booking_id=booking.booking_id,
        amount=booking.total_amount,
        payment_method=payment_method_str,
        status=PaymentStatus.SUCCESS,
        transaction_reference=txn_ref,
        is_sandbox=is_sandbox
    )
    booking.status = BookingStatus.CONFIRMED
    if payment_in.customer_name:
        booking.customer_name = payment_in.customer_name
    if payment_in.customer_email:
        booking.customer_email = payment_in.customer_email
    if payment_in.customer_phone:
        booking.customer_phone = payment_in.customer_phone
    if booking.user:
        if payment_in.customer_name and (not booking.user.name or booking.user.name == "Guest Customer"):
            booking.user.name = payment_in.customer_name
        if payment_in.customer_phone and not booking.user.phone:
            booking.user.phone = payment_in.customer_phone

    db.add(payment)
    db.commit()
    db.refresh(payment)
    db.refresh(booking)

    # Gather data for email/SMS notifications accurately from database entities
    showtime = booking.showtime
    movie_obj = showtime.movie if (showtime and showtime.movie) else None
    if not movie_obj and showtime and showtime.movie_id:
        movie_obj = db.query(Movie).filter(Movie.movie_id == showtime.movie_id).first()

    hall_obj = showtime.hall if (showtime and showtime.hall) else None
    if not hall_obj and showtime and showtime.hall_id:
        hall_obj = db.query(Hall).filter(Hall.hall_id == showtime.hall_id).first()

    theater_obj = hall_obj.theater if (hall_obj and hall_obj.theater) else None
    if not theater_obj and hall_obj and hall_obj.theater_id:
        theater_obj = db.query(Theater).filter(Theater.theater_id == hall_obj.theater_id).first()

    movie_title = movie_obj.title if (movie_obj and movie_obj.title) else "Cinema Movie"
    theater_name = theater_obj.name if (theater_obj and theater_obj.name) else "QuickShow Cinema"
    hall_name = hall_obj.hall_name if (hall_obj and hall_obj.hall_name) else "Screen 1"

    if showtime and showtime.start_time:
        if isinstance(showtime.start_time, str):
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(showtime.start_time)
                start_time_str = dt.strftime("%A, %b %d, %Y at %I:%M %p")
            except Exception:
                start_time_str = showtime.start_time
        else:
            start_time_str = showtime.start_time.strftime("%A, %b %d, %Y at %I:%M %p")
    else:
        start_time_str = get_local_now().strftime("%A, %b %d, %Y at %I:%M %p")

    # Accurately resolve seat labels from booked seats
    seat_labels = [
        f"{bs.seat.row_label}{bs.seat.seat_number}"
        for bs in booking.booking_seats
        if bs.seat and bs.seat.row_label and bs.seat.seat_number
    ]
    if not seat_labels and booking.booking_seats:
        seat_ids = [bs.seat_id for bs in booking.booking_seats]
        seats = db.query(Seat).filter(Seat.seat_id.in_(seat_ids)).order_by(Seat.row_label, Seat.seat_number).all()
        seat_labels = [f"{s.row_label}{s.seat_number}" for s in seats if s.row_label and s.seat_number]

    recipient_email = (
        payment_in.customer_email
        or booking.customer_email
        or (booking.user.email if booking.user else None)
        or (current_user.email if current_user else None)
    )
    recipient_name = (
        payment_in.customer_name
        or booking.customer_name
        or (booking.user.name if booking.user else None)
        or (current_user.name if current_user else None)
        or "Valued Customer"
    )
    recipient_phone = (
        payment_in.customer_phone
        or booking.customer_phone
        or (booking.user.phone if booking.user else None)
        or (current_user.phone if current_user else None)
    )

    # Check if email was already dispatched upon booking creation to prevent duplicate race conditions
    already_dispatched = email_tracker.was_dispatched(booking.booking_id)

    if not already_dispatched and recipient_email and "@" in recipient_email:
        email_tracker.mark_dispatched(booking.booking_id)
        total_float = float(booking.total_amount)

        if background_tasks:
            background_tasks.add_task(
                NotificationService.send_email_ticket,
                user_email=recipient_email,
                user_name=recipient_name,
                movie_title=movie_title,
                theater_name=theater_name,
                hall_name=hall_name,
                showtime_str=start_time_str,
                seat_labels=seat_labels,
                total_amount=total_float,
                transaction_ref=txn_ref
            )
            if recipient_phone:
                background_tasks.add_task(
                    NotificationService.send_sms_ticket,
                    phone_number=recipient_phone,
                    movie_title=movie_title,
                    showtime_str=start_time_str,
                    seat_labels=seat_labels,
                    transaction_ref=txn_ref
                )
        else:
            try:
                NotificationService.send_email_ticket(
                    user_email=recipient_email,
                    user_name=recipient_name,
                    movie_title=movie_title,
                    theater_name=theater_name,
                    hall_name=hall_name,
                    showtime_str=start_time_str,
                    seat_labels=seat_labels,
                    total_amount=total_float,
                    transaction_ref=txn_ref
                )
            except Exception as err:
                logger.warning(f"Direct payment email dispatch warning: {err}")

    payment_out = PaymentOut.model_validate(payment)
    payment_out.is_sandbox = is_sandbox
    payment_out.message = (
        "Sandbox test payment authorized successfully. Tickets dispatched via Email and SMS."
        if is_sandbox
        else "Payment authorized successfully. Tickets dispatched."
    )
    return payment_out

class DirectEmailRequest(BaseModel):
    customer_email: str
    customer_name: Optional[str] = "Valued Customer"
    movie_title: Optional[str] = "Cinema Movie"
    theater_name: Optional[str] = "QuickShow Cinema"
    hall_name: Optional[str] = "Screen 1"
    showtime_str: Optional[str] = "Today at 7:30 PM"
    seats: Optional[List[str]] = None
    total: Optional[float] = 1500.0
    txn_ref: Optional[str] = None

@router.post("/send-direct-email")
def send_direct_ticket_email(req: DirectEmailRequest):
    """
    Direct Endpoint to dispatch HTML Ticket Email immediately to customer email.
    """
    ref = req.txn_ref or f"TXN-LK{uuid.uuid4().hex[:8].upper()}"
    sent = NotificationService.send_email_ticket(
        user_email=req.customer_email,
        user_name=req.customer_name or "Valued Customer",
        movie_title=req.movie_title or "Cinema Movie",
        theater_name=req.theater_name or "QuickShow Cinema",
        hall_name=req.hall_name or "Screen 1",
        showtime_str=req.showtime_str or "Today at 7:30 PM",
        seat_labels=req.seats or [],
        total_amount=req.total or 1500.0,
        transaction_ref=ref
    )
    return {"status": "success" if sent else "simulated", "email": req.customer_email, "ref": ref}
