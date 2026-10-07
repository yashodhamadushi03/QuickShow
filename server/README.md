# QuickShow Backend API 🎬🎟️

A robust, production-ready Python backend for **QuickShow**, an online cinema management and ticket reservation platform. Built with **FastAPI**, **SQLAlchemy ORM**, **PyMySQL**, **Alembic**, and **MySQL Database**.

---

## 🛠️ Features & Highlights

- **FastAPI Framework**: Asynchronous, high-performance RESTful API endpoints with auto-generated OpenAPI (`/docs`) documentation.
- **MySQL Database Integration**: Designed and compatible with **MySQL Workbench**.
- **Concurrency-Safe Ticket Booking**:
  - Uses MySQL database transactions and `SELECT ... FOR UPDATE` pessimistic locking.
  - Enforces a composite unique index `(showtime_id, seat_id)` in MySQL to strictly prevent double-booking race conditions.
- **Role-Based JWT Authentication**: Secure Customer vs. Cinema Admin access control with bcrypt password hashing.
- **Automated Ticket Dispatch**:
  - **HTML Email Ticket**: Dispatches a styled HTML entrance pass upon successful payment using SMTP.
  - **SMS Ticket Passcode**: Dispatches a text message with entry reference code via Twilio API gateway.
- **Alembic Migrations**: Fully managed schema versioning.

---

## 📁 Project Structure

```
server/
├── app/
│   ├── api/             # FastAPI Route Controllers
│   │   ├── admin.py     # Admin Movie, Theater, Hall & Showtime endpoints
│   │   ├── auth.py      # Registration, JWT Login, User Profile
│   │   ├── bookings.py  # Concurrency-Safe Seat Reservations & Payments
│   │   ├── deps.py      # Authentication & Role Authorization Dependencies
│   │   ├── movies.py    # Public Movie & Showtime Listings
│   │   ├── showtimes.py # Showtime Seat Grid & Status Layout
│   │   └── theaters.py  # Cinema Theaters & Halls Endpoints
│   ├── core/            # Configuration, Security, DB Engine
│   │   ├── config.py    # Settings using pydantic-settings
│   │   ├── database.py  # SQLAlchemy engine & SessionLocal
│   │   └── security.py  # Bcrypt & JWT management
│   ├── models/          # SQLAlchemy Relational Models
│   │   ├── booking.py   # Booking & BookingSeat (Composite Unique Constraint)
│   │   ├── movie.py     # Movie Model (Now Showing vs Coming Soon)
│   │   ├── payment.py   # Payment Transaction Records
│   │   ├── showtime.py  # Movie Showtimes
│   │   ├── theater.py   # Theater, Hall & Seat Grid Models
│   │   └── user.py      # Customer & Admin User Accounts
│   ├── schemas/         # Pydantic Request/Response Models
│   ├── services/
│   │   └── notification.py # Automated HTML Email & SMS Dispatch
│   ├── seed.py          # Database Seeder Script
│   └── main.py          # FastAPI Application Entrypoint
├── alembic/             # Database Migration Scripts
├── alembic.ini          # Alembic Configuration
├── quickshow_db.sql     # MySQL Workbench Ready SQL Schema
├── requirements.txt     # Python Dependencies
├── .env.example         # Environment Template
└── README.md            # Setup Documentation
```

---

## 🚀 Quick Setup Guide

### 1. Prerequisites
- Python 3.10+
- MySQL Server (v8.0+) & MySQL Workbench

### 2. Configure MySQL Database in MySQL Workbench
1. Open **MySQL Workbench** and connect to your MySQL Server.
2. Open the included file [`quickshow_db.sql`](file:///c:/Users/yashodha/Desktop/CAMPUS/My%20Creations/QuickShow/server/quickshow_db.sql).
3. Execute the script (⚡ icon) to create the `quickshow_db` schema, tables, foreign keys, and composite unique indexes.

Alternatively, create the database in MySQL shell:
```sql
CREATE DATABASE quickshow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Setup Virtual Environment & Dependencies
In terminal inside `server/` directory:
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and set your MySQL credentials:
```ini
MYSQL_USER="root"
MYSQL_PASSWORD="your_mysql_password"
MYSQL_DB="quickshow_db"
DATABASE_URL="mysql+pymysql://root:your_mysql_password@localhost:3306/quickshow_db"

# Optional Email (SMTP) & SMS (Twilio) Notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASSWORD="your_app_password"

TWILIO_ACCOUNT_SID="your_twilio_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+15550001111"
```

### 5. Seed Sample Data
Run the included seeder to populate sample movies, theaters, halls, seats grid (A-E x 10), showtimes, and admin/customer accounts:
```bash
python -m app.seed
```

Default Login Accounts created by Seeder:
- **Cinema Admin**: `admin@quickshow.com` | Password: `admin123`
- **Customer**: `user@quickshow.com` | Password: `user123`

### 6. Run FastAPI Server
Start Uvicorn server:
```bash
uvicorn app.main:app --reload --port 8000
```

Access the API Documentation:
- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Testing Concurrency Protection

Try sending two concurrent `POST /api/bookings` requests for the exact same `seat_ids` and `showtime_id`. The database transaction locks the requested seats and enforces `uq_showtime_seat` composite unique constraint. One request will succeed (`201 Created`), while the second request will immediately abort and return `400 Bad Request` with message: *"Seat reservation failed: Seats are already booked or locked by another transaction."*
