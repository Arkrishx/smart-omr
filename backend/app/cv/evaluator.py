from typing import Dict, List, Any

def evaluate_submission(detected_answers: Dict[int, Any], answer_key: Dict[int, str], marks_per_question: float = 1.0, negative_marks: float = 0.0):
    """
    Evaluates detected answers against the official answer key.
    Calculates positive marks, negative marks, total score, percentage,
    and returns question-by-question breakdown.
    
    Formula:
        Score = (correct * marks_per_question) - (wrong * negative_marks)
    """
    correct_count = 0
    wrong_count = 0
    unanswered_count = 0
    ambiguous_count = 0

    question_results = []
    total_questions = len(answer_key) if answer_key else len(detected_answers)

    for q_num in sorted(detected_answers.keys()):
        det = detected_answers[q_num]
        det_ans = det.get("answer") if isinstance(det, dict) else det
        confidence = det.get("confidence", 1.0) if isinstance(det, dict) else 1.0

        correct_ans = answer_key.get(q_num)
        status = "UNKNOWN"

        if det_ans == "UNANSWERED":
            status = "UNANSWERED"
            unanswered_count += 1
        elif det_ans == "AMBIGUOUS":
            status = "AMBIGUOUS"
            ambiguous_count += 1
        elif correct_ans:
            if det_ans.upper() == correct_ans.upper():
                status = "CORRECT"
                correct_count += 1
            else:
                status = "WRONG"
                wrong_count += 1
        else:
            status = "UNCHECKED"

        question_results.append({
            "question_number": q_num,
            "detected_answer": det_ans,
            "correct_answer": correct_ans,
            "status": status,
            "confidence": confidence,
            "options": det.get("options", {}) if isinstance(det, dict) else {}
        })

    # Total score calculation
    raw_score = (correct_count * marks_per_question) - (wrong_count * negative_marks)
    max_possible_score = total_questions * marks_per_question

    score = round(max(0.0, raw_score), 2)  # Floor at 0.0 or allow negative if configured
    percentage = round((score / max_possible_score * 100.0), 2) if max_possible_score > 0 else 0.0

    return {
        "score": score,
        "raw_score": round(raw_score, 2),
        "total_marks": round(max_possible_score, 2),
        "percentage": percentage,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "unanswered_count": unanswered_count,
        "ambiguous_count": ambiguous_count,
        "total_questions": total_questions,
        "question_results": question_results
    }
