import uuid
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
import enum

from .database import Base


class InterviewType(str, enum.Enum):
    behavioral = "behavioral"
    technical = "technical"
    general = "general"
    mix = "mix"


class SessionStatus(str, enum.Enum):
    in_progress = "in_progress"
    completed = "completed"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sessions = relationship("Session", back_populates="user")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)
    company = Column(String, nullable=True)
    interview_type = Column(SAEnum(InterviewType), nullable=False)
    specs = Column(Text, nullable=True)
    seniority = Column(String, nullable=True)
    timer_minutes = Column(Integer, nullable=True)
    resume_text = Column(Text, nullable=True)
    question_count = Column(Integer, nullable=False)
    status = Column(SAEnum(SessionStatus), default=SessionStatus.in_progress)
    overall_score = Column(Float, nullable=True)
    summary = Column(Text, nullable=True)
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="sessions")
    questions = relationship("Question", back_populates="session", order_by="Question.question_number", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=True)
    feedback = Column(Text, nullable=True)
    score = Column(Integer, nullable=True)

    session = relationship("Session", back_populates="questions")
