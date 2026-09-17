import os
import time
import uuid
import cv2
import numpy as np

from app.cv.preprocessing import load_image, resize_image, assess_image_quality
from app.cv.sheet_detection import detect_omr_sheet
from app.cv.perspective import four_point_transform
from app.cv.bubble_detection import detect_answers_from_warped_sheet
from app.cv.evaluator import evaluate_submission
from app.cv.visualizer import generate_visual_verification_overlay
from app.cv.template_generator import OMRTemplate, TEMPLATE_WIDTH, TEMPLATE_HEIGHT

def run_omr_pipeline(input_source, answer_key=None, marks_per_question=1.0, negative_marks=0.0, output_dir=None, question_count=50):
    """
    Complete end-to-end OMR Computer Vision Pipeline.
    
    Steps:
    1. Load image and check quality
    2. Detect OMR sheet quadrilateral
    3. Rectify perspective into standardized top-down 1500x2000 image
    4. Detect bubbles and compute mark fill ratios
    5. Extract student answers with confidence scores
    6. Evaluate against answer key
    7. Generate visual verification overlay image
    """
    start_time = time.time()
    steps_log = []

    # 1. Read Image
    t0 = time.time()
    raw_img = load_image(input_source)
    img, scale = resize_image(raw_img, max_dim=2400)
    steps_log.append({
        "step": "Image received",
        "detail": f"Resolution: {img.shape[1]}x{img.shape[0]} px",
        "duration_ms": round((time.time() - t0) * 1000, 1),
        "status": "success"
    })

    # 2. Image Quality Assessment
    t0 = time.time()
    quality = assess_image_quality(img)
    steps_log.append({
        "step": "Quality verified",
        "detail": quality["message"],
        "duration_ms": round((time.time() - t0) * 1000, 1),
        "status": "success" if quality["is_acceptable"] else "warning"
    })

    # 3. Sheet Detection
    t0 = time.time()
    corners, method = detect_omr_sheet(img)
    steps_log.append({
        "step": "OMR sheet detected",
        "detail": f"Method: {method.capitalize()} detection",
        "duration_ms": round((time.time() - t0) * 1000, 1),
        "status": "success"
    })

    # 4. Perspective Correction
    t0 = time.time()
    if method == "contour":
        # The detected quad is the outer black border frame at CORNER_OFFSET = 50
        dst_corners = np.array([
            [50, 50],
            [TEMPLATE_WIDTH - 50, 50],
            [TEMPLATE_WIDTH - 50, TEMPLATE_HEIGHT - 50],
            [50, TEMPLATE_HEIGHT - 50]
        ], dtype=np.float32)
    elif method == "markers":
        # The detected points are the 4 fiducial marker outer bounds
        dst_corners = np.array([
            [50, 50],
            [TEMPLATE_WIDTH - 50, 50],
            [TEMPLATE_WIDTH - 50, TEMPLATE_HEIGHT - 50],
            [50, TEMPLATE_HEIGHT - 50]
        ], dtype=np.float32)
    else:
        # Full frame (direct scan or pre-cropped image)
        dst_corners = np.array([
            [0, 0],
            [TEMPLATE_WIDTH - 1, 0],
            [TEMPLATE_WIDTH - 1, TEMPLATE_HEIGHT - 1],
            [0, TEMPLATE_HEIGHT - 1]
        ], dtype=np.float32)

    warped, M = four_point_transform(img, corners, target_width=TEMPLATE_WIDTH, target_height=TEMPLATE_HEIGHT, dst_corners=dst_corners)
    steps_log.append({
        "step": "Perspective corrected",
        "detail": f"Normalized to {TEMPLATE_WIDTH}x{TEMPLATE_HEIGHT} px",
        "duration_ms": round((time.time() - t0) * 1000, 1),
        "status": "success"
    })

    # 5. Bubble Detection & Mark Analysis
    t0 = time.time()
    template = OMRTemplate(question_count=question_count)
    detected_answers, fill_data = detect_answers_from_warped_sheet(warped, template)
    steps_log.append({
        "step": "Bubbles analyzed",
        "detail": f"Processed {len(detected_answers)} question grids",
        "duration_ms": round((time.time() - t0) * 1000, 1),
        "status": "success"
    })

    # 6. Evaluation against Answer Key
    t0 = time.time()
    key_dict = answer_key or {}
    evaluation = evaluate_submission(
        detected_answers,
        key_dict,
        marks_per_question=marks_per_question,
        negative_marks=negative_marks
    )
    steps_log.append({
        "step": "Score calculated",
        "detail": f"Score: {evaluation['score']} / {evaluation['total_marks']} ({evaluation['percentage']}%)",
        "duration_ms": round((time.time() - t0) * 1000, 1),
        "status": "success"
    })

    # 7. Visual Verification Overlay
    t0 = time.time()
    annotated = generate_visual_verification_overlay(warped, template, evaluation)
    steps_log.append({
        "step": "Visual verification generated",
        "detail": "Overlaid color-coded detection markers",
        "duration_ms": round((time.time() - t0) * 1000, 1),
        "status": "success"
    })

    # Save output images if output_dir provided
    warped_filename = None
    annotated_filename = None
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        unique_id = uuid.uuid4().hex[:10]
        warped_filename = f"warped_{unique_id}.jpg"
        annotated_filename = f"annotated_{unique_id}.jpg"
        cv2.imwrite(os.path.join(output_dir, warped_filename), warped)
        cv2.imwrite(os.path.join(output_dir, annotated_filename), annotated)

    total_duration = round((time.time() - start_time), 3)

    return {
        "success": True,
        "quality": quality,
        "evaluation": evaluation,
        "detected_answers": detected_answers,
        "pipeline_steps": steps_log,
        "total_duration_seconds": total_duration,
        "warped_filename": warped_filename,
        "annotated_filename": annotated_filename,
        "corners": corners.tolist()
    }
