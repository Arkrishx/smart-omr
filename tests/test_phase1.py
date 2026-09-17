import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["app"] == "Smart OMR"
    assert "opencv_version" in data
    assert data["database"] == "connected"

def test_create_and_fetch_exam():
    # 1. Create an exam
    payload = {
        "name": "Computer Science Internal Test",
        "subject": "Computer Science",
        "class_name": "Grade 12",
        "question_count": 50,
        "options_per_question": 4,
        "marks_per_question": 2.0,
        "negative_marks": 0.5
    }
    create_res = client.post("/api/exams", json=payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    exam_id = created_data["id"]
    assert created_data["name"] == payload["name"]
    assert created_data["marks_per_question"] == 2.0
    assert created_data["negative_marks"] == 0.5

    # 2. Add Answer Key
    key_payload = {
        "answers": [
            {"question_number": 1, "correct_answer": "B"},
            {"question_number": 2, "correct_answer": "C"},
            {"question_number": 3, "correct_answer": "A"},
            {"question_number": 4, "correct_answer": "D"},
            {"question_number": 5, "correct_answer": "B"},
        ]
    }
    key_res = client.post(f"/api/exams/{exam_id}/answer-key", json=key_payload)
    assert key_res.status_code == 200

    # 3. Fetch exam details
    get_res = client.get(f"/api/exams/{exam_id}")
    assert get_res.status_code == 200
    detail = get_res.json()
    assert detail["exam"]["id"] == exam_id
    assert detail["answer_key"]["1"] == "B"
    assert detail["answer_key"]["2"] == "C"

    # 4. List exams
    list_res = client.get("/api/exams")
    assert list_res.status_code == 200
    exams = list_res.json()
    assert any(e["id"] == exam_id for e in exams)
