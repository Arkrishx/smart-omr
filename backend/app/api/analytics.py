from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database.session import get_db
from app.models.schema import Exam, Submission, DetectedAnswer, AnswerKey

router = APIRouter(tags=["Analytics & Results"])

@router.get("/api/results/{submission_id}")
def get_submission_result(submission_id: int, db: Session = Depends(get_db)):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail=f"Submission {submission_id} not found")

    exam = db.query(Exam).filter(Exam.id == sub.exam_id).first()
    det_answers = db.query(DetectedAnswer).filter(DetectedAnswer.submission_id == sub.id).order_by(DetectedAnswer.question_number).all()

    # Get answer keys for reference
    keys = db.query(AnswerKey).filter(AnswerKey.exam_id == sub.exam_id).all()
    key_dict = {k.question_number: k.correct_answer for k in keys}

    question_breakdown = []
    for a in det_answers:
        question_breakdown.append({
            "question_number": a.question_number,
            "detected_answer": a.detected_answer,
            "correct_answer": key_dict.get(a.question_number),
            "confidence": a.confidence,
            "status": a.status
        })

    return {
        "submission_id": sub.id,
        "exam_id": sub.exam_id,
        "exam_name": exam.name if exam else "Unknown Exam",
        "subject": exam.subject if exam else "",
        "student_id": sub.student_identifier,
        "score": sub.score,
        "percentage": sub.percentage,
        "correct_count": sub.correct_count,
        "wrong_count": sub.wrong_count,
        "unanswered_count": sub.unanswered_count,
        "ambiguous_count": sub.ambiguous_count,
        "image_path": sub.image_path,
        "annotated_image_path": sub.annotated_image_path,
        "processed_at": sub.processed_at,
        "answers": question_breakdown
    }

@router.get("/api/exams/{exam_id}/submissions")
def get_exam_submissions(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail=f"Exam {exam_id} not found")

    subs = db.query(Submission).filter(Submission.exam_id == exam_id).order_by(Submission.processed_at.desc()).all()
    results = []
    for s in subs:
        results.append({
            "id": s.id,
            "student_identifier": s.student_identifier,
            "score": s.score,
            "percentage": s.percentage,
            "correct_count": s.correct_count,
            "wrong_count": s.wrong_count,
            "unanswered_count": s.unanswered_count,
            "ambiguous_count": s.ambiguous_count,
            "annotated_image_path": s.annotated_image_path,
            "processed_at": s.processed_at,
            "status": "Review" if s.ambiguous_count > 0 else "Complete"
        })
    return results

@router.get("/api/exams/{exam_id}/analytics")
def get_exam_analytics(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail=f"Exam {exam_id} not found")

    subs = db.query(Submission).filter(Submission.exam_id == exam_id).all()
    total_subs = len(subs)

    if total_subs == 0:
        return {
            "exam_id": exam.id,
            "exam_name": exam.name,
            "subject": exam.subject,
            "total_sheets_scanned": 0,
            "average_score": 0.0,
            "highest_score": 0.0,
            "lowest_score": 0.0,
            "pass_percentage": 0.0,
            "question_difficulty": []
        }

    scores = [s.score for s in subs]
    avg_score = round(sum(scores) / total_subs, 2)
    max_score = round(max(scores), 2)
    min_score = round(min(scores), 2)

    total_marks = exam.question_count * exam.marks_per_question
    pass_threshold = total_marks * 0.40  # 40% passing standard
    passed_count = sum(1 for s in subs if s.score >= pass_threshold)
    pass_percentage = round((passed_count / total_subs) * 100.0, 2)

    # Question-level analytics
    sub_ids = [s.id for s in subs]
    all_answers = db.query(DetectedAnswer).filter(DetectedAnswer.submission_id.in_(sub_ids)).all()

    q_stats = {}
    for q in range(1, exam.question_count + 1):
        q_stats[q] = {"correct": 0, "wrong": 0, "unanswered": 0, "ambiguous": 0}

    for a in all_answers:
        if a.question_number in q_stats:
            st = (a.status or "UNKNOWN").lower()
            if st in q_stats[a.question_number]:
                q_stats[a.question_number][st] += 1

    question_difficulty = []
    for q in range(1, exam.question_count + 1):
        c = q_stats[q]["correct"]
        w = q_stats[q]["wrong"]
        u = q_stats[q]["unanswered"]
        amb = q_stats[q]["ambiguous"]
        correct_pct = round((c / total_subs) * 100.0, 1)

        # Classification signal
        if correct_pct >= 75.0:
            difficulty_label = "Easy"
        elif correct_pct >= 45.0:
            difficulty_label = "Moderate"
        else:
            difficulty_label = "Challenging"

        question_difficulty.append({
            "question_number": q,
            "correct_percentage": correct_pct,
            "wrong_percentage": round((w / total_subs) * 100.0, 1),
            "unanswered_percentage": round((u / total_subs) * 100.0, 1),
            "ambiguous_percentage": round((amb / total_subs) * 100.0, 1),
            "difficulty": difficulty_label
        })

    return {
        "exam_id": exam.id,
        "exam_name": exam.name,
        "subject": exam.subject,
        "total_sheets_scanned": total_subs,
        "average_score": avg_score,
        "highest_score": max_score,
        "lowest_score": min_score,
        "pass_percentage": pass_percentage,
        "question_difficulty": question_difficulty
    }
