from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import auth as auth_utils
from services import quran_api
from services.ai import compare_interpretation
from services.milestones import check_and_award

router = APIRouter(prefix="/verses", tags=["verses"])


def _schedule_next_review(review_count: int) -> datetime:
    intervals = [1, 3, 7, 14, 30]
    days = intervals[min(review_count, len(intervals) - 1)]
    return datetime.utcnow() + timedelta(days=days)


@router.get("/daily", response_model=schemas.DailyVerseOut)
async def get_daily_verse():
    """Return a random verse with translation and audio URL."""
    try:
        verse = await quran_api.get_random_verse()
        return verse
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Quran API error: {e}")


@router.post("/interpret", response_model=schemas.InterpretationOut)
async def submit_interpretation(
    body: schemas.InterpretationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """User submits their interpretation; AI compares with tafsir."""
    try:
        tafsir_text = await quran_api.get_tafsir(body.verse_key)
    except Exception:
        tafsir_text = ""

    try:
        ai_response = await compare_interpretation(
            verse_key=body.verse_key,
            verse_text=body.verse_text,
            user_interpretation=body.user_interpretation,
            tafsir_text=tafsir_text,
        )
    except Exception as e:
        ai_response = f"Could not generate AI feedback right now. Here is the tafsir:\n\n{tafsir_text[:800]}" if tafsir_text else "No feedback available at this time."

    interpretation = models.Interpretation(
        user_id=current_user.id,
        verse_key=body.verse_key,
        verse_text=body.verse_text,
        user_interpretation=body.user_interpretation,
        ai_response=ai_response,
        tafsir_text=tafsir_text,
        review_count=0,
        next_review_at=datetime.utcnow() + timedelta(days=1),
    )
    db.add(interpretation)
    db.commit()
    db.refresh(interpretation)

    # Award first interpretation milestone
    _maybe_award_first_interpretation(current_user, db)
    check_and_award(current_user, db)

    return interpretation


@router.get("/interpretations", response_model=List[schemas.InterpretationOut])
def get_my_interpretations(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    return (
        db.query(models.Interpretation)
        .filter(models.Interpretation.user_id == current_user.id)
        .order_by(models.Interpretation.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/review-queue", response_model=List[schemas.InterpretationOut])
def get_review_queue(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    now = datetime.utcnow()
    items = (
        db.query(models.Interpretation)
        .filter(models.Interpretation.user_id == current_user.id)
        .filter(
            (models.Interpretation.next_review_at == None) | (models.Interpretation.next_review_at <= now)
        )
        .order_by(models.Interpretation.next_review_at.asc().nullsfirst(), models.Interpretation.created_at.desc())
        .limit(limit)
        .all()
    )
    return items


@router.post("/review/{interpretation_id}", response_model=schemas.InterpretationReviewOut)
async def review_interpretation(
    interpretation_id: int,
    body: schemas.InterpretationReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    interpretation = (
        db.query(models.Interpretation)
        .filter(models.Interpretation.id == interpretation_id)
        .filter(models.Interpretation.user_id == current_user.id)
        .first()
    )
    if not interpretation:
        raise HTTPException(status_code=404, detail="Review item not found")

    tafsir_text = interpretation.tafsir_text or ""
    try:
        ai_response = await compare_interpretation(
            verse_key=interpretation.verse_key,
            verse_text=interpretation.verse_text,
            user_interpretation=body.recall_text,
            tafsir_text=tafsir_text,
        )
    except Exception:
        ai_response = f"Recall recorded. Here is the tafsir again:\n\n{tafsir_text[:800]}" if tafsir_text else "Recall recorded."

    interpretation.review_count = (interpretation.review_count or 0) + 1
    interpretation.last_reviewed_at = datetime.utcnow()
    interpretation.next_review_at = _schedule_next_review(interpretation.review_count)
    interpretation.ai_response = ai_response
    db.commit()
    db.refresh(interpretation)

    return schemas.InterpretationReviewOut(
        interpretation=interpretation,
        ai_response=ai_response,
        review_count=interpretation.review_count,
        next_review_at=interpretation.next_review_at,
    )


def _maybe_award_first_interpretation(user: models.User, db: Session):
    exists = db.query(models.Milestone).filter(
        models.Milestone.user_id == user.id,
        models.Milestone.milestone_type == models.MilestoneType.first_interpretation,
    ).first()
    if not exists:
        db.add(models.Milestone(user_id=user.id, milestone_type=models.MilestoneType.first_interpretation))
        db.commit()
