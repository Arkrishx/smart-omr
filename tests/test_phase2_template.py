import sys
import os
import pytest
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.cv.template_generator import OMRTemplate, simulate_filled_sheet

def test_template_dimensions_and_geometry():
    template = OMRTemplate(question_count=50, options_per_question=4)
    assert template.width == 1500
    assert template.height == 2000
    assert len(template.bubble_coords) == 50

    # Verify options for each question
    for q in range(1, 51):
        assert q in template.bubble_coords
        assert set(template.bubble_coords[q].keys()) == {"A", "B", "C", "D"}
        for opt, data in template.bubble_coords[q].items():
            assert 0 < data["cx"] < template.width
            assert 0 < data["cy"] < template.height
            assert data["r"] == 18
            assert 0.0 < data["nx"] < 1.0
            assert 0.0 < data["ny"] < 1.0

def test_template_rendering():
    template = OMRTemplate(question_count=50)
    img = template.generate_image(exam_name="Midterm 2026", subject="Computer Science")
    assert isinstance(img, np.ndarray)
    assert img.shape == (2000, 1500, 3)

    # Check top-left corner marker has black pixels
    tl = template.corner_markers["top_left"]
    roi = img[tl[1]:tl[3], tl[0]:tl[2]]
    # Solid black corner marker should have majority dark pixels
    assert np.mean(roi) < 100

def test_simulate_filled_sheet():
    template = OMRTemplate(question_count=50)
    answers = {1: "B", 2: "C", 3: "A", 4: "UNANSWERED", 5: "AMBIGUOUS"}
    img = simulate_filled_sheet(template, answers, student_id="STU12345")
    assert img.shape == (2000, 1500, 3)

    # Q1 option B should be dark (filled)
    b_opt = template.bubble_coords[1]["B"]
    b_roi = img[b_opt["cy"]-10:b_opt["cy"]+10, b_opt["cx"]-10:b_opt["cx"]+10]
    assert np.mean(b_roi) < 60  # Filled bubble is very dark

    # Q1 option A should be light (unfilled)
    a_opt = template.bubble_coords[1]["A"]
    a_roi = img[a_opt["cy"]-10:a_opt["cy"]+10, a_opt["cx"]-10:a_opt["cx"]+10]
    assert np.mean(a_roi) > 200  # Unfilled bubble is white inside
