import cv2
import numpy as np
from app.cv.preprocessing import convert_grayscale, normalize_lighting
from app.cv.mark_detection import extract_bubble_roi, calculate_fill_ratio, classify_question

def detect_answers_from_warped_sheet(warped_img, template, empty_threshold=0.22, ambiguity_gap=0.14):
    """
    Scans all question bubbles on the standardized warped sheet (1500 x 2000).
    Extracts bubble ROIs, computes mark fill ratios, and classifies each question.
    
    Returns:
        answers (dict): {q_num: classification_dict}
        fill_data (dict): raw fill ratios for all questions and options
    """
    gray = convert_grayscale(warped_img)
    # Lighting normalization to remove residual shadows
    normalized = normalize_lighting(gray)

    answers = {}
    fill_data = {}

    for q_num, options in template.bubble_coords.items():
        q_fills = {}
        for opt_label, b_info in options.items():
            cx = b_info["cx"]
            cy = b_info["cy"]
            r = b_info["r"]

            roi, mask = extract_bubble_roi(normalized, cx, cy, r)
            fill_ratio = calculate_fill_ratio(roi, mask, binary_method="adaptive")
            q_fills[opt_label] = fill_ratio

        fill_data[q_num] = q_fills
        classification = classify_question(
            q_fills,
            empty_threshold=empty_threshold,
            ambiguity_gap=ambiguity_gap
        )
        answers[q_num] = classification

    return answers, fill_data
