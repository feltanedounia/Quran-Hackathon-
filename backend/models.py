from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date,
    ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from database import Base
import enum


class Gender(str, enum.Enum):
    male = "male"
    female = "female"


class BuddyStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    ended = "ended"


class MilestoneType(str, enum.Enum):
    first_session = "first_session"
    streak_3 = "streak_3"
    streak_7 = "streak_7"
    streak_30 = "streak_30"
    verses_100 = "verses_100"
    verses_500 = "verses_500"
    verses_1000 = "verses_1000"
    first_buddy = "first_buddy"
    first_interpretation = "first_interpretation"
    first_photo = "first_photo"


class ResourceCategory(str, enum.Enum):
    free = "free"
    hifd = "hifd"
    online = "online"

class GroupType(str, enum.Enum):
    quran_group = "quran_group"        # General Quran study group
    khatma_group = "khatma_group"      # Quran completion challenge group
    hifd_group = "hifd_group"          # Memorization accountability group
    reflection = "reflection"          # Verse reflection & tafsir discussion


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    group_type = Column(Enum(GroupType), nullable=False)
    max_members = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", foreign_keys=[creator_id], back_populates="groups_created")
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    messages = relationship("GroupMessage", back_populates="group", cascade="all, delete-orphan")


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    joined_at = Column(DateTime, default=datetime.utcnow)
    is_admin = Column(Boolean, default=False)

    group = relationship("Group", back_populates="members")
    user = relationship("User")


class GroupMessage(Base):
    __tablename__ = "group_messages"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="messages")
    sender = relationship("User")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    profile_photo_path = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    country = Column(String, nullable=True)
    current_hifd = Column(String, nullable=True)
    current_hifd_last_activity = Column(Date, nullable=True)

    # Quran Foundation OAuth tokens (for User API integration)
    qf_access_token = Column(Text, nullable=True)
    qf_refresh_token = Column(Text, nullable=True)

    # Stats (denormalized for speed)
    streak_count = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_reading_date = Column(Date, nullable=True)
    total_verses_read = Column(Integer, default=0)
    total_minutes_read = Column(Float, default=0.0)

    # Relationships
    sessions = relationship("ReadingSession", back_populates="user")
    interpretations = relationship("Interpretation", back_populates="user")
    milestones = relationship("Milestone", back_populates="user")
    bookmarks = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")
    sadaqa_resources = relationship("BuddyResource", back_populates="user")
    groups_created = relationship("Group", foreign_keys="Group.creator_id", back_populates="creator")
    group_memberships = relationship("GroupMember", back_populates="user")
    group_messages = relationship("GroupMessage", back_populates="sender")
    buddy_requests_sent = relationship(
        "BuddyPair", foreign_keys="BuddyPair.requester_id", back_populates="requester"
    )
    buddy_requests_received = relationship(
        "BuddyPair", foreign_keys="BuddyPair.recipient_id", back_populates="recipient"
    )


class ReadingSession(Base):
    __tablename__ = "reading_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, default=date.today, nullable=False, index=True)
    activity_type = Column(String, default="reading", nullable=False, index=True)
    verses_read = Column(Integer, default=0)
    minutes_spent = Column(Float, default=0.0)
    surah_number = Column(Integer, nullable=True)
    ayah_start = Column(Integer, nullable=True)
    ayah_end = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    photo_path = Column(String, nullable=True)  # accountability photo
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sessions")


class Interpretation(Base):
    __tablename__ = "interpretations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    verse_key = Column(String, nullable=False)  # e.g. "2:255"
    verse_text = Column(Text, nullable=False)
    user_interpretation = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=True)   # Claude's tafsir comparison
    tafsir_text = Column(Text, nullable=True)   # raw tafsir from Quran Foundation API
    review_count = Column(Integer, default=0)
    last_reviewed_at = Column(DateTime, nullable=True)
    next_review_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="interpretations")


class BuddyPair(Base):
    __tablename__ = "buddy_pairs"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    status = Column(Enum(BuddyStatus), default=BuddyStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)
    matched_at = Column(DateTime, nullable=True)

    requester = relationship("User", foreign_keys=[requester_id], back_populates="buddy_requests_sent")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="buddy_requests_received")
    messages = relationship("BuddyMessage", back_populates="pair")


class BuddyMessage(Base):
    __tablename__ = "buddy_messages"

    id = Column(Integer, primary_key=True, index=True)
    pair_id = Column(Integer, ForeignKey("buddy_pairs.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    milestone_type = Column(Enum(MilestoneType), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    pair = relationship("BuddyPair", back_populates="messages")


class BuddyResource(Base):
    __tablename__ = "buddy_resources"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    title = Column(String, nullable=False)
    category = Column(Enum(ResourceCategory), nullable=False)
    url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sadaqa_resources")


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    milestone_type = Column(Enum(MilestoneType), nullable=False)
    achieved_at = Column(DateTime, default=datetime.utcnow)
    shared_with_buddy = Column(Boolean, default=False)

    user = relationship("User", back_populates="milestones")


class Bookmark(Base):
    """Local bookmark record, optionally synced with the Quran Foundation User API."""
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    verse_key = Column(String, nullable=False)        # e.g. "2:255"
    surah_number = Column(Integer, nullable=False)
    ayah_number = Column(Integer, nullable=False)
    surah_name = Column(String, nullable=True)
    verse_text = Column(Text, nullable=True)           # Arabic + translation snippet
    qf_bookmark_id = Column(String, nullable=True)    # ID returned by QF User API after sync
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bookmarks")


class AnalyticsEvent(Base):
    """Fine-grained event log for engagement analytics."""
    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    event_type = Column(String, nullable=False)   # surah_view, audio_play, juzz_navigate, etc.
    event_data = Column(Text, nullable=True)       # JSON payload
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User")
