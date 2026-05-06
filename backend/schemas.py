from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from models import Gender, BuddyStatus, MilestoneType, ResourceCategory


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    gender: Gender


class UserProfileUpdate(BaseModel):
    bio: Optional[str] = None
    country: Optional[str] = None
    current_hifd: Optional[str] = None
    current_hifd_last_activity: Optional[date] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    gender: Gender
    profile_photo_path: Optional[str]
    bio: Optional[str]
    country: Optional[str]
    current_hifd: Optional[str]
    current_hifd_last_activity: Optional[date]
    streak_count: int
    longest_streak: int
    total_verses_read: int
    total_minutes_read: float
    last_reading_date: Optional[date]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Reading Sessions ───────────────────────────────────────────────────────────

class ReadingSessionCreate(BaseModel):
    verses_read: int
    minutes_spent: float
    surah_number: Optional[int] = None
    ayah_start: Optional[int] = None
    ayah_end: Optional[int] = None
    notes: Optional[str] = None
    date: Optional[date] = None


class ReadingSessionOut(BaseModel):
    id: int
    date: date
    verses_read: int
    minutes_spent: float
    surah_number: Optional[int]
    ayah_start: Optional[int]
    ayah_end: Optional[int]
    notes: Optional[str]
    photo_path: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Garden / Tree ──────────────────────────────────────────────────────────────

class GardenState(BaseModel):
    total_verses: int
    petals: int           # verses % 10
    flowers: int          # total_verses // 10
    branches: int         # total_verses // 100
    streak_flowers: int   # bonus golden flowers from streaks
    level: int            # overall level
    level_name: str


# ── Verses & Interpretation ────────────────────────────────────────────────────

class DailyVerseOut(BaseModel):
    verse_key: str
    surah_number: int
    ayah_number: int
    surah_name: str
    text_arabic: str
    text_translation: str
    audio_url: Optional[str]


class InterpretationCreate(BaseModel):
    verse_key: str
    verse_text: str
    user_interpretation: str


class InterpretationOut(BaseModel):
    id: int
    verse_key: str
    verse_text: str
    user_interpretation: str
    ai_response: Optional[str]
    tafsir_text: Optional[str]
    review_count: int
    last_reviewed_at: Optional[datetime]
    next_review_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class InterpretationReviewCreate(BaseModel):
    recall_text: str


class InterpretationReviewOut(BaseModel):
    interpretation: InterpretationOut
    ai_response: str
    review_count: int
    next_review_at: Optional[datetime]


# ── Buddies ────────────────────────────────────────────────────────────────────

class BuddyPairOut(BaseModel):
    id: int
    status: BuddyStatus
    buddy_username: Optional[str]
    buddy_streak: Optional[int]
    buddy_verses: Optional[int]
    matched_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class BuddyMessageCreate(BaseModel):
    content: str
    milestone_type: Optional[MilestoneType] = None


class BuddyMessageOut(BaseModel):
    id: int
    sender_id: int
    sender_username: str
    content: str
    milestone_type: Optional[MilestoneType]
    created_at: datetime

    model_config = {"from_attributes": True}


class BuddyResourceCreate(BaseModel):
    title: str
    category: ResourceCategory
    url: Optional[str] = None
    description: Optional[str] = None


class BuddyResourceOut(BaseModel):
    id: int
    user_id: int
    username: str
    title: str
    category: ResourceCategory
    url: Optional[str]
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Milestones ─────────────────────────────────────────────────────────────────

class MilestoneOut(BaseModel):
    id: int
    milestone_type: MilestoneType
    achieved_at: datetime
    shared_with_buddy: bool

    model_config = {"from_attributes": True}


# ── Engagement / ML ────────────────────────────────────────────────────────────

class EngagementStatus(BaseModel):
    risk_score: float           # 0.0 (engaged) to 1.0 (about to disengage)
    risk_level: str             # "low" | "medium" | "high"
    days_since_last_read: int
    avg_verses_7d: float
    trend: str                  # "improving" | "stable" | "declining"
    nudge_message: str          # personalized gentle reminder
