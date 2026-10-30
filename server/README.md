# 🎬 QuickShow Backend API — FastAPI & TiDB Cloud

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live_API-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://quickshow-backend-plum.vercel.app/docs)
[![TiDB Cloud](https://img.shields.io/badge/TiDB_Cloud-MySQL_Serverless-E60000?style=for-the-badge&logo=mysql&logoColor=white)](https://tidbcloud.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-ORM-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

Production RESTful backend API for **QuickShow**, deployed as a serverless application on **Vercel** and powered by a distributed **TiDB Cloud Serverless MySQL** database cluster.

---

## 🌐 Live Production Endpoints

- **Live Base URL:** **[https://quickshow-backend-plum.vercel.app](https://quickshow-backend-plum.vercel.app)**
- **Interactive Swagger Documentation:** **[https://quickshow-backend-plum.vercel.app/docs](https://quickshow-backend-plum.vercel.app/docs)**
- **ReDoc API Documentation:** **[https://quickshow-backend-plum.vercel.app/redoc](https://quickshow-backend-plum.vercel.app/redoc)**
- **OpenAPI Schema:** `https://quickshow-backend-plum.vercel.app/api/openapi.json`

---

## 🛠️ Features & Architecture

- **Serverless FastAPI**: Optimized for low-latency serverless execution on Vercel's Fluid compute platform.
- **TiDB Cloud MySQL**: Distributed, serverless MySQL 8.0-compatible database located in AWS Singapore (`ap-southeast-1`), with automated TLS/SSL verification.
- **Connection Resilience**: SQLAlchemy engine configured with `pool_pre_ping=True` and `pool_recycle=300` to prevent socket timeouts across cloud gateways.
- **Concurrency-Safe Bookings**: Pessimistic database locking (`SELECT ... FOR UPDATE`) and composite unique constraints (`uq_showtime_seat`) preventing double bookings.
- **Database Views**:
  - `vw_active_bookings`: Consolidated view joining bookings, customers, showtimes, movies, and theaters.
  - `vw_movie_analytics`: Live box office aggregations per movie (total tickets, revenue in LKR, average booking value).

---

## ⚙️ Environment Variables

Configure these in `server/.env` (or in Vercel project environment variables):

```env
# TiDB Cloud MySQL Connection URL
DATABASE_URL=mysql+pymysql://6xAdRhFkJrPN6Ad.root:FvL1SHud1J7yEI96@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/quickshowDB?ssl_verify_cert=true&ssl_verify_identity=true

# Security Key for JWT Authentication
SECRET_KEY=quickshow_jwt_secret_key_production_ready_2026_super_secure
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yashodhamadushi03@gmail.com
SMTP_PASSWORD=xqmgnjpgamwrcpxv
EMAILS_FROM=yashodhamadushi03@gmail.com
```

---

## 💻 Local Development & Database Sync

```bash
# 1. Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows
source venv/bin/activate  # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Synchronize database schema and inspect tables
python sync_database.py

# 4. Start local development server
uvicorn app.main:app --reload --port 8000
```

---

## ☁️ Vercel Deployment Settings

- **Application Preset**: `FastAPI`
- **Root Directory**: `server`
- **Entrypoint**: `main.py` (auto-detected)
- **Dependencies**: `requirements.txt` (auto-installed)
