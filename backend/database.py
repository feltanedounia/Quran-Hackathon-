import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Use an absolute path so the DB is always created next to this file,
# regardless of which directory uvicorn is launched from.
_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "quran_app.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{_DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
