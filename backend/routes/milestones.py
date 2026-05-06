from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/milestones", tags=["milestones"])


@router.get("/", response_model=List[schemas.MilestoneOut])
def get_milestones(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    return (
        db.query(models.Milestone)
        .filter(models.Milestone.user_id == current_user.id)
        .order_by(models.Milestone.achieved_at.desc())
        .all()
    )


@router.post("/{milestone_id}/share")
def share_milestone_with_buddy(
    milestone_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    milestone = db.query(models.Milestone).filter(
        models.Milestone.id == milestone_id,
        models.Milestone.user_id == current_user.id,
    ).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    # Find active buddy pair
    pair = (
        db.query(models.BuddyPair)
        .filter(
            models.BuddyPair.status == models.BuddyStatus.active,
            (
                (models.BuddyPair.requester_id == current_user.id)
                | (models.BuddyPair.recipient_id == current_user.id)
            ),
        )
        .first()
    )
    if not pair:
        raise HTTPException(status_code=400, detail="No active buddy to share with")

    # Post as a buddy message
    content = f"🌸 {current_user.username} just achieved: {milestone.milestone_type.value.replace('_', ' ').title()}!"
    msg = models.BuddyMessage(
        pair_id=pair.id,
        sender_id=current_user.id,
        content=content,
        milestone_type=milestone.milestone_type,
    )
    db.add(msg)

    milestone.shared_with_buddy = True
    db.commit()

    return {"message": "Milestone shared with buddy!"}
