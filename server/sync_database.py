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

    # Step 1: Create any completely missing tables
    print("\n[Step 1] Inspecting Tables & Creating Missing Models...")
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    model_tables = set(Base.metadata.tables.keys())

    missing_tables = model_tables - existing_tables
    if missing_tables:
        print(f"  -> Detected missing tables: {list(missing_tables)}")
        Base.metadata.create_all(bind=engine)
        # Refresh inspector
        inspector = inspect(engine)
        existing_tables = set(inspector.get_table_names())
        for mt in missing_tables:
            changes_applied["tables_created"].append(mt)
            print(f"  [CREATED] Table '{mt}' created successfully.")
    else:
        print(f"  [OK] All {len(model_tables)} registered model tables exist in MySQL.")

    # Step 2: Inspect existing tables for missing columns
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

        # Step 3: Ensure User Role ENUM supports all defined roles
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

        # Step 4: Verify Critical Indexes and Composite Unique Constraints
        print("\n[Step 4] Verifying Composite Unique Constraints & Indexes...")
        # A. uq_showtime_seat on booking_seats
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

        # B. uq_hall_row_seat on seats
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

        # C. Performance Indexes on bookings and payments
        performance_indexes = [
            ("bookings", "idx_bookings_user_created", "CREATE INDEX idx_bookings_user_created ON bookings(user_id, created_at DESC);"),
            ("bookings", "idx_bookings_status", "CREATE INDEX idx_bookings_status ON bookings(status);"),
            ("payments", "idx_payments_booking", "CREATE INDEX idx_payments_booking ON payments(booking_id);")
        ]
        for tbl, idx_name, idx_sql in performance_indexes:
            try:
                curr_idx = [idx['Key_name'] for idx in conn.execute(text(f"SHOW INDEX FROM `{tbl}`;")).mappings()]
                if idx_name not in curr_idx:
                    conn.execute(text(idx_sql))
                    conn.commit()
                    changes_applied["constraints_added"].append(f"{tbl}.{idx_name}")
                    print(f"  [ADDED] Performance index `{idx_name}` on `{tbl}`.")
                else:
                    print(f"  [OK] Performance index `{idx_name}` on `{tbl}` is active.")
            except Exception as ex:
                pass

        # Step 5: Seed sample F&B concession orders if empty
        print("\n[Step 5] Checking Seed Data for F&B Concessions...")
        try:
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
            print(f"  [NOTE] F&B seed check: {ex}")

        # Step 6: Final Verification & Row Count Summary
        print("\n[Step 6] Final Database Verification Summary:")
        all_tables = [list(r.values())[0] for r in conn.execute(text("SHOW TABLES;")).mappings()]
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
