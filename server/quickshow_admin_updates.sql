
USE quickshow_db;
ALTER TABLE users 
MODIFY COLUMN role ENUM('customer', 'admin', 'theater_manager') NOT NULL DEFAULT 'customer';
CREATE INDEX IF NOT EXISTS idx_bookings_user_created ON bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100) NULL AFTER status;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_email VARCHAR(150) NULL AFTER customer_name;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20) NULL AFTER customer_email;
ALTER TABLE booking_seats 
ADD CONSTRAINT uq_showtime_seat UNIQUE (showtime_id, seat_id);
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
INSERT INTO users (name, email, password_hash, phone, role, created_at)
VALUES 
  ('Scope & Savoy Admin', 'admin@quickshow.lk', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', '+94771234567', 'admin', NOW()),
  ('Colombo City Centre Manager', 'manager@quickshow.lk', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', '+94112083000', 'theater_manager', NOW())
ON DUPLICATE KEY UPDATE 
  role = VALUES(role),
  name = VALUES(name);
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
DROP PROCEDURE IF EXISTS `sp_get_user_bookings`;
DELIMITER $$
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
END$$
DELIMITER ;
DROP PROCEDURE IF EXISTS `sp_get_theater_showtimes`;
DELIMITER $$
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
END$$
DELIMITER ;
DROP FUNCTION IF EXISTS `fn_calculate_user_spend`;
DELIMITER $$
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
END$$
DELIMITER ;
SELECT * FROM vw_active_bookings LIMIT 10;
SELECT * FROM vw_movie_analytics;
CALL sp_get_user_bookings(7);
CALL sp_get_theater_showtimes(1);
SELECT fn_calculate_user_spend(7) AS total_user_spent_lkr;
