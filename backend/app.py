from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

load_dotenv()

from database import engine, Base
import models  # ensure all models are registered

Base.metadata.create_all(bind=engine)


def _ensure_user_profile_columns():
    required_columns = {
        "profile_photo_path": "VARCHAR",
        "bio": "TEXT",
        "country": "VARCHAR",
        "current_hifd": "VARCHAR",
        "current_hifd_last_activity": "DATE",
    }
    with engine.begin() as conn:
        existing = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(users)")}
        for column_name, column_type in required_columns.items():
            if column_name not in existing:
                conn.exec_driver_sql(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}")


_ensure_user_profile_columns()


def _ensure_interpretation_review_columns():
    required_columns = {
        "review_count": "INTEGER",
        "last_reviewed_at": "DATETIME",
        "next_review_at": "DATETIME",
    }
    with engine.begin() as conn:
        existing = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(interpretations)")}
        for column_name, column_type in required_columns.items():
            if column_name not in existing:
                conn.exec_driver_sql(f"ALTER TABLE interpretations ADD COLUMN {column_name} {column_type}")


_ensure_interpretation_review_columns()

from routes import auth, reading, verses, garden, buddies, milestones

app = FastAPI(
    title="Bloom — Quran Engagement API",
    description="Backend for the Bloom app: daily Quran reading, 3D garden, buddy matching, and AI-powered tafsir.",
    version="1.0.0",
)

# Configure CORS for Vercel frontend + localhost development
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite dev
    os.getenv("FRONTEND_URL", "https://your-vercel-app.vercel.app"),  # Set via env
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded accountability photos
uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(auth.router,       prefix="/api")
app.include_router(reading.router,    prefix="/api")
app.include_router(verses.router,     prefix="/api")
app.include_router(garden.router,     prefix="/api")
app.include_router(buddies.router,    prefix="/api")
app.include_router(milestones.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "app": "Bloom"}
