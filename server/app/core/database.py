from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator
from app.core.config import settings

db_url = settings.get_database_url()

try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=False
    )
    # Quick probe connection to verify MySQL availability
    with engine.connect() as conn:
        pass
except Exception as e:
    print(f"[DB WARN] MySQL connection unavailable ({e}). Using local SQLite database fallback.")
    db_url = "sqlite:///./quickshow.db"
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator:
    """FastAPI Dependency for Database Session Management"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

