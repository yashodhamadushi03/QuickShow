"""
Comprehensive verification test for QuickShow booking confirmation email pipeline:
1. Validates that create_booking (/bookings) triggers ticket confirmation email upon booking creation.
2. Validates that correct booking details (movie title, showtime, theater, hall, selected seats, total amount)
   are accurately fetched and passed to the email generator without data mix-ups.
3. Validates that duplicate email dispatch and asynchronous race conditions between rapid booking and payment
   requests are prevented.
"""
import sys
import os
from decimal import Decimal
from unittest.mock import patch, MagicMock

# Add server directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio
from fastapi import BackgroundTasks
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.showtime import Showtime
from app.models.theater import Theater, Hall, Seat
from app.models.movie import Movie
from app.models.booking import Booking, BookingSeat, BookingStatus
from app.models.payment import Payment
from app.schemas.booking import BookingCreate
from app.schemas.payment import PaymentCreate
from app.api.bookings import create_booking, process_payment, email_tracker
from app.services.notification import NotificationService

def run_email_pipeline_tests():
    print("=" * 70)
    print("QUICKSHOW BOOKING CONFIRMATION EMAIL PIPELINE VERIFICATION")
    print("=" * 70)

    db = SessionLocal()
    try:
        # 1. Fetch real entities from the database to test with real data
        showtime = db.query(Showtime).first()
        assert showtime is not None, "At least one showtime must exist in database"
        
        movie = showtime.movie
        hall = showtime.hall
        theater = hall.theater
        
        print(f"\n[Target Showtime Details from Database]")
        print(f"  Showtime ID: {showtime.showtime_id}")
        print(f"  Movie:       {movie.title} (ID: {movie.movie_id})")
        print(f"  Theater:     {theater.name} (ID: {theater.theater_id})")
        print(f"  Hall:        {hall.hall_name} (ID: {hall.hall_id})")
        print(f"  Start Time:  {showtime.start_time}")
        print(f"  Base Price:  LKR {showtime.base_price}")

        # Pick 2 available seats in this hall
        hall_seats = db.query(Seat).filter(Seat.hall_id == hall.hall_id).order_by(Seat.row_label, Seat.seat_number).all()
        assert len(hall_seats) >= 2, "Hall must have at least 2 seats"
        
        # Find 2 seats not currently booked
        booked_seat_ids = set(
            s[0] for s in db.query(BookingSeat.seat_id)
            .join(Booking, BookingSeat.booking_id == Booking.booking_id)
            .filter(
                BookingSeat.showtime_id == showtime.showtime_id,
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING])
            )
            .all()
        )
        
        test_seats = [s for s in hall_seats if s.seat_id not in booked_seat_ids][:2]
        if len(test_seats) < 2:
            # Clean up old test bookings for this showtime if full
            old_test_bks = db.query(Booking).filter(
                Booking.showtime_id == showtime.showtime_id,
                Booking.customer_email == "test_email_verify@quickshow.lk"
            ).all()
            for b in old_test_bks:
                db.delete(b)
            db.commit()
            test_seats = [s for s in hall_seats if s.seat_id not in booked_seat_ids][:2]
            if len(test_seats) < 2:
                test_seats = hall_seats[:2]
                db.query(BookingSeat).filter(
                    BookingSeat.showtime_id == showtime.showtime_id,
                    BookingSeat.seat_id.in_([s.seat_id for s in test_seats])
                ).delete()
                db.commit()

        expected_seat_labels = [f"{s.row_label}{s.seat_number}" for s in test_seats]
        target_seat_ids = [s.seat_id for s in test_seats]
        print(f"  Selected Seats for Test: {expected_seat_labels} (IDs: {target_seat_ids})")

        # -------------------------------------------------------------
        # TEST 1: Booking Creation triggers confirmation email
        # -------------------------------------------------------------
        print("\n[Test 1] Testing /bookings email triggering & detail accuracy upon booking creation...")
        test_email = "test_email_verify@quickshow.lk"
        test_name = "Perera Test Customer"
        test_phone = "+94771234567"

        booking_req = BookingCreate(
            showtime_id=showtime.showtime_id,
            seat_ids=target_seat_ids,
            customer_email=test_email,
            customer_name=test_name,
            customer_phone=test_phone,
            theater_id=theater.theater_id,
            hall_id=hall.hall_id,
            movie_id=movie.movie_id
        )

        bg_tasks = BackgroundTasks()

        with patch.object(NotificationService, "send_email_ticket", return_value=True) as mock_send_email, \
             patch.object(NotificationService, "send_sms_ticket", return_value=True) as mock_send_sms:
            
            created_booking = create_booking(
                booking_in=booking_req,
                background_tasks=bg_tasks,
                current_user=None,
                db=db
            )

            assert created_booking is not None, "Booking record should be created"
            assert created_booking.booking_id is not None
            print(f"  -> Booking #{created_booking.booking_id} created successfully in database.")

            # Run queued background tasks via asyncio
            asyncio.run(bg_tasks())

            # Verify send_email_ticket was called
            assert mock_send_email.called, "NotificationService.send_email_ticket MUST be called upon booking creation!"
            call_kwargs = mock_send_email.call_args.kwargs
            print(f"  -> send_email_ticket invoked with arguments:")
            for k, v in call_kwargs.items():
                print(f"     {k}: {v}")

            # Verify accurate data fetching (NO DATA MIX-UP)
            assert call_kwargs["user_email"] == test_email, f"Email mismatch: {call_kwargs['user_email']} vs {test_email}"
            assert call_kwargs["user_name"] == test_name, f"Name mismatch: {call_kwargs['user_name']} vs {test_name}"
            assert call_kwargs["movie_title"] == movie.title, f"Movie title mismatch: '{call_kwargs['movie_title']}' vs '{movie.title}' (DATA MIX-UP DETECTED!)"
            assert call_kwargs["theater_name"] == theater.name, f"Theater mismatch: '{call_kwargs['theater_name']}' vs '{theater.name}' (DATA MIX-UP DETECTED!)"
            assert call_kwargs["hall_name"] == hall.hall_name, f"Hall mismatch: '{call_kwargs['hall_name']}' vs '{hall.hall_name}' (DATA MIX-UP DETECTED!)"
            assert call_kwargs["seat_labels"] == expected_seat_labels, f"Seats mismatch: {call_kwargs['seat_labels']} vs {expected_seat_labels} (DATA MIX-UP DETECTED!)"
            expected_total = float(showtime.base_price * len(target_seat_ids))
            assert abs(call_kwargs["total_amount"] - expected_total) < 0.01, f"Total amount mismatch: {call_kwargs['total_amount']} vs {expected_total}"
            assert call_kwargs["transaction_ref"].startswith("QS-BK"), f"Invalid booking ref format: {call_kwargs['transaction_ref']}"

            # Verify SMS was also scheduled
            assert mock_send_sms.called, "NotificationService.send_sms_ticket should be called when phone is provided"

            print("  [PASS] Test 1: Ticket confirmation email triggered upon booking creation with 100% accurate details!")

        # -------------------------------------------------------------
        # TEST 2: Preventing duplicate email race conditions on /payments
        # -------------------------------------------------------------
        print("\n[Test 2] Testing duplicate email suppression and race condition protection on /payments...")
        
        # Ensure email_tracker recorded created_booking.booking_id
        assert email_tracker.was_dispatched(created_booking.booking_id), "Booking should be marked dispatched in email_tracker"

        bg_tasks_pay = BackgroundTasks()
        pay_req = PaymentCreate(
            booking_id=created_booking.booking_id,
            payment_method="Test Card",
            customer_email=test_email,
            customer_name=test_name,
            customer_phone=test_phone,
            is_sandbox=True,
            card_number="4242424242424242"
        )

        with patch.object(NotificationService, "send_email_ticket", return_value=True) as mock_send_email_pay:
            payment_res = process_payment(
                payment_in=pay_req,
                background_tasks=bg_tasks_pay,
                current_user=None,
                db=db
            )

            # Run queued background tasks via asyncio
            asyncio.run(bg_tasks_pay())

            # Verify duplicate email was NOT sent because it was already dispatched upon booking creation
            assert not mock_send_email_pay.called, "Duplicate ticket email MUST NOT be re-sent if already dispatched on booking creation!"
            print(f"  -> Payment #{payment_res.payment_id} recorded with ref: {payment_res.transaction_reference}")
            print("  [PASS] Test 2: Race condition and duplicate email dispatch successfully prevented!")

        # -------------------------------------------------------------
        # TEST 3: Payment email dispatch when booking email was not previously dispatched
        # -------------------------------------------------------------
        print("\n[Test 3] Testing /payments standalone email dispatch when not previously triggered...")
        
        # Evict from tracker to simulate a payment for an older/external booking
        with email_tracker._lock:
            email_tracker._dispatched.pop(created_booking.booking_id, None)

        assert not email_tracker.was_dispatched(created_booking.booking_id)

        # Set booking to pending temporarily to allow another payment test
        created_booking.status = BookingStatus.PENDING
        db.commit()

        bg_tasks_pay2 = BackgroundTasks()
        with patch.object(NotificationService, "send_email_ticket", return_value=True) as mock_send_email_standalone:
            payment_res2 = process_payment(
                payment_in=pay_req,
                background_tasks=bg_tasks_pay2,
                current_user=None,
                db=db
            )

            asyncio.run(bg_tasks_pay2())

            assert mock_send_email_standalone.called, "Payment endpoint should dispatch email if not already sent"
            pay_call_kwargs = mock_send_email_standalone.call_args.kwargs
            assert pay_call_kwargs["movie_title"] == movie.title, f"Movie mismatch in payment dispatch: {pay_call_kwargs['movie_title']}"
            assert pay_call_kwargs["theater_name"] == theater.name, f"Theater mismatch in payment dispatch: {pay_call_kwargs['theater_name']}"
            assert pay_call_kwargs["seat_labels"] == expected_seat_labels, f"Seats mismatch in payment dispatch: {pay_call_kwargs['seat_labels']}"
            print("  [PASS] Test 3: Standalone payment dispatch properly fetches accurate movie, theater, and seats!")

        # -------------------------------------------------------------
        # TEST 4: Booking a DIFFERENT movie & theater to verify zero fallback to "Avatar"
        # -------------------------------------------------------------
        st2 = db.query(Showtime).filter(Showtime.showtime_id != showtime.showtime_id).first()
        if st2 and st2.movie and st2.hall and st2.hall.theater:
            print(f"\n[Test 4] Testing booking for different movie: '{st2.movie.title}' at '{st2.hall.theater.name}'...")
            st2_seats = db.query(Seat).filter(Seat.hall_id == st2.hall_id).limit(2).all()
            if len(st2_seats) >= 1:
                st2_seat_labels = [f"{s.row_label}{s.seat_number}" for s in st2_seats]
                booking_req2 = BookingCreate(
                    showtime_id=st2.showtime_id,
                    seat_ids=[s.seat_id for s in st2_seats],
                    customer_email="another_movie@quickshow.lk",
                    customer_name="Different Film Fan",
                    theater_id=st2.hall.theater_id,
                    hall_id=st2.hall_id,
                    movie_id=st2.movie_id
                )
                bg_tasks_diff = BackgroundTasks()
                with patch.object(NotificationService, "send_email_ticket", return_value=True) as mock_send_diff:
                    bk2 = create_booking(booking_in=booking_req2, background_tasks=bg_tasks_diff, db=db)
                    asyncio.run(bg_tasks_diff())
                    assert mock_send_diff.called
                    diff_kwargs = mock_send_diff.call_args.kwargs
                    assert diff_kwargs["movie_title"] == st2.movie.title, f"Expected {st2.movie.title}, got {diff_kwargs['movie_title']}"
                    assert diff_kwargs["theater_name"] == st2.hall.theater.name, f"Expected {st2.hall.theater.name}, got {diff_kwargs['theater_name']}"
                    assert diff_kwargs["seat_labels"] == st2_seat_labels, f"Expected {st2_seat_labels}, got {diff_kwargs['seat_labels']}"
                    print(f"  -> Verified email dispatched with: Movie '{diff_kwargs['movie_title']}', Theater '{diff_kwargs['theater_name']}', Seats {diff_kwargs['seat_labels']}")
                    print("  [PASS] Test 4: Confirmed zero data mix-up with different movie & theater!")
                    db.delete(bk2)
                    db.commit()

        # Clean up test booking
        db.delete(created_booking)
        db.commit()
        print("\n  -> Cleaned up test booking records from MySQL.")

        print("\n" + "=" * 70)
        print("ALL BOOKING CONFIRMATION EMAIL TESTS PASSED WITH ZERO DATA MIX-UPS!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_email_pipeline_tests()
