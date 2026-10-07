# 🎬 QuickShow LK — Advanced Online Cinema Management & Smart Multiplex Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

QuickShow LK is a production-ready, feature-complete, intelligent cinema management, ticket reservation, and smart multiplex platform built specifically for the Sri Lankan theater ecosystem. It combines dynamic scheduling, concurrency-safe seat booking, automated HTML ticket email dispatch, an AI-powered seat optimizer, and an islandwide multiplex network.

---

## 🌟 Key Features

### 🏢 1. Expanded Islandwide Sri Lankan Multiplex Network
Populated with authentic multiplexes and multi-category films across Sri Lanka:
- **Colombo & Suburbs**: 
  - Scope Cinemas (Colombo City Centre & Havelock City Mall with IMAX)
  - Liberty by Scope Cinemas (Colpetty)
  - Savoy 3D Dolby Atmos (Wellawatte)
  - PVR Cinemas (One Galle Face)
- **Regional Hubs**:
  - Regal Cinema (Jaffna & Gampaha)
  - Imperial 3D Cinema (Kurunegala)
  - Sky Lite 3D Cinema (Matara)
  - Regal Cinema (Nuwara Eliya)
- Multi-language blockbusters in **English**, **Sinhala**, **Tamil**, and **Hindi**.

---

### 🎟️ 2. Real-Time Scheduling & Concurrency-Safe Booking Core
- **Dynamic Scheduling Engine**: Generates daily morning, afternoon, evening, and night showtimes dynamically relative to real-time clock operations.
- **Pessimistic Locking & Unique Constraint**: Implements `POST /api/bookings` inside a MySQL transaction utilizing `SELECT ... FOR UPDATE` and a strict composite unique index `uq_showtime_seat(showtime_id, seat_id)` to prevent double bookings.
- **Interactive 96-Seat Matrix**: 8 Rows (A–H) $\times$ 12 Seats with VIP Recliners (Rows G & H), live seat lock indicators, and price auto-calculators (in LKR).

---

### 📧 3. Automated Entrance Pass & Email Ticket Dispatch
- **HTML Ticket Email Dispatch**: Direct integration with SMTP using verified Gmail App Passwords to deliver rich HTML entrance tickets with movie details, venue info, showtime, selected seats, and entry passcodes (e.g. `TXN-LK8F92A1`).
- **SMS Passcode Simulation**: Automatically generates SMS ticket alerts for guest or registered mobile numbers.

---

### 🧠 4. Next-Gen Smart Features
- **AI Smart Seat Optimizer**: Algorithmic "Best Seats in the House" helper (`scikit-learn` center-acoustic sweet-spot detector) that auto-recommends optimal seats (Rows D, E, F center).
- **Floating AI Cinema Assistant Chatbot**: 24/7 interactive concierge supporting ticket inquiries, showtimes, concessions, and theater locations.
- **Digital Wallet & Group Split Payments**: One-click generation of Apple/Google Wallet pass data and shareable group split payment links.
- **Concession Pre-Ordering (F&B)**: Snack/beverage combos (popcorn, nachos, drinks) bundled into the booking cart.
- **Live Clock & Search Modal**: Real-time clock (`HH:MM:SS AM/PM`) header badge and instant live movie search overlay.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, PyMySQL, MySQL 8.0, Scikit-Learn, Alembic, uvicorn
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, HeroIcons, React Hot Toast, Clerk Auth
- **Database**: MySQL Server (Database: `quickshow_db`)

---

## 📁 Project Structure

```
QuickShow/
├── server/                    # FastAPI Backend Engine
│   ├── app/
│   │   ├── api/               # API Router endpoints (bookings, movies, showtimes, theaters)
│   │   ├── core/              # Config, Security, Database sessions
│   │   ├── models/            # SQLAlchemy Data Models (User, Movie, Theater, Hall, Seat, Showtime, Booking)
│   │   ├── schemas/           # Pydantic Schemas & DTOs
│   │   ├── services/          # Notification Service (SMTP Email & SMS), AI Recommendation Engine
│   │   └── seed.py            # Database Seed script for Sri Lanka multiplexes & movies
│   ├── alembic/               # Database Migration scripts
│   ├── quickshow_db.sql       # Standalone MySQL dump & schema file
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables (MySQL DB URL, SMTP credentials)
│
├── client/                    # React + Vite Frontend
│   ├── src/
│   │   ├── components/        # Navbar (with Live Clock & Search), Footer, Chatbot, MovieCard, DateSelect
│   │   ├── pages/             # Home, Movies, MovieDetails, SeatLayout, Theaters, Releases, MyBookings
│   │   ├── assets/            # Static assets & images
│   │   └── App.jsx            # Application Router & Layout
│   └── package.json           # Frontend Node.js dependencies
└── README.md                  # Project Documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+ installed
- Node.js 18+ & npm installed
- MySQL Server 8.0+ running locally (or via MySQL Workbench / XAMPP)

---

### Step 1: Database Setup (MySQL)
1. Open MySQL Workbench or MySQL CLI.
2. Create the database:
   ```sql
   CREATE DATABASE quickshow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. (Optional) Import pre-packaged schema and seed data from `server/quickshow_db.sql`:
   ```bash
   mysql -u root -p quickshow_db < server/quickshow_db.sql
   ```

---

### Step 2: Backend Setup (FastAPI)
1. Navigate to the `server` folder:
   ```bash
   cd server
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   ```
3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify environment configuration in `server/.env`:
   ```env
   DATABASE_URL=mysql+pymysql://root:password@localhost:3306/quickshow_db
   SMTP_USER=yashodhamadushi03@gmail.com
   SMTP_PASSWORD=xqmgnjpgamwrcpxv
   EMAILS_FROM=yashodhamadushi03@gmail.com
   ```
5. Seed the database with Sri Lankan theaters, movies, halls, and showtimes:
   ```bash
   python -m app.seed
   ```
6. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *Swagger API Documentation will be available at:* `http://localhost:8000/docs`

---

### Step 3: Frontend Setup (React + Vite)
1. Open a new terminal and navigate to the `client` folder:
   ```bash
   cd client
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## 📧 Email Notification Verification
To test live HTML email ticket delivery:
1. Navigate to `http://localhost:5173/movies`.
2. Pick any movie (e.g. *Avatar: The Way of Water*, *Dune: Part Two*, or *Kandak Sema*).
3. Click **Buy Tickets** $\rightarrow$ Choose a showtime date $\rightarrow$ Click **Select Seats & Book**.
4. Select seats on the 96-seat matrix (or click `✨ Best Seats`).
5. Enter your email address (e.g. `yashodhamadushi03@gmail.com`).
6. Click **Reserve & Send Email Pass**.
7. Check your email inbox to view the HTML Entrance Ticket Pass!

---

## 📜 License
This project is developed for educational and demonstration purposes. Built with ❤️ for Sri Lankan Cinema Fans!
