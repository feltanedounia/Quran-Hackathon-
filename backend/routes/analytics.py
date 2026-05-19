from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import json

from database import get_db
import models
import auth as auth_utils

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/event")
def log_event(
    body: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    event = models.AnalyticsEvent(
        user_id=current_user.id,
        event_type=body.get("event_type", "unknown"),
        event_data=json.dumps(body.get("event_data")) if body.get("event_data") else None,
    )
    db.add(event)
    db.commit()
    return {"ok": True}


@router.get("/metrics")
def get_metrics(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth_utils.get_current_user),
):
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    two_weeks_ago = today - timedelta(days=14)

    total_users = db.query(func.count(models.User.id)).scalar() or 0

    dau = (
        db.query(func.count(func.distinct(models.ReadingSession.user_id)))
        .filter(models.ReadingSession.date == today)
        .scalar() or 0
    )
    wau = (
        db.query(func.count(func.distinct(models.ReadingSession.user_id)))
        .filter(models.ReadingSession.date >= week_ago)
        .scalar() or 0
    )
    mau = (
        db.query(func.count(func.distinct(models.ReadingSession.user_id)))
        .filter(models.ReadingSession.date >= month_ago)
        .scalar() or 0
    )

    total_sessions = db.query(func.count(models.ReadingSession.id)).scalar() or 0
    total_verses = db.query(func.sum(models.ReadingSession.verses_read)).scalar() or 0
    total_minutes = db.query(func.sum(models.ReadingSession.minutes_spent)).scalar() or 0

    avg_duration = db.query(func.avg(models.ReadingSession.minutes_spent)).scalar() or 0
    avg_verses = db.query(func.avg(models.ReadingSession.verses_read)).scalar() or 0

    # Sessions per user per week (last 7 days)
    sessions_last_week = (
        db.query(func.count(models.ReadingSession.id))
        .filter(models.ReadingSession.date >= week_ago)
        .scalar() or 0
    )
    avg_sessions_per_user_week = round(sessions_last_week / wau, 1) if wau else 0

    # Streak stats
    max_streak = db.query(func.max(models.User.streak_count)).scalar() or 0
    avg_streak = db.query(func.avg(models.User.streak_count)).scalar() or 0

    # Users with streak ≥ 7 / 30
    streak_7 = (
        db.query(func.count(models.User.id)).filter(models.User.streak_count >= 7).scalar() or 0
    )
    streak_30 = (
        db.query(func.count(models.User.id)).filter(models.User.streak_count >= 30).scalar() or 0
    )

    # At-risk: inactive 14+ days
    at_risk = (
        db.query(func.count(models.User.id))
        .filter(
            models.User.last_reading_date < two_weeks_ago,
            models.User.last_reading_date.isnot(None),
        )
        .scalar() or 0
    )

    # Total bookmarks and reflections
    total_bookmarks = db.query(func.count(models.Bookmark.id)).scalar() or 0
    total_reflections = db.query(func.count(models.Interpretation.id)).scalar() or 0

    # Milestone breakdown
    milestone_rows = (
        db.query(models.Milestone.milestone_type, func.count(models.Milestone.id))
        .group_by(models.Milestone.milestone_type)
        .all()
    )
    milestones = {str(r[0].value): r[1] for r in milestone_rows}

    # Top surahs read
    top_surah_rows = (
        db.query(
            models.ReadingSession.surah_number,
            func.count(models.ReadingSession.id).label("cnt"),
        )
        .filter(models.ReadingSession.surah_number.isnot(None))
        .group_by(models.ReadingSession.surah_number)
        .order_by(func.count(models.ReadingSession.id).desc())
        .limit(10)
        .all()
    )
    top_surahs = [{"surah": r[0], "count": r[1]} for r in top_surah_rows]

    # Sessions per day (last 14 days) for sparkline
    daily_rows = (
        db.query(models.ReadingSession.date, func.count(models.ReadingSession.id))
        .filter(models.ReadingSession.date >= today - timedelta(days=13))
        .group_by(models.ReadingSession.date)
        .order_by(models.ReadingSession.date)
        .all()
    )
    daily_sessions = {str(r[0]): r[1] for r in daily_rows}

    # Recent analytics events breakdown
    event_rows = (
        db.query(models.AnalyticsEvent.event_type, func.count(models.AnalyticsEvent.id))
        .group_by(models.AnalyticsEvent.event_type)
        .all()
    )
    events = {r[0]: r[1] for r in event_rows}

    return {
        "users": {
            "total": total_users,
            "dau": dau,
            "wau": wau,
            "mau": mau,
            "stickiness_pct": round(dau / mau * 100, 1) if mau else 0,
            "at_risk": at_risk,
            "churn_rate_pct": round(at_risk / total_users * 100, 1) if total_users else 0,
            "streak_7_plus": streak_7,
            "streak_30_plus": streak_30,
        },
        "sessions": {
            "total": total_sessions,
            "avg_duration_min": round(float(avg_duration), 1),
            "avg_verses": round(float(avg_verses), 1),
            "avg_per_user_per_week": avg_sessions_per_user_week,
            "total_verses": int(total_verses),
            "total_hours": round(float(total_minutes) / 60, 1),
        },
        "streaks": {
            "max": max_streak,
            "avg": round(float(avg_streak), 1),
        },
        "engagement": {
            "total_bookmarks": total_bookmarks,
            "total_reflections": total_reflections,
            "milestones": milestones,
        },
        "top_surahs": top_surahs,
        "daily_sessions": daily_sessions,
        "events": events,
    }
