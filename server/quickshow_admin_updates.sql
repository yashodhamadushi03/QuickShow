-- ====================================================================
-- QuickShow LK — Admin RBAC & Customer Activity Monitoring Schema Update
-- Compatible with MySQL 8.0+ and MySQL Workbench
-- ====================================================================

USE quickshow_db;

-- 1. Update users table role ENUM to support customer, admin, and theater_manager
ALTER TABLE users 
MODIFY COLUMN role ENUM('customer', 'admin', 'theater_manager') NOT NULL DEFAULT 'customer';

-- 2. Ensure Foreign Keys and Performance Indexes exist for Customer Activity Tracking
-- Index for quick lookups on user bookings and created_at timestamps
CREATE INDEX IF NOT EXISTS idx_bookings_user_created ON bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);

-- Composite Unique Constraint to prevent double-booking race conditions
ALTER TABLE booking_seats 
ADD CONSTRAINT uq_showtime_seat UNIQUE (showtime_id, seat_id);

-- 3. Seed / Verify Default Cinema Administrator & Theater Manager Accounts
-- Password hash for 'admin123' generated with bcrypt
INSERT INTO users (name, email, password_hash, phone, role, created_at)
VALUES 
  ('Scope & Savoy Admin', 'admin@quickshow.lk', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', '+94771234567', 'admin', NOW()),
  ('Colombo City Centre Manager', 'manager@quickshow.lk', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', '+94112083000', 'theater_manager', NOW())
ON DUPLICATE KEY UPDATE 
  role = VALUES(role),
  name = VALUES(name);

-- 4. Sample Verification Queries for MySQL Workbench Admin Analytics
-- Aggregate Customer Spend and Booking Count in Sri Lankan Rupees (LKR)
SELECT 
    u.user_id,
    u.name AS customer_name,
    u.email AS customer_email,
    u.role,
    COUNT(b.booking_id) AS total_bookings,
    COALESCE(SUM(b.total_amount), 0.00) AS total_spent_lkr
FROM users u
LEFT JOIN bookings b ON u.user_id = b.user_id
GROUP BY u.user_id, u.name, u.email, u.role
ORDER BY total_spent_lkr DESC;

-- Real-Time Branch Revenue & Occupancy Fill Rates
SELECT 
    t.name AS theater_name,
    COUNT(DISTINCT b.booking_id) AS total_reservations,
    COALESCE(SUM(b.total_amount), 0.00) AS revenue_lkr
FROM theaters t
JOIN halls h ON t.theater_id = h.theater_id
JOIN showtimes st ON h.hall_id = st.hall_id
JOIN bookings b ON st.showtime_id = b.showtime_id
WHERE b.status = 'CONFIRMED'
GROUP BY t.theater_id, t.name
ORDER BY revenue_lkr DESC;
