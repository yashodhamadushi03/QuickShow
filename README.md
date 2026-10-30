# 🎬 QuickShow LK — Advanced Online Cinema Management & Ticket Reservation Platform

[![Vercel Frontend](https://img.shields.io/badge/Vercel-Frontend_Live-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://quickshow-frontend-kappa.vercel.app)
[![Vercel Backend](https://img.shields.io/badge/Vercel-Backend_API-000000?style=for-the-badge&logo=fastapi&logoColor=white)](https://quickshow-backend-plum.vercel.app/docs)
[![TiDB Cloud](https://img.shields.io/badge/TiDB_Cloud-MySQL_Serverless-E60000?style=for-the-badge&logo=mysql&logoColor=white)](https://tidbcloud.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> [!IMPORTANT]
> ### 🚀 Live Application: [https://quickshow-frontend-kappa.vercel.app](https://quickshow-frontend-kappa.vercel.app)
> Access the live cinema booking platform, interactive seat reservation system, and admin dashboard.

QuickShow LK is a feature-complete, cloud-native cinema management, ticket reservation, and smart multiplex platform built specifically for the Sri Lankan theater ecosystem. It combines dynamic scheduling, concurrency-safe seat booking with database transactions, automated entrance ticket dispatches, an interactive seat selection matrix, and an islandwide multiplex network.

---

## 🌐 Live Production Deployments

> ### 🌟 **Live Platform Access**
> **Experience the live QuickShow application and admin portal:**
> 
> ### 👉 **[https://quickshow-frontend-kappa.vercel.app](https://quickshow-frontend-kappa.vercel.app)** 👈
> 
> [![View Live QuickShow Application](https://img.shields.io/badge/%F0%9F%9A%80%20View%20Live%20QuickShow%20Application-Visit%20Platform-E50914?style=for-the-badge&logo=vercel&logoColor=white)](https://quickshow-frontend-kappa.vercel.app)
> [![Interactive API Swagger Docs](https://img.shields.io/badge/%F0%9F%93%96%20Interactive%20API%20Documentation-Swagger%20UI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://quickshow-backend-plum.vercel.app/docs)

Both the Frontend and Backend applications are live in production on **Vercel**, backed by a high-availability **TiDB Cloud Serverless MySQL** database cluster:

| Component | Platform | Live URL / Endpoint | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Application** | Vercel Edge Network | **[https://quickshow-frontend-kappa.vercel.app](https://quickshow-frontend-kappa.vercel.app)** | ![Active](https://img.shields.io/badge/Status-Live-brightgreen) |
| **Backend REST API** | Vercel Serverless Functions | **[https://quickshow-backend-plum.vercel.app](https://quickshow-backend-plum.vercel.app)** | ![Active](https://img.shields.io/badge/Status-Live-brightgreen) |
| **Interactive API Docs (Swagger)** | FastAPI OpenAPI | **[https://quickshow-backend-plum.vercel.app/docs](https://quickshow-backend-plum.vercel.app/docs)** | ![Active](https://img.shields.io/badge/Docs-Swagger_UI-blue) |
| **Alternative API Docs (ReDoc)** | FastAPI ReDoc | **[https://quickshow-backend-plum.vercel.app/redoc](https://quickshow-backend-plum.vercel.app/redoc)** | ![Active](https://img.shields.io/badge/Docs-ReDoc-purple) |
| **Production Database** | TiDB Cloud (AWS Singapore) | `gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/quickshowDB` | ![Active](https://img.shields.io/badge/MySQL-TiDB_Cloud-red) |

---

## 🌟 Key Features

### 🏢 1. Expanded Islandwide Sri Lankan Multiplex Network
Configured with authentic multiplexes and multi-category films across Sri Lanka:
- **Scope Cinemas Multiplex - CCC** (Colombo City Centre)
- **Savoy 3D Cinema** (Wellawatte, Colombo 06)
- **PVR Cinemas - One Galle Face** (Colombo 01)
- **Kandy City Centre Cinema** (Dalada Veediya, Kandy)
- Multi-language blockbusters in **English**, **Sinhala**, **Tamil**, and **Hindi**.

---

### 🎟️ 2. Concurrency-Safe Booking Core & Pessimistic Locking
- **Zero Double-Bookings**: Seat reservation (`POST /api/bookings`) utilizes SQLAlchemy transactions, `SELECT ... FOR UPDATE` row locks, and strict composite unique constraint `uq_showtime_seat(showtime_id, seat_id)`.
- **Interactive Seat Matrix**: VIP recliners, regular seats, real-time availability states, and dynamic pricing calculation (in LKR).
- **User-Specific Isolation**: Favourites, user bookings, digital tickets, and order histories are strictly isolated per authenticated user ID.

---

### 📧 3. Automated Entrance Pass & Email Ticket Dispatch
- **HTML Ticket Dispatch**: Direct integration with SMTP to generate rich HTML tickets containing movie details, theater venue, showtime, seat labels, and transaction references (`TXN-XXXXXXXX`).
- **Food & Beverage (F&B) Concessions**: Bundled snacks (popcorn, nachos, beverages) ordered concurrently with cinema tickets.
- **Digital Tickets**: Real-time downloadable and printable admission passes with barcode representations.

---

### 🤖 4. Intelligent Cinema Tools & Admin Engine
- **Admin Showtime Engine**: Realistic cinema scheduling configured for Sri Lankan release slots (10:00 AM, 01:00 PM, 04:00 PM, 07:15 PM, 10:15 PM) with automatic end-time calculation based on movie runtimes.
- **Cinema Analytics View**: Synchronized database view `vw_movie_analytics` aggregating ticket volume and revenue per movie.
- **Active Bookings View**: Synchronized database view `vw_active_bookings` for live islandwide box office monitoring.

---

## 🛠️ Architecture & Tech Stack

```
┌─────────────────────────────────┐
│     QuickShow React Frontend    │
│  (React 19 + Vite + Tailwind)   │
│   https://quickshow-frontend    │
└────────────────┬────────────────┘
                 │ HTTPS (JSON API)
                 ▼
┌─────────────────────────────────┐
│     QuickShow FastAPI Backend   │
│  (Vercel Serverless Function)   │
│   https://quickshow-backend     │
└────────────────┬────────────────┘
                 │ TLS / SSL (Port 4000)
                 ▼
┌─────────────────────────────────┐
│       TiDB Cloud Database       │
│  (Distributed MySQL Serverless) │
│   AWS ap-southeast-1 Singapore  │
└─────────────────────────────────┘
```

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Clerk Authentication, React Router v7.
- **Backend**: Python 3.11, FastAPI, SQLAlchemy ORM, PyMySQL, Pydantic v2.
- **Database**: TiDB Cloud Serverless MySQL (compatible with MySQL 8.0 & MySQL Workbench).
- **Hosting**: Vercel (Edge CDN for Frontend, Fluid Serverless Compute for FastAPI Backend).

---

## 📁 Repository Structure

```
QuickShow/
├── server/                    # FastAPI Backend Application
│   ├── app/
│   │   ├── api/               # API route controllers (bookings, movies, showtimes, admin, etc.)
│   │   ├── core/              # Config, Security (JWT/bcrypt), Database engine
│   │   ├── models/            # SQLAlchemy Relational Models (User, Movie, Theater, Booking, etc.)
│   │   ├── schemas/           # Pydantic validation schemas
│   │   └── services/          # Concession orders & Notification services
│   ├── api/                   # Vercel serverless function entrypoint
│   ├── main.py                # Root application entrypoint (FastAPI app)
│   ├── sync_database.py       # Non-destructive schema synchronizer & migration utility
│   ├── migrate_db.py          # PyMySQL database migration script
│   ├── quickshow_db.sql       # Master schema and seed SQL script
│   ├── requirements.txt       # Python backend dependencies
│   ├── .env                   # Local backend environment variables
│   └── .env.example           # Backend environment template
│
├── client/                    # React + Vite Frontend Application
│   ├── src/
│   │   ├── components/        # UI components (Navbar, MovieCard, Chatbot, SeatGrid, Modals)
│   │   ├── pages/             # Pages (Home, Movies, MovieDetails, SeatLayout, AdminDashboard)
│   │   ├── assets/            # Static media and brand assets
│   │   └── config.js          # API base URL configuration
│   ├── vercel.json            # Vercel SPA routing configuration
│   ├── package.json           # Frontend dependencies
│   ├── .env                   # Local frontend environment variables
│   └── .env.example           # Frontend environment template
│
└── README.md                  # Master Project Documentation
```

---

## 🚀 Cloud Deployment Instructions (Vercel)

### 1. Backend Deployment on Vercel
1. Import repository `yashodhamadushi03/QuickShow` into Vercel.
2. Select **Root Directory:** `server`.
3. Set **Application Preset:** `FastAPI`.
4. Configure Environment Variables:
   - `DATABASE_URL`: `mysql+pymysql://6xAdRhFkJrPN6Ad.root:FvL1SHud1J7yEI96@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/quickshowDB?ssl_verify_cert=true&ssl_verify_identity=true`
   - `SECRET_KEY`: `quickshow_jwt_secret_key_production_ready_2026_super_secure`
5. Click **Deploy**. The backend goes live at `https://quickshow-backend-plum.vercel.app`.

### 2. Frontend Deployment on Vercel
1. In Vercel, click **"Add New..." → "Project"** and import `QuickShow`.
2. Select **Root Directory:** `client`.
3. Set **Framework Preset:** `Vite` *(auto-detected)*.
4. Configure Environment Variables:
   - `VITE_API_BASE_URL`: `https://quickshow-backend-plum.vercel.app/api`
   - `VITE_CLERK_PUBLISHABLE_KEY`: *(Your Clerk key from `client/.env`)*
5. Click **Deploy**. The frontend goes live at `https://quickshow-frontend-kappa.vercel.app`.

---

## 💻 Local Development Setup

### Prerequisites
- Python 3.10 or 3.11
- Node.js 18+ and npm
- Access to TiDB Cloud or local MySQL Server 8.0+

### Backend Setup
```bash
cd server
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python sync_database.py
uvicorn app.main:app --reload --port 8000
```
API Documentation: `http://localhost:8000/docs`

### Frontend Setup
```bash
cd client
npm install
npm run dev
```
Application: `http://localhost:5173`

---

## 🔒 Security & Data Integrity
- **Database Connection Pooling**: Configured with `pool_pre_ping=True` and `pool_recycle=300` to maintain responsive connections over cloud gateways.
- **TLS/SSL Encryption**: Full SSL verification enabled via `ssl_verify_cert=true&ssl_verify_identity=true`.
- **Password Security**: Strong hashing enforced with `bcrypt==4.0.1`.
- **JWT Authentication**: Role-based access control protecting administrative and user-isolated endpoints.

---

## 📜 License
Developed for educational, university evaluation, and demonstration purposes. Built with ❤️ for Sri Lankan cinema patrons!
