from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

# Answer Key item
class AnswerKeyItem(BaseModel):
    question_number: int
    correct_answer: str

class AnswerKeyBatch(BaseModel):
    answers: List[AnswerKeyItem]

# Exam schemas
class ExamBase(BaseModel):
    name: str
    subject: str
    class_name: Optional[str] = None
    question_count: int = 50
    options_per_question: int = 4
    marks_per_question: float = 1.0
    negative_marks: float = 0.0

class ExamCreate(ExamBase):
    pass

class ExamResponse(ExamBase):
    id: int
    created_at: datetime
    answer_keys_count: Optional[int] = 0
    submissions_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

# Detected Answer
class DetectedAnswerResponse(BaseModel):
    question_number: int
    detected_answer: Optional[str]
    confidence: float
    status: Optional[str]

    model_config = ConfigDict(from_attributes=True)

# Submission schemas
class SubmissionResponse(BaseModel):
    id: int
    exam_id: int
    student_identifier: Optional[str]
    image_path: Optional[str]
    annotated_image_path: Optional[str]
    score: float
    percentage: float
    correct_count: int
    wrong_count: int
    unanswered_count: int
    ambiguous_count: int
    processed_at: datetime
    detected_answers: List[DetectedAnswerResponse] = []

    model_config = ConfigDict(from_attributes=True)

# Quality assessment schema
class QualityReport(BaseModel):
    is_acceptable: bool
    blur_score: float
    brightness_score: float
    contrast_score: float
    message: str
    warnings: List[str] = []

# Scan Response
class OMRScanResponse(BaseModel):
    success: bool
    message: str
    submission_id: Optional[int] = None
    student_id: Optional[str] = None
    score: Optional[float] = None
    total_marks: Optional[float] = None
    percentage: Optional[float] = None
    correct_count: Optional[int] = None
    wrong_count: Optional[int] = None
    unanswered_count: Optional[int] = None
    ambiguous_count: Optional[int] = None
    annotated_image_url: Optional[str] = None
    warped_image_url: Optional[str] = None
    pipeline_steps: List[Dict[str, Any]] = []
    answers: List[Dict[str, Any]] = []
    quality: Optional[QualityReport] = None
