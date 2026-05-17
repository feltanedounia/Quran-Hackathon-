import aiofiles
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth as auth_utils
from services import qf_user_api

router = APIRouter(prefix="/auth", tags=["auth"])
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/register", response_model=schemas.Token)
def register(body: schemas.UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(models.User).filter(models.User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = models.User(
        email=body.email,
        username=body.username,
        hashed_password=auth_utils.hash_password(body.password),
        gender=body.gender,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Award first_session milestone placeholder — actual award on first session
    return schemas.Token(access_token=auth_utils.create_access_token(user.id))


@router.post("/login", response_model=schemas.Token)
def login(body: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not auth_utils.verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return schemas.Token(access_token=auth_utils.create_access_token(user.id))


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth_utils.get_current_user)):
    return current_user


@router.put("/me", response_model=schemas.UserOut)
def update_me(
    body: schemas.UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    for field in ("bio", "country", "current_hifd", "current_hifd_last_activity"):
        value = getattr(body, field)
        if value is not None:
            setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/qf-connect")
def qf_connect(current_user: models.User = Depends(auth_utils.get_current_user)):
    """Redirect user to Quran Foundation OAuth login to connect their QF account."""
    if not qf_user_api.is_configured():
        raise HTTPException(status_code=503, detail="Quran Foundation integration is not configured")

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    redirect_uri = f"{frontend_url}/qf-callback"
    params = (
        f"response_type=code"
        f"&client_id={qf_user_api.QF_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=bookmarks"
    )
    return RedirectResponse(url=f"{qf_user_api.QF_AUTH_BASE}/oauth2/authorize?{params}")


@router.get("/qf-callback")
async def qf_callback(
    code: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Exchange QF OAuth code for tokens and save them to the user record."""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    redirect_uri = f"{frontend_url}/qf-callback"

    token_data = await qf_user_api.exchange_code(code, redirect_uri)
    if not token_data:
        raise HTTPException(status_code=400, detail="Failed to exchange Quran Foundation OAuth code")

    current_user.qf_access_token = token_data.get("access_token")
    current_user.qf_refresh_token = token_data.get("refresh_token")
    db.commit()
    db.refresh(current_user)
    return {"ok": True, "qf_connected": True}


@router.delete("/qf-disconnect", response_model=schemas.UserOut)
def qf_disconnect(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    """Remove stored QF tokens (disconnects QF account sync)."""
    current_user.qf_access_token = None
    current_user.qf_refresh_token = None
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/photo", response_model=schemas.UserOut)
async def upload_profile_photo(
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    ext = os.path.splitext(photo.filename or "profile.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(await photo.read())

    current_user.profile_photo_path = f"/uploads/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user
