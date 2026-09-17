import sys
import os
import pytest
import cv2
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.cv.template_generator import OMRTemplate, simulate_filled_sheet
from app.cv.pipeline import run_omr_pipeline

def test_full_pipeline_clean_sheet(tmp_path):
    template = OMRTemplate(question_count=50)
    known_answers = {
        1: "B",
        2: "C",
        3: "A",
        4: "D",
        5: "B",
        6: "UNANSWERED",
        7: "AMBIGUOUS"
    }

    # Simulate filled sheet
    sheet_img = simulate_filled_sheet(template, known_answers, student_id="STU001")

    # Define answer key
    answer_key = {
        1: "B",  # Correct (+2)
        2: "C",  # Correct (+2)
        3: "B",  # Wrong (-0.5)
        4: "D",  # Correct (+2)
        5: "B",  # Correct (+2)
        6: "A",  # Unanswered (0)
        7: "C"   # Ambiguous (0)
    }

    result = run_omr_pipeline(
        sheet_img,
        answer_key=answer_key,
        marks_per_question=2.0,
        negative_marks=0.5,
        output_dir=str(tmp_path),
        question_count=50
    )

    assert result["success"] is True
    eval_res = result["evaluation"]

    # Check answers for Q1 - Q7
    detected = result["detected_answers"]
    assert detected[1]["answer"] == "B"
    assert detected[2]["answer"] == "C"
    assert detected[3]["answer"] == "A"
    assert detected[4]["answer"] == "D"
    assert detected[5]["answer"] == "B"
    assert detected[6]["answer"] == "UNANSWERED"
    assert detected[7]["answer"] == "AMBIGUOUS"

    # Check scoring: 4 correct (4 * 2 = 8), 1 wrong (-0.5) -> 7.5
    assert eval_res["correct_count"] == 4
    assert eval_res["wrong_count"] == 1
    assert eval_res["unanswered_count"] >= 1
    assert eval_res["ambiguous_count"] >= 1
    assert eval_res["score"] == 7.5

    # Check that output files were created
    assert result["annotated_filename"] is not None
    assert os.path.exists(os.path.join(tmp_path, result["annotated_filename"]))
    assert os.path.exists(os.path.join(tmp_path, result["warped_filename"]))

def test_full_pipeline_tilted_perspective(tmp_path):
    """
    Simulates taking a smartphone photo of the OMR sheet from a 3D perspective angle.
    """
    template = OMRTemplate(question_count=50)
    known_answers = {
        1: "A",
        2: "D",
        3: "C",
        4: "B"
    }

    flat_sheet = simulate_filled_sheet(template, known_answers, student_id="STU999")
    h, w = flat_sheet.shape[:2]

    # Create background canvas (e.g. wooden desk / table)
    canvas_h, canvas_w = 2400, 2000
    canvas = np.ones((canvas_h, canvas_w, 3), dtype=np.uint8) * 180

    # Perspective warp source: flat sheet corners
    src_pts = np.float32([[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]])
    # Destination points: skewed / photographed at an angle inside the larger canvas
    dst_pts = np.float32([
        [280, 220],     # top-left
        [1750, 160],    # top-right (higher and skewed)
        [1860, 2180],   # bottom-right
        [190, 2100]     # bottom-left
    ])

    M = cv2.getPerspectiveTransform(src_pts, dst_pts)
    tilted_photo = cv2.warpPerspective(flat_sheet, M, (canvas_w, canvas_h), borderValue=(180, 180, 180))

    answer_key = {1: "A", 2: "D", 3: "C", 4: "B"}
    result = run_omr_pipeline(
        tilted_photo,
        answer_key=answer_key,
        marks_per_question=1.0,
        negative_marks=0.0,
        output_dir=str(tmp_path),
        question_count=50
    )

    assert result["success"] is True
    det = result["detected_answers"]
    assert det[1]["answer"] == "A"
    assert det[2]["answer"] == "D"
    assert det[3]["answer"] == "C"
    assert det[4]["answer"] == "B"
    assert result["evaluation"]["correct_count"] == 4
