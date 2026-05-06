from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import auth as auth_utils
from services.garden import compute_garden

router = APIRouter(prefix="/garden", tags=["garden"])


@router.get("/", response_model=schemas.GardenState)
def get_garden(
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Return the current state of the user's 3D garden tree."""
    return compute_garden(
        total_verses=current_user.total_verses_read,
        streak_count=current_user.streak_count,
        longest_streak=current_user.longest_streak,
    )
