import sys
import os
import io
import pytest
import cv2
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.main import app
from app.cv.template_generator import OMRTemplate, simulate_filled_sheet

client = TestClient(app)

def test_scan_and_analytics_flow():
    # 1. Create Exam
    exam_payload = {
        "name": "Physics Assessment 2026",
        "subject": "Physics",
        "class_name": "Class 10A",
        "question_count": 50,
        "options_per_question": 4,
        "marks_per_question": 2.0,
        "negative_marks": 0.5
    }
    create_res = client.post("/api/exams", json=exam_payload)
    assert create_res.status_code == 201
    exam = create_res.json()
    exam_id = exam["id"]

    # 2. Add Answer Key (50 questions)
    key_items = []
    correct_answers = {1: "A", 2: "B", 3: "C", 4: "D", 5: "A"}
    for q in range(1, 51):
        ans = correct_answers.get(q, "A")
        key_items.append({"question_number": q, "correct_answer": ans})

    key_res = client.post(f"/api/exams/{exam_id}/answer-key", json={"answers": key_items})
    assert key_res.status_code == 200

    # 3. Simulate a filled OMR Sheet:
    # Q1: A (Correct +2)
    # Q2: B (Correct +2)
    # Q3: A (Wrong -0.5)  [Key is C]
    # Q4: UNANSWERED (0)  [Key is D]
    # Q5: AMBIGUOUS (0)   [Key is A]
    template = OMRTemplate(question_count=50)
    student_marks = {
        1: "A",
        2: "B",
        3: "A",
        4: "UNANSWERED",
        5: "AMBIGUOUS"
    }
    sheet_img = simulate_filled_sheet(template, student_marks, student_id="STU-TEST1")

    # Encode image to JPEG bytes
    _, encoded = cv2.imencode(".jpg", sheet_img)
    file_bytes = encoded.tobytes()

    # 4. Upload and Scan
    scan_res = client.post(
        "/api/omr/scan",
        data={"exam_id": exam_id, "student_id": "STU-TEST1"},
        files={"file": ("test_sheet.jpg", io.BytesIO(file_bytes), "image/jpeg")}
    )
    assert scan_res.status_code == 200
    scan_data = scan_res.json()

    assert scan_data["success"] is True
    assert scan_data["student_id"] == "STU-TEST1"
    assert scan_data["correct_count"] == 2
    assert scan_data["wrong_count"] >= 1
    assert scan_data["unanswered_count"] >= 1
    assert scan_data["ambiguous_count"] >= 1
    assert scan_data["annotated_image_url"] is not None
    assert len(scan_data["pipeline_steps"]) > 0

    submission_id = scan_data["submission_id"]

    # 5. Retrieve result by submission_id
    result_res = client.get(f"/api/results/{submission_id}")
    assert result_res.status_code == 200
    res_data = result_res.json()
    assert res_data["submission_id"] == submission_id
    assert res_data["exam_name"] == "Physics Assessment 2026"
    assert len(res_data["answers"]) == 50

    # 6. Retrieve Exam Analytics
    analytics_res = client.get(f"/api/exams/{exam_id}/analytics")
    assert analytics_res.status_code == 200
    an_data = analytics_res.json()
    assert an_data["total_sheets_scanned"] == 1
    assert an_data["average_score"] == scan_data["score"]
    assert len(an_data["question_difficulty"]) == 50
    # Q1 was answered correctly by 1/1 student -> 100%
    assert an_data["question_difficulty"][0]["correct_percentage"] == 100.0
