import pymysql
from app.core.config import settings

def run_migration():
    print(f"Connecting to MySQL server: {settings.MYSQL_SERVER}:{settings.MYSQL_PORT}, database: {settings.MYSQL_DB}...")
    conn = pymysql.connect(
        host=settings.MYSQL_SERVER,
        port=settings.MYSQL_PORT,
        user=settings.MYSQL_USER,
        password=settings.MYSQL_PASSWORD,
        database=settings.MYSQL_DB
    )
    cur = conn.cursor(pymysql.cursors.DictCursor)

    try:
        # 1. Update users role enum to ensure admin, customer, theater_manager exist
        print("\n[Step 1] Synchronizing `users` role ENUM...")
        cur.execute("""
        ALTER TABLE users 
        MODIFY COLUMN role ENUM('customer', 'admin', 'theater_manager') NOT NULL DEFAULT 'customer';
        """)
        print("  -> `users` role ENUM verified.")

        # 2. Add customer contact columns to `bookings` if missing
        print("\n[Step 2] Synchronizing `bookings` table columns...")
        cur.execute("DESCRIBE bookings;")
        booking_cols = [r['Field'] for r in cur.fetchall()]

        if "customer_name" not in booking_cols:
            cur.execute("ALTER TABLE bookings ADD COLUMN customer_name VARCHAR(100) NULL AFTER status;")
            print("  -> Added column `customer_name` to `bookings`.")
        else:
            print("  -> Column `customer_name` already exists.")

        if "customer_email" not in booking_cols:
            cur.execute("ALTER TABLE bookings ADD COLUMN customer_email VARCHAR(150) NULL AFTER customer_name;")
            print("  -> Added column `customer_email` to `bookings`.")
        else:
            print("  -> Column `customer_email` already exists.")

        if "customer_phone" not in booking_cols:
            cur.execute("ALTER TABLE bookings ADD COLUMN customer_phone VARCHAR(20) NULL AFTER customer_email;")
            print("  -> Added column `customer_phone` to `bookings`.")
        else:
            print("  -> Column `customer_phone` already exists.")

        # 3. Verify Composite Unique Constraint on booking_seats
        print("\n[Step 3] Verifying composite unique constraint `uq_showtime_seat` on `booking_seats`...")
        cur.execute("SHOW INDEX FROM booking_seats;")
        bs_indexes = [r['Key_name'] for r in cur.fetchall()]
        if "uq_showtime_seat" not in bs_indexes:
            cur.execute("ALTER TABLE booking_seats ADD CONSTRAINT uq_showtime_seat UNIQUE (showtime_id, seat_id);")
            print("  -> Added composite unique constraint `uq_showtime_seat`.")
        else:
            print("  -> Composite unique constraint `uq_showtime_seat` is active.")

        # 4. Create `f_b_orders` table
        print("\n[Step 4] Synchronizing `f_b_orders` (Food & Beverage) table...")
        cur.execute("""
        CREATE TABLE IF NOT EXISTS f_b_orders (
            order_id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NULL,
            user_id INT NOT NULL,
            item_name VARCHAR(100) NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            unit_price DECIMAL(10, 2) NOT NULL,
            total_price DECIMAL(10, 2) NOT NULL,
            status ENUM('Pending', 'Confirmed', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Confirmed',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_fb_orders_booking FOREIGN KEY (booking_id) 
                REFERENCES bookings (booking_id) ON DELETE CASCADE,
            CONSTRAINT fk_fb_orders_user FOREIGN KEY (user_id) 
                REFERENCES users (user_id) ON DELETE CASCADE,
            INDEX idx_fb_orders_booking (booking_id),
            INDEX idx_fb_orders_user (user_id),
            INDEX idx_fb_orders_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        print("  -> `f_b_orders` table verified.")

        # 5. Seed sample F&B orders if table is empty
        cur.execute("SELECT COUNT(*) AS cnt FROM f_b_orders;")
        fb_count = cur.fetchone()['cnt']
        if fb_count == 0:
            print("\n[Step 5] Seeding initial cinema F&B concession orders...")
            cur.execute("SELECT booking_id, user_id FROM bookings ORDER BY created_at DESC LIMIT 5;")
            sample_bookings = cur.fetchall()

            sample_items = [
                ("Jumbo Caramel Popcorn Combo", 2, 850.00, 1700.00),
                ("Loaded Cheese Nachos & Salsa", 1, 950.00, 950.00),
                ("Coca-Cola Zero 500ml", 2, 350.00, 700.00),
                ("Blockbuster Duo Snack Combo", 1, 1600.00, 1600.00),
                ("Salted Butter Popcorn Regular", 1, 650.00, 650.00),
            ]

            for i, item in enumerate(sample_items):
                b_id = sample_bookings[i % len(sample_bookings)]['booking_id'] if sample_bookings else None
                u_id = sample_bookings[i % len(sample_bookings)]['user_id'] if sample_bookings else 1
                cur.execute("""
                INSERT INTO f_b_orders (booking_id, user_id, item_name, quantity, unit_price, total_price, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, 'Confirmed', NOW());
                """, (b_id, u_id, item[0], item[1], item[2], item[3]))

            print(f"  -> Seeded {len(sample_items)} realistic cinema F&B orders.")

        conn.commit()
        print("\nAll schema synchronizations committed to MySQL successfully!")

        # 6. Final Verification of All Tables
        print("\n[Step 6] Final Database Inspection:")
        cur.execute("SHOW TABLES;")
        all_tables = [list(r.values())[0] for r in cur.fetchall()]
        print(f"Total Tables in Database: {len(all_tables)}")
        for t in all_tables:
            cur.execute(f"SELECT COUNT(*) AS cnt FROM {t};")
            cnt = cur.fetchone()['cnt']
            print(f"  [OK] {t:<20} : {cnt} records")

    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
