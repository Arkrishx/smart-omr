from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.schema import Exam, AnswerKey, Submission
from app.schemas.schemas import ExamCreate, ExamResponse, AnswerKeyBatch, AnswerKeyItem

router = APIRouter(prefix="/api/exams", tags=["Exams"])

@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(payload: ExamCreate, db: Session = Depends(get_db)):
    exam = Exam(
        name=payload.name,
        subject=payload.subject,
        class_name=payload.class_name,
        question_count=payload.question_count,
        options_per_question=payload.options_per_question,
        marks_per_question=payload.marks_per_question,
        negative_marks=payload.negative_marks
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam

@router.get("", response_model=List[ExamResponse])
def list_exams(db: Session = Depends(get_db)):
    exams = db.query(Exam).order_by(Exam.created_at.desc()).all()
    results = []
    for e in exams:
        key_count = db.query(AnswerKey).filter(AnswerKey.exam_id == e.id).count()
        sub_count = db.query(Submission).filter(Submission.exam_id == e.id).count()
        resp = ExamResponse.model_validate(e)
        resp.answer_keys_count = key_count
        resp.submissions_count = sub_count
        results.append(resp)
    return results

@router.get("/{exam_id}")
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail=f"Exam {exam_id} not found")
    
    keys = db.query(AnswerKey).filter(AnswerKey.exam_id == exam_id).order_by(AnswerKey.question_number).all()
    key_dict = {k.question_number: k.correct_answer for k in keys}
    
    resp = ExamResponse.model_validate(exam)
    resp.answer_keys_count = len(keys)
    resp.submissions_count = db.query(Submission).filter(Submission.exam_id == exam.id).count()

    return {
        "exam": resp,
        "answer_key": key_dict
    }

@router.post("/{exam_id}/answer-key")
def save_answer_key(exam_id: int, payload: AnswerKeyBatch, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail=f"Exam {exam_id} not found")

    # Remove existing keys for this exam
    db.query(AnswerKey).filter(AnswerKey.exam_id == exam_id).delete()

    valid_options = ["A", "B", "C", "D", "E"][:exam.options_per_question]
    for item in payload.answers:
        ans = item.correct_answer.strip().upper()
        if ans not in valid_options:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid answer '{ans}' for Q{item.question_number}. Valid choices: {valid_options}"
            )
        new_key = AnswerKey(
            exam_id=exam_id,
            question_number=item.question_number,
            correct_answer=ans
        )
        db.add(new_key)

    db.commit()
    return {"message": f"Saved {len(payload.answers)} answer key entries successfully", "exam_id": exam_id}

@router.delete("/{exam_id}")
def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail=f"Exam {exam_id} not found")
    db.delete(exam)
    db.commit()
    return {"message": f"Exam {exam_id} and related data deleted successfully"}
