from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import auth as auth_utils
from services import qf_user_api

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.post("", response_model=schemas.BookmarkOut, status_code=201)
async def add_bookmark(
    body: schemas.BookmarkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    # Return existing bookmark if already saved
    existing = (
        db.query(models.Bookmark)
        .filter(
            models.Bookmark.user_id == current_user.id,
            models.Bookmark.verse_key == body.verse_key,
        )
        .first()
    )
    if existing:
        return existing

    bookmark = models.Bookmark(
        user_id=current_user.id,
        verse_key=body.verse_key,
        surah_number=body.surah_number,
        ayah_number=body.ayah_number,
        surah_name=body.surah_name,
        verse_text=body.verse_text,
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)

    # Sync to Quran Foundation User API if user has connected their QF account
    if current_user.qf_access_token and qf_user_api.is_configured():
        qf_data = await qf_user_api.add_bookmark(
            current_user.qf_access_token,
            body.verse_key,
            body.surah_number,
            body.ayah_number,
        )
        if qf_data and qf_data.get("id"):
            bookmark.qf_bookmark_id = str(qf_data["id"])
            db.commit()
            db.refresh(bookmark)

    return bookmark


@router.get("", response_model=list[schemas.BookmarkOut])
def list_bookmarks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    return (
        db.query(models.Bookmark)
        .filter(models.Bookmark.user_id == current_user.id)
        .order_by(models.Bookmark.created_at.desc())
        .all()
    )


@router.delete("/{bookmark_id}", status_code=204)
async def delete_bookmark(
    bookmark_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    bookmark = (
        db.query(models.Bookmark)
        .filter(
            models.Bookmark.id == bookmark_id,
            models.Bookmark.user_id == current_user.id,
        )
        .first()
    )
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    # Remove from QF too
    if current_user.qf_access_token and bookmark.qf_bookmark_id and qf_user_api.is_configured():
        await qf_user_api.delete_bookmark(current_user.qf_access_token, bookmark.qf_bookmark_id)

    db.delete(bookmark)
    db.commit()
