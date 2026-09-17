import cv2
import numpy as np

def generate_visual_verification_overlay(warped_bgr_img, template, evaluation_results):
    """
    Creates visual verification image overlay:
    - Green circle: Correct student selection
    - Red circle: Incorrect student selection
    - Blue dashed ring: The actual correct answer key position (so teacher can see where student made a mistake)
    - Yellow circle: Ambiguous marking
    - Gray circle: Unanswered question
    - Summary banner at top: Score, Correct, Wrong, Percentage
    """
    annotated = warped_bgr_img.copy()

    status_colors = {
        "CORRECT": (46, 184, 92),      # Emerald Green
        "WRONG": (50, 50, 220),        # Red
        "AMBIGUOUS": (0, 200, 230),     # Amber / Yellow
        "UNANSWERED": (160, 160, 160),  # Gray
        "KEY": (220, 120, 30)          # Cyan / Blue for actual answer key
    }

    results_by_q = {r["question_number"]: r for r in evaluation_results["question_results"]}

    for q_num, options in template.bubble_coords.items():
        if q_num not in results_by_q:
            continue

        q_res = results_by_q[q_num]
        status = q_res["status"]
        det_ans = q_res["detected_answer"]
        key_ans = q_res.get("correct_answer")

        # 1. Draw Correct Answer Key Ring if known
        if key_ans and key_ans in options:
            kb = options[key_ans]
            cv2.circle(annotated, (kb["cx"], kb["cy"]), kb["r"] + 4, status_colors["KEY"], 2, cv2.LINE_AA)

        # 2. Draw Detected Bubble based on status
        if status == "CORRECT":
            if det_ans in options:
                b = options[det_ans]
                # Filled green overlay
                overlay = annotated.copy()
                cv2.circle(overlay, (b["cx"], b["cy"]), b["r"], status_colors["CORRECT"], -1)
                cv2.addWeighted(overlay, 0.45, annotated, 0.55, 0, annotated)
                cv2.circle(annotated, (b["cx"], b["cy"]), b["r"], status_colors["CORRECT"], 3, cv2.LINE_AA)

        elif status == "WRONG":
            if det_ans in options:
                b = options[det_ans]
                # Filled red overlay
                overlay = annotated.copy()
                cv2.circle(overlay, (b["cx"], b["cy"]), b["r"], status_colors["WRONG"], -1)
                cv2.addWeighted(overlay, 0.45, annotated, 0.55, 0, annotated)
                cv2.circle(annotated, (b["cx"], b["cy"]), b["r"], status_colors["WRONG"], 3, cv2.LINE_AA)

        elif status == "AMBIGUOUS":
            # Highlight all options that were marked
            opt_scores = q_res.get("options", {})
            for opt, score in opt_scores.items():
                if score >= 0.20 and opt in options:
                    b = options[opt]
                    cv2.circle(annotated, (b["cx"], b["cy"]), b["r"] + 2, status_colors["AMBIGUOUS"], 3, cv2.LINE_AA)

        elif status == "UNANSWERED":
            first_b = list(options.values())[0]
            # Draw subtle gray marker near question number
            cv2.putText(annotated, "-", (first_b["cx"] - 30, first_b["cy"] + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, status_colors["UNANSWERED"], 2)

    # 3. Add Top Visual Verification Summary Banner
    banner_h = 75
    banner_overlay = annotated.copy()
    cv2.rectangle(banner_overlay, (50, 525), (1450, 525 + banner_h), (25, 25, 25), -1)
    cv2.addWeighted(banner_overlay, 0.85, annotated, 0.15, 0, annotated)
    cv2.rectangle(annotated, (50, 525), (1450, 525 + banner_h), (0, 0, 0), 2)

    score_str = f"SCORE: {evaluation_results['score']} / {evaluation_results['total_marks']} ({evaluation_results['percentage']}%)"
    stats_str = f"CORRECT: {evaluation_results['correct_count']}  |  WRONG: {evaluation_results['wrong_count']}  |  UNANSWERED: {evaluation_results['unanswered_count']}  |  AMBIGUOUS: {evaluation_results['ambiguous_count']}"

    cv2.putText(annotated, score_str, (80, 560), cv2.FONT_HERSHEY_DUPLEX, 0.85, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(annotated, stats_str, (80, 588), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 240, 200), 2, cv2.LINE_AA)

    return annotated
