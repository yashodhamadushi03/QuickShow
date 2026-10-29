"""
Comprehensive User Data Isolation & MySQL Database Verification Script
------------------------------------------------------------------------
Tests strict user isolation for:
- Favourites endpoints (/api/favourites, /api/favourites/ids)
- Bookings endpoints (/api/bookings/my, /api/user/bookings, /api/bookings/{id})
- Database constraints and indexes in quickshow_db
"""
import sys
from fastapi import HTTPException
from app.core.database import SessionLocal, engine
from app.api.favourites import get_user_favourites, get_user_favourite_ids, add_favourite, remove_favourite, FavouriteCreate
from app.api.bookings import get_my_bookings, get_booking_details
from sqlalchemy import text, inspect
import app.models

def run_tests():
    print("=" * 70)
    print(" QUICKSHOW USER DATA ISOLATION & DATABASE VERIFICATION TEST")
    print("=" * 70)

    db = SessionLocal()

    # -------------------------------------------------------------
    # 1. DATABASE SCHEMA & INDEX VERIFICATION
    # -------------------------------------------------------------
    print("\n[Section 1] Verifying MySQL Database Schema & Table Indexes...")
    inspector = inspect(engine)
    required_tables = ["users", "profiles", "favourites", "bookings", "booking_seats"]
    for t in required_tables:
        cols = [c["name"] for c in inspector.get_columns(t)]
        print(f"  [TABLE OK] `{t}` exists with {len(cols)} columns.")

    with engine.connect() as conn:
        booking_indexes = [idx["Key_name"] for idx in conn.execute(text("SHOW INDEX FROM `bookings`")).mappings()]
        assert "idx_bookings_customer_email" in booking_indexes, "Missing idx_bookings_customer_email"
        assert "idx_bookings_user_created" in booking_indexes, "Missing idx_bookings_user_created"
        print("  [INDEX OK] `bookings` table has `idx_bookings_customer_email` and `idx_bookings_user_created`.")

        fav_indexes = [idx["Key_name"] for idx in conn.execute(text("SHOW INDEX FROM `favourites`")).mappings()]
        assert "idx_favourites_user" in fav_indexes or "ix_favourites_user_id" in fav_indexes, "Missing favourites user index"
        assert "uq_user_movie_favourite" in fav_indexes, "Missing uq_user_movie_favourite constraint"
        print("  [INDEX OK] `favourites` table has user index and unique constraint `uq_user_movie_favourite`.")

    # -------------------------------------------------------------
    # 2. FAVOURITES ENDPOINT ISOLATION TESTS
    # -------------------------------------------------------------
    print("\n[Section 2] Testing Favourites Endpoint User Isolation...")

    # A. Unauthenticated / No Email
    unauth_favs = get_user_favourites(email=None, current_user=None, db=db)
    assert unauth_favs == [], f"Expected [] for unauthenticated favourites, got {unauth_favs}"
    print("  [PASS] get_user_favourites (unauthenticated) -> returns [] (zero data leakage)")

    # B. User without favourites
    res_dilshan = get_user_favourites(email="dilshan.wickrama@gmail.com", current_user=None, db=db)
    assert res_dilshan == []
    print("  [PASS] get_user_favourites (user with no favs) -> returns []")

    # C. Unauthenticated POST/DELETE must fail with 401
    try:
        add_favourite(fav_in=FavouriteCreate(movie_id=2, email=None), current_user=None, db=db)
        assert False, "Should have raised HTTPException 401"
    except HTTPException as ex:
        assert ex.status_code == 401
        print("  [PASS] add_favourite (no identity) -> rejected with 401 Unauthorized")

    try:
        remove_favourite(movie_id=2, email=None, current_user=None, db=db)
        assert False, "Should have raised HTTPException 401"
    except HTTPException as ex:
        assert ex.status_code == 401
        print("  [PASS] remove_favourite (no identity) -> rejected with 401 Unauthorized")

    # D. User A adds a favourite
    test_user_a = "yashodhamadushi03@gmail.com"
    res_add = add_favourite(fav_in=FavouriteCreate(movie_id=2, email=test_user_a), current_user=None, db=db)
    assert res_add["status"] == "success"
    print(f"  [PASS] add_favourite (user A: {test_user_a}) -> added successfully")

    # Verify User A sees movie 2
    favs_a = get_user_favourites(email=test_user_a, current_user=None, db=db)
    fav_ids_a = [m.movie_id for m in favs_a]
    assert 2 in fav_ids_a, f"Expected movie 2 in User A favs, got {fav_ids_a}"
    print(f"  [PASS] get_user_favourites?email={test_user_a} -> contains movie 2")

    # Verify User B does NOT see movie 2 (Isolation Check!)
    test_user_b = "amara.silva@gmail.com"
    favs_b = get_user_favourites(email=test_user_b, current_user=None, db=db)
    fav_ids_b = [m.movie_id for m in favs_b]
    assert 2 not in fav_ids_b, f"LEAK DETECTED: User B sees User A's favourite! {fav_ids_b}"
    print(f"  [PASS] get_user_favourites?email={test_user_b} -> does NOT contain movie 2 (100% Isolated)")

    # Clean up User A's test favourite
    res_clean = remove_favourite(movie_id=2, email=test_user_a, current_user=None, db=db)
    assert res_clean["status"] == "success"
    print(f"  [PASS] remove_favourite(movie_id=2, email={test_user_a}) -> removed cleanly")

    # -------------------------------------------------------------
    # 3. BOOKINGS ENDPOINT ISOLATION TESTS
    # -------------------------------------------------------------
    print("\n[Section 3] Testing Bookings Endpoint User Isolation...")

    # A. Unauthenticated / No Email
    res_b_unauth = get_my_bookings(email=None, current_user=None, db=db)
    assert res_b_unauth == [], f"Expected [] for unauth bookings, got {res_b_unauth}"
    print("  [PASS] get_my_bookings (unauthenticated) -> returns [] (zero data leakage)")

    # B. Specific User Isolation: Yashodha (User ID 7)
    y_bookings = get_my_bookings(email="yashodhamadushi03@gmail.com", current_user=None, db=db)
    assert len(y_bookings) == 2, f"Expected 2 bookings for Yashodha, got {len(y_bookings)}"
    for b in y_bookings:
        assert b.customer_email.lower() == "yashodhamadushi03@gmail.com", f"Cross-user booking in Yashodha's tickets: {b}"
    print(f"  [PASS] get_my_bookings(yashodhamadushi03@gmail.com) -> exactly 2 bookings (all matching email)")

    # C. Specific User Isolation: Amara (User ID 6)
    amara_bookings = get_my_bookings(email="amara.silva@gmail.com", current_user=None, db=db)
    assert len(amara_bookings) == 1, f"Expected 1 booking for Amara, got {len(amara_bookings)}"
    assert amara_bookings[0].customer_email.lower() == "amara.silva@gmail.com"
    print(f"  [PASS] get_my_bookings(amara.silva@gmail.com) -> exactly 1 booking (Amara's ticket only)")

    # D. Specific User Isolation: Shanoli (User ID 9)
    shanoli_bookings = get_my_bookings(email="shanolishanu@gmail.com", current_user=None, db=db)
    assert len(shanoli_bookings) == 1
    assert shanoli_bookings[0].customer_email.lower() == "shanolishanu@gmail.com"
    print(f"  [PASS] get_my_bookings(shanolishanu@gmail.com) -> exactly 1 booking (Shanoli's ticket only)")

    # E. Nonexistent user -> 0 bookings
    empty_bookings = get_my_bookings(email="stranger@nowhere.com", current_user=None, db=db)
    assert len(empty_bookings) == 0
    print("  [PASS] get_my_bookings(stranger@nowhere.com) -> exactly 0 bookings")

    # F. Individual Booking Details authorization check
    # Booking 8 belongs to Amara. Yashodha trying to access Booking 8 must be rejected with 403 Forbidden!
    try:
        get_booking_details(booking_id=8, email="yashodhamadushi03@gmail.com", current_user=None, db=db)
        assert False, "Should have raised 403 Forbidden"
    except HTTPException as ex:
        assert ex.status_code == 403
        print("  [PASS] get_booking_details(id=8, email=yashodha) (unauthorized viewer) -> 403 Forbidden")

    # Amara accessing her own Booking 8 -> 200 OK
    b8 = get_booking_details(booking_id=8, email="amara.silva@gmail.com", current_user=None, db=db)
    assert b8.booking_id == 8
    print("  [PASS] get_booking_details(id=8, email=amara) (ticket owner) -> 200 OK")

    print("\n" + "=" * 70)
    print(" >>> ALL 16 USER DATA ISOLATION TESTS PASSED WITH 100% SUCCESS! <<<")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
