-- ============================================================================
-- QuickShow Cinema Management & Ticket Reservation Platform
-- Database Schema Script for MySQL Workbench
-- Engine: InnoDB | Character Set: utf8mb4
-- ============================================================================

CREATE DATABASE IF NOT EXISTS quickshow_db 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE quickshow_db;

-- ----------------------------------------------------------------------------
-- 1. Users Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Movies Table
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 3. Theaters Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS theaters (
    theater_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    INDEX idx_theaters_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. Halls Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS halls (
    hall_id INT AUTO_INCREMENT PRIMARY KEY,
    theater_id INT NOT NULL,
    hall_name VARCHAR(100) NOT NULL,
    total_capacity INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_halls_theater FOREIGN KEY (theater_id) 
        REFERENCES theaters (theater_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Seats Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seats (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    hall_id INT NOT NULL,
    row_label VARCHAR(10) NOT NULL,
    seat_number INT NOT NULL,
    seat_type VARCHAR(30) NOT NULL DEFAULT 'Regular',
    CONSTRAINT fk_seats_hall FOREIGN KEY (hall_id) 
        REFERENCES halls (hall_id) ON DELETE CASCADE,
    CONSTRAINT uq_hall_row_seat UNIQUE (hall_id, row_label, seat_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Showtimes Table
-- ----------------------------------------------------------------------------
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
    INDEX idx_showtimes_movie_start (movie_id, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. Bookings Table
-- ----------------------------------------------------------------------------
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
        REFERENCES showtimes (showtime_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. Booking Seats (Junction Table)
-- * Crucial Constraint: Unique Index on (showtime_id, seat_id) strictly prevents
-- double booking of the same seat for the same showtime at the database level!
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 9. Payments Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status ENUM('Success', 'Failed', 'Pending') NOT NULL DEFAULT 'Pending',
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) 
        REFERENCES bookings (booking_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
