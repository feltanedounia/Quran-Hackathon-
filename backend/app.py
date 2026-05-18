from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

load_dotenv()

from database import engine, Base
import models  # ensure all models are registered

Base.metadata.create_all(bind=engine)


def _get_existing_columns(conn, table_name: str) -> set:
    db_url = str(engine.url)
    if "sqlite" in db_url:
        rows = conn.exec_driver_sql(f"PRAGMA table_info({table_name})")
        return {row[1] for row in rows}
    else:
        rows = conn.exec_driver_sql(
            "SELECT column_name FROM information_schema.columns WHERE table_name = :t",
            {"t": table_name},
        )
        return {row[0] for row in rows}


def _ensure_user_profile_columns():
    required_columns = {
        "profile_photo_path": "VARCHAR",
        "bio": "TEXT",
        "country": "VARCHAR",
        "current_hifd": "VARCHAR",
        "current_hifd_last_activity": "DATE",
    }
    with engine.begin() as conn:
        existing = _get_existing_columns(conn, "users")
        for column_name, column_type in required_columns.items():
            if column_name not in existing:
                conn.exec_driver_sql(
                    f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"
                )


_ensure_user_profile_columns()


def _ensure_interpretation_review_columns():
    required_columns = {
        "review_count": "INTEGER",
        "last_reviewed_at": "DATETIME",
        "next_review_at": "DATETIME",
    }
    with engine.begin() as conn:
        existing = _get_existing_columns(conn, "interpretations")
        for column_name, column_type in required_columns.items():
            if column_name not in existing:
                conn.exec_driver_sql(
                    f"ALTER TABLE interpretations ADD COLUMN {column_name} {column_type}"
                )


_ensure_interpretation_review_columns()


def _ensure_user_qf_columns():
    qf_columns = {
        "qf_access_token": "TEXT",
        "qf_refresh_token": "TEXT",
    }
    with engine.begin() as conn:
        existing = _get_existing_columns(conn, "users")
        for col, typ in qf_columns.items():
            if col not in existing:
                conn.exec_driver_sql(
                    f"ALTER TABLE users ADD COLUMN {col} {typ}"
                )


_ensure_user_qf_columns()


from routes import auth, reading, verses, garden, buddies, milestones, bookmarks


SECRET_KEY = os.getenv("SECRET_KEY")

app = FastAPI(
    title="Bloom — Quran Engagement API",
    description="Backend for the Bloom app: daily Quran reading, 3D garden, buddy matching, and AI-powered tafsir.",
    version="1.0.0",
)

# FIXED CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://rawdah-quran-hackathon-project-81v3-4aau5ppht.vercel.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Routes
app.include_router(auth.router, prefix="/api")
app.include_router(reading.router, prefix="/api")
app.include_router(verses.router, prefix="/api")
app.include_router(garden.router, prefix="/api")
app.include_router(buddies.router, prefix="/api")
app.include_router(milestones.router, prefix="/api")
app.include_router(bookmarks.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "app": "Bloom"}
