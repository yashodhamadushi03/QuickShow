"""
Script to create and populate MySQL Views, Stored Procedures, and Functions
in quickshow_db for QuickShow Cinema Reservation Platform.
"""
from sqlalchemy import text
from app.core.database import engine

def apply_database_routines():
    print("=" * 70)
    print(" CREATING MYSQL VIEWS, STORED PROCEDURES & FUNCTIONS IN QUICKSHOW_DB")
    print("=" * 70)

    # 1. VIEW: vw_active_bookings
    view_active_bookings_sql = """
    CREATE OR REPLACE VIEW `vw_active_bookings` AS
    SELECT 
        b.booking_id,
        b.created_at AS booking_date,
        b.user_id,
        COALESCE(u.name, b.customer_name, 'Valued Customer') AS customer_name,
        COALESCE(b.customer_email, u.email) AS customer_email,
        COALESCE(b.customer_phone, u.phone, 'N/A') AS customer_phone,
        b.status AS booking_status,
        m.movie_id,
        m.title AS movie_title,
        m.genre AS movie_genre,
        t.theater_id,
        t.name AS theater_name,
        t.city AS theater_city,
        h.hall_id,
        h.hall_name,
        st.showtime_id,
        st.start_time AS showtime_start,
        st.end_time AS showtime_end,
        b.total_amount,
        COALESCE(p.payment_method, 'Credit / Debit Card') AS payment_method,
        COALESCE(p.status, 'Pending') AS payment_status,
        COALESCE(p.transaction_reference, 'N/A') AS transaction_reference,
        p.is_sandbox
    FROM bookings b
    JOIN users u ON b.user_id = u.user_id
    JOIN showtimes st ON b.showtime_id = st.showtime_id
    JOIN movies m ON st.movie_id = m.movie_id
    JOIN halls h ON st.hall_id = h.hall_id
    JOIN theaters t ON h.theater_id = t.theater_id
    LEFT JOIN payments p ON b.booking_id = p.booking_id;
    """

    # 2. VIEW: vw_movie_analytics
    view_movie_analytics_sql = """
    CREATE OR REPLACE VIEW `vw_movie_analytics` AS
    SELECT 
        m.movie_id,
        m.title AS movie_title,
        m.genre,
        m.language,
        m.status AS movie_status,
        m.rating,
        COUNT(DISTINCT st.showtime_id) AS total_showtimes,
        COUNT(DISTINCT b.booking_id) AS total_bookings,
        COUNT(DISTINCT bs.booking_seat_id) AS total_tickets_sold,
        COALESCE(SUM(CASE WHEN b.status = 'Confirmed' THEN b.total_amount ELSE 0 END), 0.00) AS total_revenue_lkr,
        COALESCE(AVG(CASE WHEN b.status = 'Confirmed' THEN b.total_amount ELSE NULL END), 0.00) AS avg_booking_value_lkr
    FROM movies m
    LEFT JOIN showtimes st ON m.movie_id = st.movie_id
    LEFT JOIN bookings b ON st.showtime_id = b.showtime_id
    LEFT JOIN booking_seats bs ON b.booking_id = bs.booking_id AND b.status = 'Confirmed'
    GROUP BY 
        m.movie_id,
        m.title,
        m.genre,
        m.language,
        m.status,
        m.rating;
    """

    # 3. STORED PROCEDURE: sp_get_user_bookings
    drop_sp_user_bookings = "DROP PROCEDURE IF EXISTS `sp_get_user_bookings`;"
    sp_user_bookings_sql = """
    CREATE PROCEDURE `sp_get_user_bookings`(IN p_user_id INT)
    BEGIN
        SELECT 
            b.booking_id,
            b.created_at AS booking_date,
            b.status AS booking_status,
            b.total_amount,
            COALESCE(u.name, b.customer_name) AS customer_name,
            COALESCE(b.customer_email, u.email) AS customer_email,
            m.title AS movie_title,
            m.poster_url,
            t.name AS theater_name,
            t.city AS theater_city,
            h.hall_name,
            st.start_time AS showtime,
            GROUP_CONCAT(CONCAT(s.row_label, s.seat_number) ORDER BY s.row_label, s.seat_number SEPARATOR ', ') AS reserved_seats,
            COUNT(bs.seat_id) AS total_seats,
            COALESCE(p.transaction_reference, 'N/A') AS transaction_reference,
            COALESCE(p.payment_method, 'Credit / Debit Card') AS payment_method,
            COALESCE(p.status, 'Pending') AS payment_status,
            p.is_sandbox
        FROM bookings b
        JOIN users u ON b.user_id = u.user_id
        JOIN showtimes st ON b.showtime_id = st.showtime_id
        JOIN movies m ON st.movie_id = m.movie_id
        JOIN halls h ON st.hall_id = h.hall_id
        JOIN theaters t ON h.theater_id = t.theater_id
        LEFT JOIN booking_seats bs ON b.booking_id = bs.booking_id
        LEFT JOIN seats s ON bs.seat_id = s.seat_id
        LEFT JOIN payments p ON b.booking_id = p.booking_id
        WHERE b.user_id = p_user_id
        GROUP BY 
            b.booking_id,
            b.created_at,
            b.status,
            b.total_amount,
            u.name,
            b.customer_name,
            b.customer_email,
            u.email,
            m.title,
            m.poster_url,
            t.name,
            t.city,
            h.hall_name,
            st.start_time,
            p.transaction_reference,
            p.payment_method,
            p.status,
            p.is_sandbox
        ORDER BY b.created_at DESC;
    END;
    """

    # 4. STORED PROCEDURE: sp_get_theater_showtimes
    drop_sp_theater_showtimes = "DROP PROCEDURE IF EXISTS `sp_get_theater_showtimes`;"
    sp_theater_showtimes_sql = """
    CREATE PROCEDURE `sp_get_theater_showtimes`(IN p_theater_id INT)
    BEGIN
        SELECT 
            st.showtime_id,
            st.start_time,
            st.end_time,
            st.base_price,
            m.movie_id,
            m.title AS movie_title,
            m.genre,
            m.duration_min,
            m.language,
            m.rating,
            m.poster_url,
            h.hall_id,
            h.hall_name,
            h.total_capacity,
            t.theater_id,
            t.name AS theater_name,
            t.city AS theater_city
        FROM showtimes st
        JOIN movies m ON st.movie_id = m.movie_id
        JOIN halls h ON st.hall_id = h.hall_id
        JOIN theaters t ON h.theater_id = t.theater_id
        WHERE t.theater_id = p_theater_id
        ORDER BY st.start_time ASC;
    END;
    """

    # 5. STORED FUNCTION: fn_calculate_user_spend
    drop_fn_user_spend = "DROP FUNCTION IF EXISTS `fn_calculate_user_spend`;"
    fn_user_spend_sql = """
    CREATE FUNCTION `fn_calculate_user_spend`(p_user_id INT) 
    RETURNS DECIMAL(10,2)
    READS SQL DATA
    DETERMINISTIC
    BEGIN
        DECLARE total_spend DECIMAL(10,2) DEFAULT 0.00;
        
        SELECT COALESCE(SUM(total_amount), 0.00)
        INTO total_spend
        FROM bookings
        WHERE user_id = p_user_id 
          AND status = 'Confirmed';
          
        RETURN total_spend;
    END;
    """

    with engine.connect() as conn:
        print("\n[Step 1] Creating Views...")
        conn.execute(text(view_active_bookings_sql))
        conn.commit()
        print("  [OK] View `vw_active_bookings` created successfully.")

        conn.execute(text(view_movie_analytics_sql))
        conn.commit()
        print("  [OK] View `vw_movie_analytics` created successfully.")

        print("\n[Step 2] Creating Stored Procedures...")
        conn.execute(text(drop_sp_user_bookings))
        conn.execute(text(sp_user_bookings_sql))
        conn.commit()
        print("  [OK] Procedure `sp_get_user_bookings` created successfully.")

        conn.execute(text(drop_sp_theater_showtimes))
        conn.execute(text(sp_theater_showtimes_sql))
        conn.commit()
        print("  [OK] Procedure `sp_get_theater_showtimes` created successfully.")

        print("\n[Step 3] Creating Stored Functions...")
        conn.execute(text(drop_fn_user_spend))
        conn.execute(text(fn_user_spend_sql))
        conn.commit()
        print("  [OK] Function `fn_calculate_user_spend` created successfully.")

        # -----------------------------------------------------------------
        # Verification & Test Executions
        # -----------------------------------------------------------------
        print("\n[Step 4] Verifying Schemas Panel Objects in MySQL Workbench...")

        # A. Check Views
        views = conn.execute(text("SHOW FULL TABLES IN `quickshow_db` WHERE Table_type = 'VIEW';")).all()
        view_names = [v[0] for v in views]
        print(f"  -> Active Views in quickshow_db: {view_names}")
        assert "vw_active_bookings" in view_names, "Missing vw_active_bookings"
        assert "vw_movie_analytics" in view_names, "Missing vw_movie_analytics"

        # B. Check Stored Procedures
        procs = conn.execute(text("SHOW PROCEDURE STATUS WHERE Db = 'quickshow_db';")).mappings().all()
        proc_names = [p["Name"] for p in procs]
        print(f"  -> Active Procedures in quickshow_db: {proc_names}")
        assert "sp_get_user_bookings" in proc_names, "Missing sp_get_user_bookings"
        assert "sp_get_theater_showtimes" in proc_names, "Missing sp_get_theater_showtimes"

        # C. Check Stored Functions
        funcs = conn.execute(text("SHOW FUNCTION STATUS WHERE Db = 'quickshow_db';")).mappings().all()
        func_names = [f["Name"] for f in funcs]
        print(f"  -> Active Functions in quickshow_db: {func_names}")
        assert "fn_calculate_user_spend" in func_names, "Missing fn_calculate_user_spend"

        print("\n[Step 5] Testing Query Execution of Newly Created Objects...")

        # Test View 1: vw_active_bookings
        v1_rows = conn.execute(text("SELECT booking_id, customer_name, movie_title, theater_name, total_amount FROM vw_active_bookings LIMIT 3;")).mappings().all()
        print(f"  [TEST] `vw_active_bookings` sample rows: {len(v1_rows)}")
        for r in v1_rows:
            print(f"         Booking #{r['booking_id']} | {r['customer_name']} | {r['movie_title']} | {r['theater_name']} | LKR {r['total_amount']}")

        # Test View 2: vw_movie_analytics
        v2_rows = conn.execute(text("SELECT movie_title, total_showtimes, total_bookings, total_tickets_sold, total_revenue_lkr FROM vw_movie_analytics WHERE total_bookings > 0 LIMIT 3;")).mappings().all()
        print(f"  [TEST] `vw_movie_analytics` sample rows:")
        for r in v2_rows:
            print(f"         {r['movie_title']}: {r['total_bookings']} bookings, {r['total_tickets_sold']} tickets, LKR {r['total_revenue_lkr']} revenue")

        # Test Procedure 1: sp_get_user_bookings (User 7 = Yashodha)
        sp1_res = conn.execute(text("CALL sp_get_user_bookings(7);")).mappings().all()
        print(f"  [TEST] `sp_get_user_bookings(7)` returned {len(sp1_res)} booking records.")
        for b in sp1_res:
            print(f"         Booking #{b['booking_id']} | {b['movie_title']} | Seats: [{b['reserved_seats']}] | LKR {b['total_amount']}")

        # Test Procedure 2: sp_get_theater_showtimes (Theater 1)
        sp2_res = conn.execute(text("CALL sp_get_theater_showtimes(1);")).mappings().all()
        print(f"  [TEST] `sp_get_theater_showtimes(1)` returned {len(sp2_res)} showtimes.")

        # Test Function 1: fn_calculate_user_spend (User 7 = Yashodha)
        spend = conn.execute(text("SELECT fn_calculate_user_spend(7) AS total_spent;")).scalar()
        print(f"  [TEST] `fn_calculate_user_spend(7)` = LKR {spend}")

    print("\n" + "=" * 70)
    print(" ALL DATABASE VIEWS, PROCEDURES & FUNCTIONS CREATED AND VERIFIED 100%!")
    print("=" * 70)

if __name__ == "__main__":
    apply_database_routines()
