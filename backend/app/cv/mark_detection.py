import cv2
import numpy as np
from app.cv.preprocessing import convert_grayscale, threshold_image

def extract_bubble_roi(gray_img, cx, cy, radius):
    """
    Extracts circular region of interest (ROI) and circular mask for a bubble.
    Returns:
        roi (np.ndarray): Bounding box crop around bubble.
        mask (np.ndarray): Circular boolean mask of radius r.
    """
    h, w = gray_img.shape[:2]
    r = int(radius)
    x1 = max(0, cx - r)
    y1 = max(0, cy - r)
    x2 = min(w, cx + r + 1)
    y2 = min(h, cy + r + 1)

    crop = gray_img[y1:y2, x1:x2]

    # Create matching circular mask
    mask = np.zeros(crop.shape, dtype=np.uint8)
    mask_cx = cx - x1
    mask_cy = cy - y1
    cv2.circle(mask, (mask_cx, mask_cy), r, 255, -1)

    return crop, mask

def calculate_fill_ratio(roi, mask, binary_method="adaptive"):
    """
    Calculates the proportion of darkened pixels inside the circular bubble mask.
    Returns float from 0.0 (completely white/empty) to 1.0 (completely black/filled).
    """
    if roi.size == 0 or mask.size == 0:
        return 0.0

    # Apply adaptive thresholding to distinguish dark pen/pencil marks from paper
    if binary_method == "adaptive":
        # Adaptive thresholding where dark marks become 255
        binary = cv2.adaptiveThreshold(
            roi, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 8
        )
    else:
        # Otsu or mean
        _, binary = cv2.threshold(roi, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Count pixels that are inside the circular mask AND are marked dark
    bubble_pixels = cv2.countNonZero(mask)
    if bubble_pixels == 0:
        return 0.0

    marked_pixels = cv2.countNonZero(cv2.bitwise_and(binary, mask))
    fill_ratio = float(marked_pixels) / float(bubble_pixels)
    return round(fill_ratio, 4)

def classify_question(options_fill_scores, empty_threshold=0.22, ambiguity_gap=0.14):
    """
    Classifies a question's response given its options and fill ratios.
    options_fill_scores: {'A': 0.10, 'B': 0.78, 'C': 0.08, 'D': 0.11}
    
    Returns:
        detected_answer (str): 'A', 'B', 'C', 'D', 'UNANSWERED', or 'AMBIGUOUS'
        confidence (float): 0.0 to 1.0
        details (dict): Sorted options, top score, second score
    """
    sorted_options = sorted(options_fill_scores.items(), key=lambda x: x[1], reverse=True)
    top_opt, top_score = sorted_options[0]
    second_opt, second_score = sorted_options[1] if len(sorted_options) > 1 else (None, 0.0)

    # 1. Unanswered Check: If top option fill is below empty threshold
    if top_score < empty_threshold:
        return {
            "answer": "UNANSWERED",
            "confidence": round(1.0 - (top_score / max(empty_threshold, 0.01)), 2),
            "status": "UNANSWERED",
            "top_option": None,
            "top_score": top_score,
            "second_score": second_score,
            "options": options_fill_scores
        }

    # 2. Ambiguity Check: Multiple bubbles marked
    # If second option has high fill (e.g. >= 0.28) and is close to top option
    if second_score >= (empty_threshold + 0.05) and (top_score - second_score) < ambiguity_gap:
        ambiguous_choices = f"{top_opt}/{second_opt}"
        return {
            "answer": "AMBIGUOUS",
            "confidence": round(1.0 - (top_score - second_score), 2),
            "status": "AMBIGUOUS",
            "top_option": ambiguous_choices,
            "top_score": top_score,
            "second_score": second_score,
            "options": options_fill_scores
        }

    # 3. Single Definite Answer
    # Confidence is high when difference between top and second is large
    gap = top_score - second_score
    confidence = min(1.0, max(0.5, gap / max(top_score, 0.01)))

    return {
        "answer": top_opt,
        "confidence": round(float(confidence), 2),
        "status": "DETECTED",
        "top_option": top_opt,
        "top_score": top_score,
        "second_score": second_score,
        "options": options_fill_scores
    }
