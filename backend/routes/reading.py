from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
import aiofiles
import os
import uuid

from database import get_db
import models
import schemas
import auth as auth_utils
from services import milestones as milestone_svc
from services.garden import compute_risk_score
from services.ai import generate_nudge

router = APIRouter(prefix="/reading", tags=["reading"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/session", response_model=schemas.ReadingSessionOut)
def log_session(
    body: schemas.ReadingSessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    session_date = body.date or date.today()
    activity_type = body.activity_type or "reading"

    # Prevent duplicate sessions on same day
    existing = (
        db.query(models.ReadingSession)
        .filter(
            models.ReadingSession.user_id == current_user.id,
            models.ReadingSession.date == session_date,
            models.ReadingSession.activity_type == activity_type,
        )
        .first()
    )
    if existing:
        # Merge into existing session
        existing.verses_read += body.verses_read
        existing.minutes_spent += body.minutes_spent
        db.commit()
        db.refresh(existing)
        _update_user_stats(current_user, body.verses_read, body.minutes_spent, session_date, db)
        return existing

    session = models.ReadingSession(
        user_id=current_user.id,
        date=session_date,
        activity_type=activity_type,
        verses_read=body.verses_read,
        minutes_spent=body.minutes_spent,
        surah_number=body.surah_number,
        ayah_start=body.ayah_start,
        ayah_end=body.ayah_end,
        notes=body.notes,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    _update_user_stats(current_user, body.verses_read, body.minutes_spent, session_date, db)

    # Award first session milestone
    if current_user.total_verses_read == body.verses_read:
        _award_first_session(current_user, db)

    milestone_svc.check_and_award(current_user, db)
    return session


@router.post("/session/{session_id}/photo", response_model=schemas.ReadingSessionOut)
async def upload_accountability_photo(
    session_id: int,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    session = db.query(models.ReadingSession).filter(
        models.ReadingSession.id == session_id,
        models.ReadingSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save photo
    ext = os.path.splitext(photo.filename or "photo.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(await photo.read())

    session.photo_path = f"/uploads/{filename}"
    db.commit()
    db.refresh(session)

    # Award first photo milestone
    _maybe_award_first_photo(current_user, db)

    return session


@router.get("/sessions", response_model=List[schemas.ReadingSessionOut])
def get_sessions(
    limit: int = 30,
    activity_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    query = db.query(models.ReadingSession).filter(models.ReadingSession.user_id == current_user.id)
    if activity_type in {"reading", "recitation", "memorization"}:
        query = query.filter(models.ReadingSession.activity_type == activity_type)

    return query.order_by(models.ReadingSession.date.desc()).limit(limit).all()


@router.get("/streak")
def get_streak(
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    return {
        "streak_count": current_user.streak_count,
        "longest_streak": current_user.longest_streak,
        "last_reading_date": current_user.last_reading_date,
    }


@router.get("/engagement", response_model=schemas.EngagementStatus)
async def get_engagement(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    today = date.today()
    last = current_user.last_reading_date
    days_since = (today - last).days if last else 999

    # Average verses in last 7 days vs previous 7 days
    def avg_verses(days_ago_start: int, days_ago_end: int) -> float:
        start = today - timedelta(days=days_ago_start)
        end = today - timedelta(days=days_ago_end)
        result = db.query(func.avg(models.ReadingSession.verses_read)).filter(
            models.ReadingSession.user_id == current_user.id,
            models.ReadingSession.date >= end,
            models.ReadingSession.date <= start,
        ).scalar()
        return float(result or 0)

    avg_7d = avg_verses(7, 0)
    avg_prev_7d = avg_verses(14, 7)

    risk_score, risk_level, trend = compute_risk_score(days_since, avg_7d, avg_prev_7d)

    try:
        if risk_level in ("medium", "high"):
            nudge = await generate_nudge(
                current_user.username, days_since, current_user.longest_streak, current_user.total_verses_read
            )
        else:
            nudge = f"MashaAllah {current_user.username}! You're doing great. Keep your streak going!"
    except Exception:
        nudge = f"Your garden is waiting for you, {current_user.username}. Come back and let it bloom."

    return schemas.EngagementStatus(
        risk_score=risk_score,
        risk_level=risk_level,
        days_since_last_read=days_since,
        avg_verses_7d=round(avg_7d, 1),
        trend=trend,
        nudge_message=nudge,
    )


# ── Helpers ────────────────────────────────────────────────────────────────────

def _update_user_stats(user, verses: int, minutes: float, session_date: date, db: Session):
    user.total_verses_read = (user.total_verses_read or 0) + verses
    user.total_minutes_read = (user.total_minutes_read or 0) + minutes

    today = date.today()
    last = user.last_reading_date

    if last is None:
        user.streak_count = 1
    elif session_date == last:
        pass  # same day, no streak change
    elif (session_date - last).days == 1:
        user.streak_count = (user.streak_count or 0) + 1
    else:
        user.streak_count = 1  # streak broken

    user.last_reading_date = session_date
    user.longest_streak = max(user.longest_streak or 0, user.streak_count or 0)
    db.commit()


def _award_first_session(user: models.User, db: Session):
    existing = db.query(models.Milestone).filter(
        models.Milestone.user_id == user.id,
        models.Milestone.milestone_type == models.MilestoneType.first_session,
    ).first()
    if not existing:
        db.add(models.Milestone(user_id=user.id, milestone_type=models.MilestoneType.first_session))
        db.commit()


def _maybe_award_first_photo(user: models.User, db: Session):
    existing = db.query(models.Milestone).filter(
        models.Milestone.user_id == user.id,
        models.Milestone.milestone_type == models.MilestoneType.first_photo,
    ).first()
    if not existing:
        db.add(models.Milestone(user_id=user.id, milestone_type=models.MilestoneType.first_photo))
        db.commit()
