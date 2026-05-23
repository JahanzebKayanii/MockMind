from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json

from db.database import get_db
from db.models import Session as InterviewSession, Question, SessionStatus, User
from routers.deps import get_current_user
from services.claude import evaluate_answer, generate_final_report

router = APIRouter(prefix="/interviews", tags=["interviews"])


class QuestionResponse(BaseModel):
    question_number: int
    total_questions: int
    question_text: str
    is_answered: bool


class SubmitAnswerRequest(BaseModel):
    question_number: int
    answer_text: str


class AnswerFeedbackResponse(BaseModel):
    score: int
    feedback: str
    is_last_question: bool


def _get_session(session_id: str, user: User, db: Session) -> InterviewSession:
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/{session_id}/question/{question_number}", response_model=QuestionResponse)
def get_question(
    session_id: str,
    question_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_session(session_id, current_user, db)
    if session.status == SessionStatus.completed:
        raise HTTPException(status_code=400, detail="Session already completed")

    question = db.query(Question).filter(
        Question.session_id == session_id,
        Question.question_number == question_number,
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    return QuestionResponse(
        question_number=question.question_number,
        total_questions=session.question_count,
        question_text=question.question_text,
        is_answered=question.answer_text is not None,
    )


@router.post("/{session_id}/answer", response_model=AnswerFeedbackResponse)
def submit_answer(
    session_id: str,
    body: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_session(session_id, current_user, db)
    if session.status == SessionStatus.completed:
        raise HTTPException(status_code=400, detail="Session already completed")

    question = db.query(Question).filter(
        Question.session_id == session_id,
        Question.question_number == body.question_number,
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if question.answer_text is not None:
        raise HTTPException(status_code=400, detail="Question already answered")

    result = evaluate_answer(
        question=question.question_text,
        answer=body.answer_text,
        role=session.role,
        interview_type=session.interview_type.value,
    )

    question.answer_text = body.answer_text
    question.feedback = result["feedback"]
    question.score = result["score"]
    db.commit()

    is_last = body.question_number == session.question_count
    return AnswerFeedbackResponse(
        score=result["score"],
        feedback=result["feedback"],
        is_last_question=is_last,
    )


@router.post("/{session_id}/complete")
def complete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_session(session_id, current_user, db)
    if session.status == SessionStatus.completed:
        raise HTTPException(status_code=400, detail="Session already completed")

    unanswered = db.query(Question).filter(
        Question.session_id == session_id,
        Question.answer_text == None,
    ).count()
    if unanswered > 0:
        raise HTTPException(status_code=400, detail="All questions must be answered before completing")

    questions_data = [
        {
            "question_text": q.question_text,
            "answer_text": q.answer_text,
            "feedback": q.feedback,
            "score": q.score,
        }
        for q in session.questions
    ]

    report = generate_final_report(session.role, session.interview_type.value, questions_data)

    session.status = SessionStatus.completed
    session.overall_score = report["overall_score"]
    session.summary = report["summary"]
    session.strengths = json.dumps(report["strengths"])
    session.weaknesses = json.dumps(report["weaknesses"])
    db.commit()

    return {
        "overall_score": report["overall_score"],
        "summary": report["summary"],
        "strengths": report["strengths"],
        "weaknesses": report["weaknesses"],
    }
