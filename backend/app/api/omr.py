import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.session import get_db
from app.models.schema import Exam, AnswerKey, Submission, DetectedAnswer
from app.schemas.schemas import OMRScanResponse, QualityReport
from app.cv.pipeline import run_omr_pipeline

router = APIRouter(prefix="/api/omr", tags=["OMR Scanning & Evaluation"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15MB

@router.post("/scan", response_model=OMRScanResponse)
async def scan_omr_sheet(
    file: UploadFile = File(...),
    exam_id: int = Form(...),
    student_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # 1. Validate Exam
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail=f"Exam ID {exam_id} not found")

    # Fetch answer key
    keys = db.query(AnswerKey).filter(AnswerKey.exam_id == exam_id).all()
    answer_key = {k.question_number: k.correct_answer for k in keys}

    # 2. Validate File Type
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}'. Allowed: {list(ALLOWED_EXTENSIONS)}"
        )

    # 3. Read and Save File
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed size of 15MB")

    unique_prefix = uuid.uuid4().hex[:12]
    safe_filename = f"upload_{unique_prefix}{ext}"
    input_file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(input_file_path, "wb") as f:
        f.write(file_bytes)

    # 4. Run Computer Vision Pipeline
    try:
        pipeline_output = run_omr_pipeline(
            input_source=file_bytes,
            answer_key=answer_key,
            marks_per_question=exam.marks_per_question,
            negative_marks=exam.negative_marks,
            output_dir=UPLOAD_DIR,
            question_count=exam.question_count
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OMR Computer Vision Pipeline encountered an error: {str(e)}"
        )

    eval_data = pipeline_output["evaluation"]
    quality_data = pipeline_output["quality"]

    # 5. Store in Database
    cand_id = student_id or f"STU-{unique_prefix[:6].upper()}"
    submission = Submission(
        exam_id=exam.id,
        student_identifier=cand_id,
        image_path=f"/uploads/{safe_filename}",
        annotated_image_path=f"/uploads/{pipeline_output['annotated_filename']}" if pipeline_output["annotated_filename"] else None,
        score=eval_data["score"],
        percentage=eval_data["percentage"],
        correct_count=eval_data["correct_count"],
        wrong_count=eval_data["wrong_count"],
        unanswered_count=eval_data["unanswered_count"],
        ambiguous_count=eval_data["ambiguous_count"]
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    # Save question-level detected answers
    for q_item in eval_data["question_results"]:
        det_record = DetectedAnswer(
            submission_id=submission.id,
            question_number=q_item["question_number"],
            detected_answer=str(q_item["detected_answer"]),
            confidence=q_item.get("confidence", 1.0),
            status=q_item.get("status")
        )
        db.add(det_record)
    db.commit()

    return OMRScanResponse(
        success=True,
        message="OMR Sheet scanned and evaluated successfully",
        submission_id=submission.id,
        student_id=cand_id,
        score=eval_data["score"],
        total_marks=eval_data["total_marks"],
        percentage=eval_data["percentage"],
        correct_count=eval_data["correct_count"],
        wrong_count=eval_data["wrong_count"],
        unanswered_count=eval_data["unanswered_count"],
        ambiguous_count=eval_data["ambiguous_count"],
        annotated_image_url=submission.annotated_image_path,
        warped_image_url=f"/uploads/{pipeline_output['warped_filename']}" if pipeline_output["warped_filename"] else None,
        pipeline_steps=pipeline_output["pipeline_steps"],
        answers=eval_data["question_results"],
        quality=QualityReport(
            is_acceptable=quality_data["is_acceptable"],
            blur_score=quality_data["blur_score"],
            brightness_score=quality_data["brightness_score"],
            contrast_score=quality_data["contrast_score"],
            message=quality_data["message"],
            warnings=quality_data["warnings"]
        )
    )

@router.post("/batch")
async def scan_omr_batch(
    files: List[UploadFile] = File(...),
    exam_id: int = Form(...),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail=f"Exam ID {exam_id} not found")

    keys = db.query(AnswerKey).filter(AnswerKey.exam_id == exam_id).all()
    answer_key = {k.question_number: k.correct_answer for k in keys}

    batch_results = []

    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            batch_results.append({
                "filename": file.filename,
                "success": False,
                "status": "Invalid File Format",
                "error": f"Extension '{ext}' not allowed"
            })
            continue

        file_bytes = await file.read()
        unique_prefix = uuid.uuid4().hex[:10]
        safe_filename = f"batch_{unique_prefix}{ext}"
        with open(os.path.join(UPLOAD_DIR, safe_filename), "wb") as f:
            f.write(file_bytes)

        try:
            output = run_omr_pipeline(
                input_source=file_bytes,
                answer_key=answer_key,
                marks_per_question=exam.marks_per_question,
                negative_marks=exam.negative_marks,
                output_dir=UPLOAD_DIR,
                question_count=exam.question_count
            )
            eval_data = output["evaluation"]
            cand_id = f"STU-{unique_prefix[:6].upper()}"

            submission = Submission(
                exam_id=exam.id,
                student_identifier=cand_id,
                image_path=f"/uploads/{safe_filename}",
                annotated_image_path=f"/uploads/{output['annotated_filename']}",
                score=eval_data["score"],
                percentage=eval_data["percentage"],
                correct_count=eval_data["correct_count"],
                wrong_count=eval_data["wrong_count"],
                unanswered_count=eval_data["unanswered_count"],
                ambiguous_count=eval_data["ambiguous_count"]
            )
            db.add(submission)
            db.commit()
            db.refresh(submission)

            for q_item in eval_data["question_results"]:
                det_record = DetectedAnswer(
                    submission_id=submission.id,
                    question_number=q_item["question_number"],
                    detected_answer=str(q_item["detected_answer"]),
                    confidence=q_item.get("confidence", 1.0),
                    status=q_item.get("status")
                )
                db.add(det_record)
            db.commit()

            batch_results.append({
                "filename": file.filename,
                "submission_id": submission.id,
                "student_id": cand_id,
                "score": eval_data["score"],
                "percentage": eval_data["percentage"],
                "correct_count": eval_data["correct_count"],
                "wrong_count": eval_data["wrong_count"],
                "unanswered_count": eval_data["unanswered_count"],
                "ambiguous_count": eval_data["ambiguous_count"],
                "annotated_image_url": submission.annotated_image_path,
                "status": "Review Required" if eval_data["ambiguous_count"] > 0 else "Complete",
                "success": True
            })
        except Exception as e:
            batch_results.append({
                "filename": file.filename,
                "success": False,
                "status": "Processing Error",
                "error": str(e)
            })

    return {
        "exam_id": exam_id,
        "total_submitted": len(files),
        "total_processed": len([r for r in batch_results if r.get("success")]),
        "results": batch_results
    }
