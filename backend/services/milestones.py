from sqlalchemy.orm import Session
from datetime import datetime
import models


MILESTONE_THRESHOLDS = {
    models.MilestoneType.streak_3: lambda u: u.streak_count >= 3,
    models.MilestoneType.streak_7: lambda u: u.streak_count >= 7,
    models.MilestoneType.streak_30: lambda u: u.streak_count >= 30,
    models.MilestoneType.verses_100: lambda u: u.total_verses_read >= 100,
    models.MilestoneType.verses_500: lambda u: u.total_verses_read >= 500,
    models.MilestoneType.verses_1000: lambda u: u.total_verses_read >= 1000,
}


def check_and_award(user: models.User, db: Session) -> list[models.Milestone]:
    existing = {m.milestone_type for m in user.milestones}
    awarded = []

    for milestone_type, condition in MILESTONE_THRESHOLDS.items():
        if milestone_type not in existing and condition(user):
            m = models.Milestone(user_id=user.id, milestone_type=milestone_type)
            db.add(m)
            awarded.append(m)

    if awarded:
        db.commit()
        for m in awarded:
            db.refresh(m)

    return awarded
