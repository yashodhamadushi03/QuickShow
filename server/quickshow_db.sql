-- ============================================================================
-- QuickShow Cinema Management & Ticket Reservation Platform
-- Complete Master Database Schema & Seed Data Script for MySQL Workbench
-- Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: Create and Select Database
-- ----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS quickshow_db 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE quickshow_db;

-- ----------------------------------------------------------------------------
-- Step 2: Create Tables (Ordered by Foreign Key Dependencies)
-- ----------------------------------------------------------------------------

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    role ENUM('customer', 'admin', 'theater_manager') NOT NULL DEFAULT 'customer',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Movies Table
CREATE TABLE IF NOT EXISTS movies (
    movie_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    genre VARCHAR(50) NOT NULL,
    duration_min INT NOT NULL,
    language VARCHAR(50) NOT NULL,
    poster_url VARCHAR(500) NULL,
    rating VARCHAR(10) NULL,
    release_date DATE NULL,
    status ENUM('Now Showing', 'Coming Soon') NOT NULL DEFAULT 'Now Showing',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_movies_title (title),
    INDEX idx_movies_genre (genre),
    INDEX idx_movies_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Theaters Table
CREATE TABLE IF NOT EXISTS theaters (
    theater_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    INDEX idx_theaters_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Halls Table
CREATE TABLE IF NOT EXISTS halls (
    hall_id INT AUTO_INCREMENT PRIMARY KEY,
    theater_id INT NOT NULL,
    hall_name VARCHAR(100) NOT NULL,
    total_capacity INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_halls_theater FOREIGN KEY (theater_id) 
        REFERENCES theaters (theater_id) ON DELETE CASCADE,
    INDEX idx_halls_theater (theater_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Seats Table
CREATE TABLE IF NOT EXISTS seats (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    hall_id INT NOT NULL,
    row_label VARCHAR(10) NOT NULL,
    seat_number INT NOT NULL,
    seat_type VARCHAR(30) NOT NULL DEFAULT 'Regular',
    CONSTRAINT fk_seats_hall FOREIGN KEY (hall_id) 
        REFERENCES halls (hall_id) ON DELETE CASCADE,
    CONSTRAINT uq_hall_row_seat UNIQUE (hall_id, row_label, seat_number),
    INDEX idx_seats_hall (hall_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Showtimes Table
CREATE TABLE IF NOT EXISTS showtimes (
    showtime_id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    hall_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_showtimes_movie FOREIGN KEY (movie_id) 
        REFERENCES movies (movie_id) ON DELETE CASCADE,
    CONSTRAINT fk_showtimes_hall FOREIGN KEY (hall_id) 
        REFERENCES halls (hall_id) ON DELETE CASCADE,
    INDEX idx_showtimes_movie_start (movie_id, start_time),
    INDEX idx_showtimes_hall_start (hall_id, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    showtime_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) 
        REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_bookings_showtime FOREIGN KEY (showtime_id) 
        REFERENCES showtimes (showtime_id) ON DELETE CASCADE,
    INDEX idx_bookings_user_created (user_id, created_at),
    INDEX idx_bookings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Booking Seats Table (Junction Table)
CREATE TABLE IF NOT EXISTS booking_seats (
    booking_seat_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    seat_id INT NOT NULL,
    showtime_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_booking_seats_booking FOREIGN KEY (booking_id) 
        REFERENCES bookings (booking_id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_seats_seat FOREIGN KEY (seat_id) 
        REFERENCES seats (seat_id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_seats_showtime FOREIGN KEY (showtime_id) 
        REFERENCES showtimes (showtime_id) ON DELETE CASCADE,
    CONSTRAINT uq_showtime_seat UNIQUE (showtime_id, seat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status ENUM('Success', 'Failed', 'Pending') NOT NULL DEFAULT 'Pending',
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) 
        REFERENCES bookings (booking_id) ON DELETE CASCADE,
    INDEX idx_payments_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Step 3: Seed Sample Initial Data
-- ----------------------------------------------------------------------------

-- Seed Default Users (Passwords hashed with bcrypt: 'admin123' and 'user123')
INSERT INTO users (user_id, name, email, password_hash, phone, role, created_at)
VALUES 
    (1, 'System Administrator', 'admin@quickshow.lk', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', '+94771234567', 'admin', NOW()),
    (2, 'Colombo City Manager', 'manager@quickshow.lk', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', '+94112083000', 'theater_manager', NOW()),
    (3, 'Kasun Perera', 'user@quickshow.lk', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', '+94719876543', 'customer', NOW())
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    role = VALUES(role);

-- Seed Movies
INSERT INTO movies (movie_id, title, description, genre, duration_min, language, poster_url, rating, release_date, status, created_at)
VALUES 
    (1, 'Avatar: The Way of Water', 'Jake Sully and Neytiri fight to protect their family and Pandora against returning threats.', 'Sci-Fi / Action', 192, 'English', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800', 'PG-13', '2022-12-16', 'Now Showing', NOW()),
    (2, 'Dune: Part Two', 'Paul Atreides unites with Chani and the Fremen to seek revenge against the conspirators.', 'Sci-Fi / Adventure', 166, 'English', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800', 'PG-13', '2024-03-01', 'Now Showing', NOW()),
    (3, 'Kandak Sema', 'A poignant Sri Lankan romantic drama depicting love and resilience amidst picturesque landscapes.', 'Drama / Romance', 135, 'Sinhala', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800', 'U/A', '2024-05-10', 'Now Showing', NOW()),
    (4, 'The Greatest Of All Time (GOAT)', 'An action-packed thriller featuring Thalapathy Vijay in dual roles across covert operations.', 'Action / Thriller', 178, 'Tamil', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800', 'U/A', '2024-09-05', 'Now Showing', NOW()),
    (5, 'Oppenheimer', 'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.', 'Biography / Drama', 180, 'English', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800', 'R', '2023-07-21', 'Now Showing', NOW()),
    (6, 'Inside Out 2', 'Riley encounters new teenage emotions as Headquarters undergoes an unexpected renovation.', 'Animation / Family', 96, 'English', 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=800', 'PG', '2024-06-14', 'Coming Soon', NOW())
ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    status = VALUES(status);

-- Seed Theaters
INSERT INTO theaters (theater_id, name, city, address)
VALUES 
    (1, 'Scope Cinemas Multiplex - CCC', 'Colombo', 'Colombo City Centre, 137 Sir James Pieris Mawatha, Colombo 02'),
    (2, 'Savoy 3D Cinema', 'Colombo', '12 Galle Road, Wellawatte, Colombo 06'),
    (3, 'PVR Cinemas - One Galle Face', 'Colombo', 'One Galle Face Mall, Colombo 01'),
    (4, 'Kandy City Centre Cinema', 'Kandy', 'Level 4, Kandy City Centre, Dalada Veediya, Kandy')
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    city = VALUES(city);

-- Seed Halls
INSERT INTO halls (hall_id, theater_id, hall_name, total_capacity)
VALUES 
    (1, 1, 'Screen 1 (Dolby Atmos)', 40),
    (2, 1, 'Screen 2 (VIP Luxury)', 20),
    (3, 2, 'Main Grand Hall', 40),
    (4, 3, 'PVR Screen 1 (IMAX)', 40),
    (5, 4, 'Screen Alpha', 30)
ON DUPLICATE KEY UPDATE 
    hall_name = VALUES(hall_name),
    total_capacity = VALUES(total_capacity);

-- Seed Seats for Screen 1 (Hall 1)
INSERT INTO seats (hall_id, row_label, seat_number, seat_type)
VALUES 
    (1, 'A', 1, 'VIP'), (1, 'A', 2, 'VIP'), (1, 'A', 3, 'VIP'), (1, 'A', 4, 'VIP'),
    (1, 'B', 1, 'Regular'), (1, 'B', 2, 'Regular'), (1, 'B', 3, 'Regular'), (1, 'B', 4, 'Regular'),
    (1, 'C', 1, 'Regular'), (1, 'C', 2, 'Regular'), (1, 'C', 3, 'Regular'), (1, 'C', 4, 'Regular'),
    (1, 'D', 1, 'Regular'), (1, 'D', 2, 'Regular'), (1, 'D', 3, 'Regular'), (1, 'D', 4, 'Regular')
ON DUPLICATE KEY UPDATE 
    seat_type = VALUES(seat_type);

-- Seed Seats for Screen 2 (Hall 2)
INSERT INTO seats (hall_id, row_label, seat_number, seat_type)
VALUES 
    (2, 'A', 1, 'VIP'), (2, 'A', 2, 'VIP'), (2, 'A', 3, 'VIP'), (2, 'A', 4, 'VIP'),
    (2, 'B', 1, 'VIP'), (2, 'B', 2, 'VIP'), (2, 'B', 3, 'VIP'), (2, 'B', 4, 'VIP')
ON DUPLICATE KEY UPDATE 
    seat_type = VALUES(seat_type);

-- Seed Showtimes (Today and Tomorrow)
INSERT INTO showtimes (showtime_id, movie_id, hall_id, start_time, end_time, base_price)
VALUES 
    (1, 1, 1, DATE_ADD(CURDATE(), INTERVAL '10:30:00' HOUR_SECOND), DATE_ADD(CURDATE(), INTERVAL '13:42:00' HOUR_SECOND), 1500.00),
    (2, 1, 1, DATE_ADD(CURDATE(), INTERVAL '14:30:00' HOUR_SECOND), DATE_ADD(CURDATE(), INTERVAL '17:42:00' HOUR_SECOND), 1500.00),
    (3, 2, 2, DATE_ADD(CURDATE(), INTERVAL '18:00:00' HOUR_SECOND), DATE_ADD(CURDATE(), INTERVAL '20:46:00' HOUR_SECOND), 2200.00),
    (4, 3, 3, DATE_ADD(CURDATE(), INTERVAL '15:00:00' HOUR_SECOND), DATE_ADD(CURDATE(), INTERVAL '17:15:00' HOUR_SECOND), 1200.00),
    (5, 4, 4, DATE_ADD(CURDATE(), INTERVAL '19:30:00' HOUR_SECOND), DATE_ADD(CURDATE(), INTERVAL '22:28:00' HOUR_SECOND), 1800.00)
ON DUPLICATE KEY UPDATE 
    base_price = VALUES(base_price);

-- ----------------------------------------------------------------------------
-- Step 4: Verification Queries
-- ----------------------------------------------------------------------------
-- Check all tables created:
SHOW TABLES;

-- Check movies:
SELECT movie_id, title, genre, language, status, rating FROM movies;

-- Check users:
SELECT user_id, name, email, role, created_at FROM users;

-- Check showtimes with movie and hall details:
SELECT 
    st.showtime_id,
    m.title AS movie_title,
    t.name AS theater_name,
    h.hall_name,
    st.start_time,
    st.base_price
FROM showtimes st
JOIN movies m ON st.movie_id = m.movie_id
JOIN halls h ON st.hall_id = h.hall_id
JOIN theaters t ON h.theater_id = t.theater_id
ORDER BY st.start_time ASC;
