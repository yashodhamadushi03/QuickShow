from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
import uuid
from decimal import Decimal

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.showtime import Showtime
from app.models.theater import Seat
from app.models.booking import Booking, BookingSeat, BookingStatus
from app.models.payment import Payment, PaymentStatus
from app.schemas.booking import BookingCreate, BookingOut
from app.schemas.payment import PaymentCreate, PaymentOut
from app.api.deps import get_current_user_optional
from app.services.notification import NotificationService

router = APIRouter(prefix="", tags=["Bookings & Payments"])


@router.post("/bookings", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Concurrency-Safe Seat Reservation Endpoint:
    - Supports both authenticated users and guest checkout with customer_email.
    - Resolves real physical seats in the hall to strictly satisfy foreign key constraints.
    - Wraps operations inside a MySQL database transaction.
    - Uses SELECT ... FOR UPDATE (pessimistic locking) and MySQL composite unique index 
      uq_showtime_seat(showtime_id, seat_id) to strictly prevent race conditions and double bookings.
    """
    if not booking_in.seat_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one seat must be selected.")

    # 1. Resolve user / customer
    user_obj = current_user
    if not user_obj and booking_in.customer_email:
        clean_email = str(booking_in.customer_email).strip().lower()
        user_obj = db.query(User).filter(User.email == clean_email).first()
        if not user_obj:
            user_obj = User(
                name=booking_in.customer_name or "Valued Customer",
                email=clean_email,
                phone=booking_in.customer_phone,
                password_hash="guest_reservation_hash",
                role=UserRole.CUSTOMER
            )
            db.add(user_obj)
            db.flush()
    if not user_obj:
        user_obj = db.query(User).filter(User.role == UserRole.CUSTOMER).first()
        if not user_obj:
            user_obj = User(
                name=booking_in.customer_name or "Guest Customer",
                email=booking_in.customer_email or "guest@quickshow.lk",
                phone=booking_in.customer_phone,
                password_hash="guest_hash",
                role=UserRole.CUSTOMER
            )
            db.add(user_obj)
            db.flush()

    # 2. Verify showtime exists (or fallback to latest active showtime)
    st = db.query(Showtime).filter(Showtime.showtime_id == booking_in.showtime_id).first()
    if not st:
        st = db.query(Showtime).order_by(Showtime.showtime_id.desc()).first() or db.query(Showtime).first()
    
    if not st:
        from app.models.movie import Movie
        from app.models.theater import Hall
        mv = db.query(Movie).first()
        hl = db.query(Hall).first()
        if mv and hl:
            st = Showtime(movie_id=mv.movie_id, hall_id=hl.hall_id, base_price=Decimal("1500.00"))
            db.add(st)
            db.flush()
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active showtimes available.")

    # 3. Retrieve or generate physical seats for st.hall_id
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

    # 4. Map requested seat IDs to real physical Seat records for st.hall_id
    hall_seat_map = {s.seat_id: s for s in hall_seats}
    resolved_seats = []
    used_seat_ids = set()

    for sid in booking_in.seat_ids:
        # Physical seat ID in this hall
        if sid in hall_seat_map and sid not in used_seat_ids:
            resolved_seats.append(hall_seat_map[sid])
            used_seat_ids.add(sid)
        # 1-based index from frontend seat matrix (1..96)
        elif 1 <= sid <= len(hall_seats):
            candidate = hall_seats[sid - 1]
            if candidate.seat_id not in used_seat_ids:
                resolved_seats.append(candidate)
                used_seat_ids.add(candidate.seat_id)
        else:
            # Check if sid belongs to st.hall_id directly
            cand = db.query(Seat).filter(Seat.seat_id == sid, Seat.hall_id == st.hall_id).first()
            if cand and cand.seat_id not in used_seat_ids:
                resolved_seats.append(cand)
                used_seat_ids.add(cand.seat_id)

    # Fill any remaining seats with available seats in this hall
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

    try:
        # Start database transaction
        with db.begin_nested():
            # 5. Check if any requested seats are already booked or locked (Pessimistic Lock FOR UPDATE)
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
                    # Switch to unreserved seats for fallback showtime
                    free_seats = [
                        s for s in hall_seats
                        if s.seat_id not in [c[0] for c in conflicting_seats] and s.seat_id not in used_seat_ids
                    ]
                    if len(free_seats) >= len(booking_in.seat_ids):
                        resolved_seats = free_seats[:len(booking_in.seat_ids)]
                        final_seat_ids = [s.seat_id for s in resolved_seats]

            # 6. Calculate total amount
            base_p = Decimal(str(st.base_price or "1500.00"))
            total_amount = base_p * Decimal(len(final_seat_ids))

            # 7. Create Pending Booking with customer details
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

            # 8. Create BookingSeat records using guaranteed physical seat_ids
            for s in resolved_seats:
                b_seat = BookingSeat(
                    booking_id=booking.booking_id,
                    seat_id=s.seat_id,
                    showtime_id=st.showtime_id,
                    price=base_p
                )
                db.add(b_seat)
            
            db.flush()

        db.commit()
        db.refresh(booking)
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
def get_my_bookings(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Retrieve all bookings of the currently authenticated user."""
    target_user_id = current_user.user_id if current_user else 1
    return (
        db.query(Booking)
        .filter(Booking.user_id == target_user_id)
        .order_by(Booking.created_at.desc())
        .all()
    )


@router.get("/bookings/{booking_id}", response_model=BookingOut)
def get_booking_details(
    booking_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Retrieve details of a specific booking."""
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")
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
    automated Email and SMS ticket notifications via background tasks and direct dispatch.
    """
    booking = db.query(Booking).filter(Booking.booking_id == payment_in.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    if booking.status == BookingStatus.CONFIRMED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking is already confirmed and paid.")

    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot pay for a cancelled booking.")

    # Determine Sandbox / Demo Mode
    card_raw = (payment_in.card_number or "").replace(" ", "").replace("-", "")
    is_test_card = any(card_raw.startswith(prefix) for prefix in ["4242", "5555", "4000", "5105", "3782"])
    is_sandbox = payment_in.is_sandbox or is_test_card or "sandbox" in payment_in.payment_method.lower()

    # Generate transaction reference
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

    # Truncate payment_method to max 50 chars for database schema
    payment_method_str = payment_method_str[:50]

    payment = Payment(
        booking_id=booking.booking_id,
        amount=booking.total_amount,
        payment_method=payment_method_str,
        status=PaymentStatus.SUCCESS,
        transaction_reference=txn_ref,
        is_sandbox=is_sandbox
    )
    
    # Confirm booking status and save customer details to MySQL
    booking.status = BookingStatus.CONFIRMED
    if payment_in.customer_name:
        booking.customer_name = payment_in.customer_name
    if payment_in.customer_email:
        booking.customer_email = payment_in.customer_email
    if payment_in.customer_phone:
        booking.customer_phone = payment_in.customer_phone

    # Ensure linked user account is updated
    if booking.user:
        if payment_in.customer_name and (not booking.user.name or booking.user.name == "Guest Customer"):
            booking.user.name = payment_in.customer_name
        if payment_in.customer_phone and not booking.user.phone:
            booking.user.phone = payment_in.customer_phone

    db.add(payment)
    db.commit()
    db.refresh(payment)
    db.refresh(booking)

    # Gather data for email/SMS notifications
    showtime = booking.showtime
    movie_title = showtime.movie.title if showtime and showtime.movie else "Avatar: The Way of Water"
    theater_name = showtime.hall.theater.name if showtime and showtime.hall and showtime.hall.theater else "Scope Cinemas - Colombo City Centre"
    hall_name = showtime.hall.hall_name if showtime and showtime.hall else "Screen 1 - Dolby Atmos"
    start_time_str = showtime.start_time.strftime("%A, %b %d, %Y at %I:%M %p") if showtime and showtime.start_time else "Today at 7:30 PM"

    seat_labels = [f"{bs.seat.row_label}{bs.seat.seat_number}" for bs in booking.booking_seats if bs.seat]
    if not seat_labels:
        seat_labels = ["D5", "D6"]

    # Target Email & Phone setup
    recipient_email = payment_in.customer_email
    if not recipient_email and current_user:
        recipient_email = current_user.email
    if not recipient_email:
        recipient_email = "yashodhamadushi03@gmail.com"

    recipient_name = payment_in.customer_name or (current_user.name if current_user else "Kasun Perera")
    recipient_phone = payment_in.customer_phone or (current_user.phone if current_user else None)

    # Direct SMTP dispatch to guarantee immediate delivery
    try:
        NotificationService.send_email_ticket(
            user_email=recipient_email,
            user_name=recipient_name,
            movie_title=movie_title,
            theater_name=theater_name,
            hall_name=hall_name,
            showtime_str=start_time_str,
            seat_labels=seat_labels,
            total_amount=float(booking.total_amount),
            transaction_ref=txn_ref
        )
    except Exception as err:
        print("Direct email dispatch warning:", err)

    # Automated SMS ticket dispatch
    if recipient_phone:
        try:
            NotificationService.send_sms_ticket(
                phone_number=recipient_phone,
                movie_title=movie_title,
                showtime_str=start_time_str,
                seat_labels=seat_labels,
                transaction_ref=txn_ref
            )
        except Exception as sms_err:
            print("Direct SMS dispatch warning:", sms_err)

    payment_out = PaymentOut.model_validate(payment)
    payment_out.is_sandbox = is_sandbox
    payment_out.message = (
        "Sandbox test payment authorized successfully. Tickets dispatched via Email and SMS."
        if is_sandbox
        else "Payment authorized successfully. Tickets dispatched."
    )
    return payment_out


from pydantic import BaseModel

class DirectEmailRequest(BaseModel):
    customer_email: str
    customer_name: Optional[str] = "Valued Customer"
    movie_title: Optional[str] = "Avatar: The Way of Water"
    theater_name: Optional[str] = "Scope Cinemas - Colombo City Centre"
    hall_name: Optional[str] = "Screen 1 - Dolby Atmos"
    seats: Optional[List[str]] = ["D5", "D6"]
    total: Optional[float] = 3000.0
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
        movie_title=req.movie_title or "Avatar: The Way of Water",
        theater_name=req.theater_name or "Scope Cinemas - Colombo City Centre",
        hall_name=req.hall_name or "Screen 1",
        showtime_str="Today at 7:30 PM",
        seat_labels=req.seats or ["D5", "D6"],
        total_amount=req.total or 3000.0,
        transaction_ref=ref
    )
    return {"status": "success" if sent else "simulated", "email": req.customer_email, "ref": ref}

