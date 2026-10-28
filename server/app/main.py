from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.api import auth, movies, showtimes, theaters, bookings, admin, fb_orders, favourites

# Automatically inspect, create missing tables/columns, and sync schema without data loss
try:
    from sync_database import sync_database
    sync_database()
except Exception as e:
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as inner_e:
        print(f"[Warning] Auto table creation skipped: {inner_e}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(movies.router, prefix=settings.API_V1_STR)
app.include_router(showtimes.router, prefix=settings.API_V1_STR)
app.include_router(theaters.router, prefix=settings.API_V1_STR)
app.include_router(bookings.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(fb_orders.router, prefix=settings.API_V1_STR)
app.include_router(favourites.router, prefix=settings.API_V1_STR)



@app.get("/")
def root():
    return {
        "message": "Welcome to QuickShow Cinema Ticket Reservation API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get(f"{settings.API_V1_STR}/health")
def healthcheck():
    return {"status": "ok", "service": "QuickShow Backend API"}
