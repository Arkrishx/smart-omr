import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    class_name = Column(String(100), nullable=True)
    question_count = Column(Integer, default=50)
    options_per_question = Column(Integer, default=4)
    marks_per_question = Column(Float, default=1.0)
    negative_marks = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    answer_keys = relationship("AnswerKey", back_populates="exam", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="exam", cascade="all, delete-orphan")


class AnswerKey(Base):
    __tablename__ = "answer_keys"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False, index=True)
    question_number = Column(Integer, nullable=False)
    correct_answer = Column(String(10), nullable=False)

    exam = relationship("Exam", back_populates="answer_keys")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_identifier = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False, index=True)
    student_identifier = Column(String(100), nullable=True, index=True)
    image_path = Column(String(500), nullable=True)
    annotated_image_path = Column(String(500), nullable=True)
    score = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    correct_count = Column(Integer, default=0)
    wrong_count = Column(Integer, default=0)
    unanswered_count = Column(Integer, default=0)
    ambiguous_count = Column(Integer, default=0)
    processed_at = Column(DateTime, default=datetime.datetime.utcnow)

    exam = relationship("Exam", back_populates="submissions")
    detected_answers = relationship("DetectedAnswer", back_populates="submission", cascade="all, delete-orphan")


class DetectedAnswer(Base):
    __tablename__ = "detected_answers"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False, index=True)
    question_number = Column(Integer, nullable=False)
    detected_answer = Column(String(20), nullable=True)  # 'A', 'B', 'C', 'D', 'UNANSWERED', 'AMBIGUOUS'
    confidence = Column(Float, default=1.0)
    status = Column(String(50), nullable=True)  # 'CORRECT', 'WRONG', 'UNANSWERED', 'AMBIGUOUS'

    submission = relationship("Submission", back_populates="detected_answers")
