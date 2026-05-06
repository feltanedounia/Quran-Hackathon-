from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import auth as auth_utils
from services.milestones import check_and_award

router = APIRouter(prefix="/buddies", tags=["buddies"])


def _get_active_pair(user_id: int, db: Session) -> models.BuddyPair | None:
    return (
        db.query(models.BuddyPair)
        .filter(
            models.BuddyPair.status == models.BuddyStatus.active,
            (
                (models.BuddyPair.requester_id == user_id)
                | (models.BuddyPair.recipient_id == user_id)
            ),
        )
        .first()
    )


def _pair_to_out(pair: models.BuddyPair, current_user_id: int, db: Session) -> schemas.BuddyPairOut:
    buddy_id = pair.recipient_id if pair.requester_id == current_user_id else pair.requester_id
    buddy = db.query(models.User).filter(models.User.id == buddy_id).first() if buddy_id else None
    return schemas.BuddyPairOut(
        id=pair.id,
        status=pair.status,
        buddy_username=buddy.username if buddy else None,
        buddy_streak=buddy.streak_count if buddy else None,
        buddy_verses=buddy.total_verses_read if buddy else None,
        matched_at=pair.matched_at,
        created_at=pair.created_at,
    )


@router.post("/request", response_model=schemas.BuddyPairOut)
def request_buddy(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Join the buddy matching queue. Matches by gender."""
    # Check if already in a pair
    if _get_active_pair(current_user.id, db):
        raise HTTPException(status_code=400, detail="You already have an active buddy")

    # Check if already waiting
    waiting = db.query(models.BuddyPair).filter(
        models.BuddyPair.requester_id == current_user.id,
        models.BuddyPair.status == models.BuddyStatus.pending,
    ).first()
    if waiting:
        return _pair_to_out(waiting, current_user.id, db)

    # Look for a pending match of same gender (excluding self)
    match = (
        db.query(models.BuddyPair)
        .join(models.User, models.User.id == models.BuddyPair.requester_id)
        .filter(
            models.BuddyPair.status == models.BuddyStatus.pending,
            models.BuddyPair.requester_id != current_user.id,
            models.BuddyPair.recipient_id == None,
            models.User.gender == current_user.gender,
        )
        .first()
    )

    if match:
        match.recipient_id = current_user.id
        match.status = models.BuddyStatus.active
        match.matched_at = datetime.utcnow()
        db.commit()
        db.refresh(match)

        # Award first buddy milestone for both users
        _award_first_buddy(current_user, db)
        requester = db.query(models.User).filter(models.User.id == match.requester_id).first()
        if requester:
            _award_first_buddy(requester, db)

        return _pair_to_out(match, current_user.id, db)

    # No match yet — add to queue
    pair = models.BuddyPair(requester_id=current_user.id, status=models.BuddyStatus.pending)
    db.add(pair)
    db.commit()
    db.refresh(pair)
    return _pair_to_out(pair, current_user.id, db)


@router.get("/me", response_model=schemas.BuddyPairOut)
def get_my_buddy(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    pair = _get_active_pair(current_user.id, db)
    if not pair:
        # Check if in queue
        waiting = db.query(models.BuddyPair).filter(
            models.BuddyPair.requester_id == current_user.id,
            models.BuddyPair.status == models.BuddyStatus.pending,
        ).first()
        if waiting:
            return _pair_to_out(waiting, current_user.id, db)
        raise HTTPException(status_code=404, detail="No buddy or pending request found")
    return _pair_to_out(pair, current_user.id, db)


@router.post("/message", response_model=schemas.BuddyMessageOut)
def send_message(
    body: schemas.BuddyMessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    pair = _get_active_pair(current_user.id, db)
    if not pair:
        raise HTTPException(status_code=404, detail="No active buddy pair")

    msg = models.BuddyMessage(
        pair_id=pair.id,
        sender_id=current_user.id,
        content=body.content,
        milestone_type=body.milestone_type,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return schemas.BuddyMessageOut(
        id=msg.id,
        sender_id=msg.sender_id,
        sender_username=current_user.username,
        content=msg.content,
        milestone_type=msg.milestone_type,
        created_at=msg.created_at,
    )


@router.get("/messages", response_model=List[schemas.BuddyMessageOut])
def get_messages(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    pair = _get_active_pair(current_user.id, db)
    if not pair:
        raise HTTPException(status_code=404, detail="No active buddy pair")

    messages = (
        db.query(models.BuddyMessage)
        .filter(models.BuddyMessage.pair_id == pair.id)
        .order_by(models.BuddyMessage.created_at.asc())
        .limit(limit)
        .all()
    )

    result = []
    user_cache = {}
    for msg in messages:
        if msg.sender_id not in user_cache:
            u = db.query(models.User).filter(models.User.id == msg.sender_id).first()
            user_cache[msg.sender_id] = u.username if u else "unknown"
        result.append(schemas.BuddyMessageOut(
            id=msg.id,
            sender_id=msg.sender_id,
            sender_username=user_cache[msg.sender_id],
            content=msg.content,
            milestone_type=msg.milestone_type,
            created_at=msg.created_at,
        ))
    return result


@router.delete("/leave")
def leave_buddy(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    pair = _get_active_pair(current_user.id, db)
    if not pair:
        raise HTTPException(status_code=404, detail="No active buddy pair")
    pair.status = models.BuddyStatus.ended
    db.commit()
    return {"message": "Buddy pair ended"}


def _award_first_buddy(user: models.User, db: Session):
    exists = db.query(models.Milestone).filter(
        models.Milestone.user_id == user.id,
        models.Milestone.milestone_type == models.MilestoneType.first_buddy,
    ).first()
    if not exists:
        db.add(models.Milestone(user_id=user.id, milestone_type=models.MilestoneType.first_buddy))
        db.commit()


@router.get("/sadaqa", response_model=List[schemas.BuddyResourceOut])
def get_sadaqa_resources(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    resources = db.query(models.BuddyResource).order_by(models.BuddyResource.created_at.desc()).all()
    result = []
    for resource in resources:
        owner = db.query(models.User).filter(models.User.id == resource.user_id).first()
        result.append(schemas.BuddyResourceOut(
            id=resource.id,
            user_id=resource.user_id,
            username=owner.username if owner else "unknown",
            title=resource.title,
            category=resource.category,
            url=resource.url,
            description=resource.description,
            created_at=resource.created_at,
        ))
    return result


@router.post("/sadaqa", response_model=schemas.BuddyResourceOut)
def share_sadaqa_resource(
    body: schemas.BuddyResourceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    resource = db.query(models.BuddyResource).filter(models.BuddyResource.user_id == current_user.id).first()
    if not resource:
        resource = models.BuddyResource(user_id=current_user.id)
        db.add(resource)

    resource.title = body.title
    resource.category = body.category
    resource.url = body.url
    resource.description = body.description
    db.commit()
    db.refresh(resource)

    return schemas.BuddyResourceOut(
        id=resource.id,
        user_id=resource.user_id,
        username=current_user.username,
        title=resource.title,
        category=resource.category,
        url=resource.url,
        description=resource.description,
        created_at=resource.created_at,
    )
