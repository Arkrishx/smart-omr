import os
import cv2
import numpy as np
from sqlalchemy.orm import Session

from app.database.session import SessionLocal, engine, Base
from app.models.schema import Exam, AnswerKey, Submission, DetectedAnswer
from app.cv.template_generator import OMRTemplate, simulate_filled_sheet
from app.cv.pipeline import run_omr_pipeline

SAMPLE_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_data"))
os.makedirs(SAMPLE_DATA_DIR, exist_ok=True)

def seed_demo():
    db: Session = SessionLocal()
    try:
        # Check if demo exam already exists
        existing = db.query(Exam).filter(Exam.name == "Computer Science Internal Assessment").first()
        if existing:
            print(f"Demo exam already exists with ID: {existing.id}")
            exam = existing
        else:
            exam = Exam(
                name="Computer Science Internal Assessment",
                subject="Computer Science",
                class_name="Grade 12 CS-A",
                question_count=50,
                options_per_question=4,
                marks_per_question=2.0,
                negative_marks=0.5
            )
            db.add(exam)
            db.commit()
            db.refresh(exam)
            print(f"Created demo exam ID: {exam.id}")

            # 50-question answer key pattern
            options = ["A", "B", "C", "D"]
            for q in range(1, 51):
                ans = options[(q * 3 + 1) % 4]
                db.add(AnswerKey(exam_id=exam.id, question_number=q, correct_answer=ans))
            db.commit()

        # Fetch answer key
        keys = db.query(AnswerKey).filter(AnswerKey.exam_id == exam.id).all()
        answer_key = {k.question_number: k.correct_answer for k in keys}

        template = OMRTemplate(question_count=50)

        # 1. Generate Demo 1: Perfect Scan (High score ~92%)
        answers_perfect = {}
        for q in range(1, 51):
            if q == 15 or q == 32:
                answers_perfect[q] = "UNANSWERED"
            elif q == 23 or q == 41:
                # Wrong answer
                curr = answer_key[q]
                answers_perfect[q] = "C" if curr != "C" else "B"
            else:
                answers_perfect[q] = answer_key[q]

        img_perfect = simulate_filled_sheet(template, answers_perfect, student_id="CS12-001")
        cv2.imwrite(os.path.join(SAMPLE_DATA_DIR, "demo_1_perfect.jpg"), img_perfect)

        # 2. Generate Demo 2: Tilted Photograph (Angled on Desk)
        h, w = img_perfect.shape[:2]
        canvas_h, canvas_w = 2400, 2000
        canvas = np.ones((canvas_h, canvas_w, 3), dtype=np.uint8) * 190
        # Add wood desk grain
        noise = np.random.normal(0, 8, canvas.shape).astype(np.int16)
        canvas = np.clip(canvas.astype(np.int16) + noise, 0, 255).astype(np.uint8)

        src_pts = np.float32([[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]])
        dst_pts = np.float32([
            [260, 210],     # top-left
            [1780, 140],    # top-right (higher and angled)
            [1880, 2220],   # bottom-right
            [170, 2120]     # bottom-left
        ])
        M = cv2.getPerspectiveTransform(src_pts, dst_pts)
        tilted_img = cv2.warpPerspective(img_perfect, M, (canvas_w, canvas_h), borderValue=(190, 190, 190))
        cv2.imwrite(os.path.join(SAMPLE_DATA_DIR, "demo_2_tilted.jpg"), tilted_img)

        # 3. Generate Demo 3: Dark Lighting / Shadow Gradient
        dark_sheet = img_perfect.copy().astype(np.float32)
        # Create shadow gradient from top-left to bottom-right
        x = np.linspace(0.45, 0.95, w)
        y = np.linspace(0.40, 0.90, h)
        xx, yy = np.meshgrid(x, y)
        shadow_mask = (xx * yy)[:, :, np.newaxis]
        dark_sheet = np.clip(dark_sheet * shadow_mask, 0, 255).astype(np.uint8)
        cv2.imwrite(os.path.join(SAMPLE_DATA_DIR, "demo_3_dark_lighting.jpg"), dark_sheet)

        # 4. Generate Demo 4: Partial / Light Pencil Marks
        answers_partial = answers_perfect.copy()
        for q in [5, 12, 28, 44]:
            answers_partial[q] = "PARTIAL"
        img_partial = simulate_filled_sheet(template, answers_partial, student_id="CS12-004", noise_level=0.04)
        cv2.imwrite(os.path.join(SAMPLE_DATA_DIR, "demo_4_partial_marks.jpg"), img_partial)

        # 5. Generate Demo 5: Ambiguous / Multiple Marks
        answers_ambiguous = answers_perfect.copy()
        answers_ambiguous[4] = "AMBIGUOUS"
        answers_ambiguous[18] = "AMBIGUOUS"
        answers_ambiguous[37] = "AMBIGUOUS"
        img_ambiguous = simulate_filled_sheet(template, answers_ambiguous, student_id="CS12-005")
        cv2.imwrite(os.path.join(SAMPLE_DATA_DIR, "demo_5_ambiguous.jpg"), img_ambiguous)

        print("Seeded 5 demo sample images into sample_data/ successfully!")

        # Pre-process demo_1 and demo_2 so dashboard has immediate analytics populated
        upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
        run_omr_pipeline(img_perfect, answer_key, exam.marks_per_question, exam.negative_marks, upload_dir)
        print("Demo evaluation pre-run completed.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_demo()
