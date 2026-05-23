from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json

from db.database import get_db
from db.models import Session as InterviewSession, Question, InterviewType, SessionStatus, User
from routers.deps import get_current_user
from services.pdf_parser import extract_text_from_pdf
from services.claude import generate_questions

router = APIRouter(prefix="/sessions", tags=["sessions"])


class SessionSummary(BaseModel):
    id: str
    role: str
    company: Optional[str]
    interview_type: str
    question_count: int
    status: str
    overall_score: Optional[float]
    created_at: str

    class Config:
        from_attributes = True


class SessionDetail(BaseModel):
    id: str
    role: str
    company: Optional[str]
    seniority: Optional[str]
    timer_minutes: Optional[int]
    interview_type: str
    specs: Optional[str]
    question_count: int
    status: str
    overall_score: Optional[float]
    summary: Optional[str]
    strengths: Optional[list[str]]
    weaknesses: Optional[list[str]]
    created_at: str
    questions: list[dict]

    class Config:
        from_attributes = True


@router.post("/", response_model=dict)
async def create_session(
    role: str = Form(...),
    interview_type: str = Form(...),
    question_count: int = Form(...),
    company: Optional[str] = Form(None),
    seniority: Optional[str] = Form(None),
    timer_minutes: Optional[int] = Form(None),
    specs: Optional[str] = Form(None),
    resume: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if interview_type not in [t.value for t in InterviewType]:
        raise HTTPException(status_code=400, detail="Invalid interview type")
    if question_count not in [5, 7, 10]:
        raise HTTPException(status_code=400, detail="Question count must be 5, 7, or 10")

    resume_text = None
    if resume and resume.filename:
        file_bytes = await resume.read()
        resume_text = extract_text_from_pdf(file_bytes)

    session = InterviewSession(
        user_id=current_user.id,
        role=role,
        company=company,
        seniority=seniority,
        timer_minutes=timer_minutes,
        interview_type=InterviewType(interview_type),
        specs=specs,
        resume_text=resume_text,
        question_count=question_count,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    questions = generate_questions(role, interview_type, specs or "", resume_text or "", question_count, company or "", seniority or "")
    for i, q_text in enumerate(questions):
        question = Question(session_id=session.id, question_number=i + 1, question_text=q_text)
        db.add(question)
    db.commit()

    return {"session_id": str(session.id)}


@router.get("/", response_model=list[SessionSummary])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.desc())
        .all()
    )
    return [
        SessionSummary(
            id=str(s.id),
            role=s.role,
            company=s.company,
            interview_type=s.interview_type.value,
            question_count=s.question_count,
            status=s.status.value,
            overall_score=s.overall_score,
            created_at=s.created_at.isoformat(),
        )
        for s in sessions
    ]


@router.delete("/{session_id}", response_model=dict)
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"ok": True}


@router.post("/{session_id}/retry", response_model=dict)
async def retry_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    original = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id,
    ).first()
    if not original:
        raise HTTPException(status_code=404, detail="Session not found")

    new_session = InterviewSession(
        user_id=current_user.id,
        role=original.role,
        company=original.company,
        seniority=original.seniority,
        timer_minutes=original.timer_minutes,
        interview_type=original.interview_type,
        specs=original.specs,
        resume_text=original.resume_text,
        question_count=original.question_count,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    questions = generate_questions(
        original.role,
        original.interview_type.value,
        original.specs or "",
        original.resume_text or "",
        original.question_count,
        original.company or "",
        original.seniority or "",
    )
    for i, q_text in enumerate(questions):
        question = Question(session_id=new_session.id, question_number=i + 1, question_text=q_text)
        db.add(question)
    db.commit()

    return {"session_id": str(new_session.id)}


@router.get("/{session_id}", response_model=SessionDetail)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    strengths = json.loads(session.strengths) if session.strengths else None
    weaknesses = json.loads(session.weaknesses) if session.weaknesses else None

    return SessionDetail(
        id=str(session.id),
        role=session.role,
        company=session.company,
        seniority=session.seniority,
        timer_minutes=session.timer_minutes,
        interview_type=session.interview_type.value,
        specs=session.specs,
        question_count=session.question_count,
        status=session.status.value,
        overall_score=session.overall_score,
        summary=session.summary,
        strengths=strengths,
        weaknesses=weaknesses,
        created_at=session.created_at.isoformat(),
        questions=[
            {
                "question_number": q.question_number,
                "question_text": q.question_text,
                "answer_text": q.answer_text,
                "feedback": q.feedback,
                "score": q.score,
            }
            for q in session.questions
        ],
    )
