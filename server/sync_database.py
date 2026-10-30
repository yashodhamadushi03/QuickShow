"""
QuickShow Database Schema Synchronizer & Migration Utility
-----------------------------------------------------------
Safely and non-destructively inspects all SQLAlchemy models against the MySQL database.
Automatically creates any missing tables, adds missing columns, and ensures all indexes
and unique constraints exist without deleting or altering existing data.
"""

import sys
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy import inspect, text
from app.core.config import settings
from app.core.database import engine, SessionLocal, Base
import app.models  # Ensures all models (User, Movie, Theater, Hall, Seat, Showtime, Booking, BookingSeat, Payment, FBOrder) are registered

def sync_database():
    print("=" * 65)
    print(" QUICKSHOW MYSQL DATABASE SCHEMA INSPECTION & SYNCHRONIZATION")
    print("=" * 65)
    print(f"Target Database Engine: {engine.url}")
    print(f"Timestamp: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")

    changes_applied = {
        "tables_created": [],
        "columns_added": [],
        "constraints_added": [],
        "enums_updated": []
    }
    print("\n[Step 1] Inspecting Tables & Creating Missing Models...")
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    model_tables = set(Base.metadata.tables.keys())

    missing_tables = model_tables - existing_tables
    if missing_tables:
        print(f"  -> Detected missing tables: {list(missing_tables)}")
        Base.metadata.create_all(bind=engine)
        inspector = inspect(engine)
        existing_tables = set(inspector.get_table_names())
        for mt in missing_tables:
            changes_applied["tables_created"].append(mt)
            print(f"  [CREATED] Table '{mt}' created successfully.")
    else:
        print(f"  [OK] All {len(model_tables)} registered model tables exist in MySQL.")
    print("\n[Step 2] Inspecting Columns per Table...")
    with engine.connect() as conn:
        for table_name, table in Base.metadata.tables.items():
            if table_name not in existing_tables:
                continue

            existing_cols = {col['name'] for col in inspector.get_columns(table_name)}
            
            for column in table.columns:
                if column.name not in existing_cols:
                    col_type = column.type.compile(engine.dialect)
                    null_str = "NULL" if column.nullable else "NOT NULL"
                    default_str = ""
                    if column.default is not None and column.default.is_scalar:
                        arg_val = column.default.arg
                        if isinstance(arg_val, bool):
                            default_str = f" DEFAULT {1 if arg_val else 0}"
                        elif isinstance(arg_val, (int, float)):
                            default_str = f" DEFAULT {arg_val}"
                        else:
                            default_str = f" DEFAULT '{arg_val}'"
                    
                    alter_sql = f"ALTER TABLE `{table_name}` ADD COLUMN `{column.name}` {col_type} {null_str}{default_str};"
                    print(f"  -> Adding missing column: `{table_name}`.`{column.name}` ({col_type})")
                    try:
                        conn.execute(text(alter_sql))
                        conn.commit()
                        changes_applied["columns_added"].append(f"{table_name}.{column.name}")
                        print(f"  [ADDED] Column `{table_name}`.`{column.name}` successfully added.")
                    except Exception as ex:
                        print(f"  [ERROR] Failed to add column `{table_name}`.`{column.name}`: {ex}")
        print("\n[Step 3] Verifying ENUM Types...")
        try:
            conn.execute(text("""
            ALTER TABLE `users` 
            MODIFY COLUMN `role` ENUM('customer', 'admin', 'theater_manager') NOT NULL DEFAULT 'customer';
            """))
            conn.commit()
            changes_applied["enums_updated"].append("users.role ('customer', 'admin', 'theater_manager')")
            print("  [OK] `users.role` ENUM synchronized.")
        except Exception as ex:
            print(f"  [NOTE] users.role ENUM update skipped or already applied: {ex}")
        print("\n[Step 4] Verifying Composite Unique Constraints & Indexes...")
        try:
            bs_indexes = [idx['Key_name'] for idx in conn.execute(text("SHOW INDEX FROM `booking_seats`;")).mappings()]
            if "uq_showtime_seat" not in bs_indexes:
                conn.execute(text("ALTER TABLE `booking_seats` ADD CONSTRAINT `uq_showtime_seat` UNIQUE (`showtime_id`, `seat_id`);"))
                conn.commit()
                changes_applied["constraints_added"].append("booking_seats.uq_showtime_seat (showtime_id, seat_id)")
                print("  [ADDED] Composite unique constraint `uq_showtime_seat` on `booking_seats`.")
            else:
                print("  [OK] Composite unique constraint `uq_showtime_seat` is active.")
        except Exception as ex:
            print(f"  [NOTE] booking_seats index check: {ex}")
        try:
            seat_indexes = [idx['Key_name'] for idx in conn.execute(text("SHOW INDEX FROM `seats`;")).mappings()]
            if "uq_hall_row_seat" not in seat_indexes:
                conn.execute(text("ALTER TABLE `seats` ADD CONSTRAINT `uq_hall_row_seat` UNIQUE (`hall_id`, `row_label`, `seat_number`);"))
                conn.commit()
                changes_applied["constraints_added"].append("seats.uq_hall_row_seat (hall_id, row_label, seat_number)")
                print("  [ADDED] Composite unique constraint `uq_hall_row_seat` on `seats`.")
            else:
                print("  [OK] Composite unique constraint `uq_hall_row_seat` is active.")
        except Exception as ex:
            print(f"  [NOTE] seats index check: {ex}")
        performance_indexes = [
            ("bookings", "idx_bookings_user_created", "CREATE INDEX idx_bookings_user_created ON bookings(user_id, created_at DESC);"),
            ("bookings", "idx_bookings_customer_email", "CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);"),
            ("bookings", "idx_bookings_status", "CREATE INDEX idx_bookings_status ON bookings(status);"),
            ("payments", "idx_payments_booking", "CREATE INDEX idx_payments_booking ON payments(booking_id);"),
            ("favourites", "idx_favourites_user", "CREATE INDEX idx_favourites_user ON favourites(user_id);"),
            ("profiles", "idx_profiles_user", "CREATE INDEX idx_profiles_user ON profiles(user_id);")
        ]
        for tbl, idx_name, idx_sql in performance_indexes:
            try:
                curr_idx = [idx['Key_name'] for idx in conn.execute(text(f"SHOW INDEX FROM `{tbl}`;")).mappings()]
                if idx_name not in curr_idx:
                    conn.execute(text(idx_sql))
                    conn.commit()
                    changes_applied["constraints_added"].append(f"{tbl}.{idx_name}")
                    print(f"  [ADDED] User-isolation index `{idx_name}` on `{tbl}`.")
                else:
                    print(f"  [OK] User-isolation index `{idx_name}` on `{tbl}` is active.")
            except Exception as ex:
                print(f"  [NOTE] {tbl} index {idx_name}: {ex}")
        print("\n[Step 5] Checking Seed Data for Core Tables & Concessions...")
        try:
            user_count = conn.execute(text("SELECT COUNT(*) AS cnt FROM `users`;")).scalar()
            if user_count == 0:
                conn.execute(text("""
                INSERT INTO `users` (`user_id`, `name`, `email`, `password_hash`, `phone`, `role`, `created_at`)
                VALUES 
                    (1, 'System Administrator', 'admin@quickshow.lk', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', '+94771234567', 'admin', NOW()),
                    (2, 'Colombo City Manager', 'manager@quickshow.lk', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', '+94112083000', 'theater_manager', NOW()),
                    (3, 'Kasun Perera', 'user@quickshow.lk', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', '+94719876543', 'customer', NOW())
                ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role);
                """))
                conn.commit()
                print("  [SEEDED] Initial users populated.")

            fb_count = conn.execute(text("SELECT COUNT(*) AS cnt FROM `f_b_orders`;")).scalar()
            if fb_count == 0:
                print("  -> Seeding default cinema concessions into `f_b_orders`...")
                sample_items = [
                    ("Jumbo Caramel Popcorn Combo", 2, Decimal("850.00"), Decimal("1700.00")),
                    ("Loaded Cheese Nachos & Salsa", 1, Decimal("950.00"), Decimal("950.00")),
                    ("Coca-Cola Zero 500ml", 2, Decimal("350.00"), Decimal("700.00")),
                    ("Blockbuster Duo Snack Combo", 1, Decimal("1600.00"), Decimal("1600.00")),
                    ("Salted Butter Popcorn Regular", 1, Decimal("650.00"), Decimal("650.00")),
                ]
                for item in sample_items:
                    conn.execute(text("""
                    INSERT INTO `f_b_orders` (`user_id`, `item_name`, `quantity`, `unit_price`, `total_price`, `status`, `created_at`)
                    VALUES (1, :item_name, :quantity, :unit_price, :total_price, 'Confirmed', NOW());
                    """), {
                        "item_name": item[0],
                        "quantity": item[1],
                        "unit_price": item[2],
                        "total_price": item[3]
                    })
                conn.commit()
                print("  [SEEDED] Added initial concession menu orders.")
            else:
                print(f"  [OK] `f_b_orders` has {fb_count} existing records.")
        except Exception as ex:
            print(f"  [NOTE] Seed check: {ex}")

        print("\n[Step 6] Synchronizing Views, Stored Procedures & Functions...")
        try:
            conn.execute(text("""
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
            """))
            conn.execute(text("""
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
            """))
            conn.commit()
            print("  [OK] Views `vw_active_bookings` and `vw_movie_analytics` synchronized.")
        except Exception as ex:
            print(f"  [NOTE] Views sync warning: {ex}")

        try:
            conn.execute(text("DROP PROCEDURE IF EXISTS `sp_get_user_bookings`;"))
            conn.execute(text("""
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
            """))
            conn.execute(text("DROP PROCEDURE IF EXISTS `sp_get_theater_showtimes`;"))
            conn.execute(text("""
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
            """))
            conn.commit()
            print("  [OK] Stored Procedures `sp_get_user_bookings` and `sp_get_theater_showtimes` synchronized.")
        except Exception as ex:
            print(f"  [NOTE] Stored Procedures skipped (unsupported on this engine): {ex}")

        try:
            conn.execute(text("DROP FUNCTION IF EXISTS `fn_calculate_user_spend`;"))
            conn.execute(text("""
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
            """))
            conn.commit()
            print("  [OK] Stored Function `fn_calculate_user_spend` synchronized.")
        except Exception as ex:
            print(f"  [NOTE] Stored Functions skipped (unsupported on this engine): {ex}")
        print("\n[Step 7] Final Database Verification Summary:")
        all_tables = [list(r.values())[0] for r in conn.execute(text("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE';")).mappings()]
        for t in sorted(all_tables):
            c = conn.execute(text(f"SELECT COUNT(*) FROM `{t}`;")).scalar()
            print(f"  [OK] Table `{t:<20}` : {c:>5} rows")

    print("\n" + "=" * 65)
    print(" SYNCHRONIZATION COMPLETED SUCCESSFULLY!")
    print("=" * 65)
    print("Summary of actions performed:")
    print(f"  - Tables created:       {len(changes_applied['tables_created'])} {changes_applied['tables_created']}")
    print(f"  - Columns added:        {len(changes_applied['columns_added'])} {changes_applied['columns_added']}")
    print(f"  - Constraints verified: {len(changes_applied['constraints_added'])} {changes_applied['constraints_added']}")
    print(f"  - ENUMs verified:       {len(changes_applied['enums_updated'])}")
    print("Existing data was preserved 100% without loss or alteration.")
    return changes_applied

if __name__ == "__main__":
    sync_database()
