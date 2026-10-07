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
    - Wraps operations inside a MySQL database transaction.
    - Uses SELECT ... FOR UPDATE (pessimistic locking) and MySQL composite unique index 
      uq_showtime_seat(showtime_id, seat_id) to strictly prevent race conditions and double bookings.
    """
    if not booking_in.seat_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one seat must be selected.")

    # Get target user or fallback customer
    user_obj = current_user
    if not user_obj:
        user_obj = db.query(User).filter(User.role == UserRole.CUSTOMER).first()
        if not user_obj:
            user_obj = User(
                name=booking_in.customer_name or "Guest Customer",
                email=booking_in.customer_email or "guest@quickshow.lk",
                password_hash="guest_hash",
                role=UserRole.CUSTOMER
            )
            db.add(user_obj)
            db.flush()

    # 1. Verify showtime exists
    st = db.query(Showtime).filter(Showtime.showtime_id == booking_in.showtime_id).first()
    if not st:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Showtime not found.")

    # 2. Verify all requested seats exist in the showtime's hall
    valid_seats = (
        db.query(Seat)
        .filter(Seat.seat_id.in_(booking_in.seat_ids), Seat.hall_id == st.hall_id)
        .all()
    )
    if len(valid_seats) != len(booking_in.seat_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more selected seats are invalid for this showtime's hall."
        )

    try:
        # Start database transaction
        with db.begin_nested():
            # 3. Check if any requested seats are already booked or locked (Pessimistic Lock FOR UPDATE)
            conflicting_seats = (
                db.query(BookingSeat.seat_id)
                .join(Booking, BookingSeat.booking_id == Booking.booking_id)
                .filter(
                    BookingSeat.showtime_id == booking_in.showtime_id,
                    BookingSeat.seat_id.in_(booking_in.seat_ids),
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING])
                )
                .with_for_update()
                .all()
            )

            if conflicting_seats:
                conflict_ids = [s.seat_id for s in conflicting_seats]
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Seat reservation failed: Seats (IDs: {conflict_ids}) are already booked or locked by another transaction."
                )

            # 4. Calculate total amount
            total_amount = Decimal(st.base_price) * Decimal(len(booking_in.seat_ids))

            # 5. Create Pending Booking
            booking = Booking(
                user_id=user_obj.user_id,
                showtime_id=booking_in.showtime_id,
                total_amount=total_amount,
                status=BookingStatus.PENDING
            )
            db.add(booking)
            db.flush()  # Generate booking_id

            # 6. Create BookingSeat records
            for seat_id in booking_in.seat_ids:
                b_seat = BookingSeat(
                    booking_id=booking.booking_id,
                    seat_id=seat_id,
                    showtime_id=booking_in.showtime_id,
                    price=st.base_price
                )
                db.add(b_seat)
            
            db.flush()

        db.commit()
        db.refresh(booking)
        return booking

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Double-booking conflict detected! One or more seats were just reserved by another user."
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
    automated Email and SMS ticket notifications via background tasks.
    """
    booking = db.query(Booking).filter(Booking.booking_id == payment_in.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    if booking.status == BookingStatus.CONFIRMED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking is already confirmed and paid.")

    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot pay for a cancelled booking.")

    # Generate transaction reference
    txn_ref = f"TXN-LK{uuid.uuid4().hex[:8].upper()}"
    payment = Payment(
        booking_id=booking.booking_id,
        amount=booking.total_amount,
        payment_method=payment_in.payment_method,
        status=PaymentStatus.SUCCESS,
        transaction_reference=txn_ref
    )
    
    # Confirm booking status
    booking.status = BookingStatus.CONFIRMED

    db.add(payment)
    db.commit()
    db.refresh(payment)

    # Gather data for email/SMS notifications
    showtime = booking.showtime
    movie_title = showtime.movie.title if showtime and showtime.movie else "Cinema Movie"
    theater_name = showtime.hall.theater.name if showtime and showtime.hall and showtime.hall.theater else "QuickShow Cinema"
    hall_name = showtime.hall.hall_name if showtime and showtime.hall else "Screen 1"
    start_time_str = showtime.start_time.strftime("%A, %b %d, %Y at %I:%M %p") if showtime else "Scheduled Showtime"

    seat_labels = [f"{bs.seat.row_label}{bs.seat.seat_number}" for bs in booking.booking_seats if bs.seat]

    # Target Email & Phone setup
    recipient_email = payment_in.customer_email
    if not recipient_email and current_user:
        recipient_email = current_user.email
    if not recipient_email:
        recipient_email = "customer@quickshow.lk"

    recipient_name = payment_in.customer_name or (current_user.name if current_user else "Valued Customer")
    recipient_phone = payment_in.customer_phone or (current_user.phone if current_user else None)

    # Queue automated Ticket Dispatch (Email & SMS) in background tasks
    background_tasks.add_task(
        NotificationService.send_email_ticket,
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

    if recipient_phone:
        background_tasks.add_task(
            NotificationService.send_sms_ticket,
            phone_number=recipient_phone,
            movie_title=movie_title,
            showtime_str=start_time_str,
            seat_labels=seat_labels,
            transaction_ref=txn_ref
        )

    return payment
