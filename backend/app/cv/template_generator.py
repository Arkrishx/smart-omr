import os
import json
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Standard warped template canvas dimensions
TEMPLATE_WIDTH = 1500
TEMPLATE_HEIGHT = 2000

# Marker specifications
CORNER_MARKER_SIZE = 70
CORNER_OFFSET = 50  # margin from paper edges

class OMRTemplate:
    """
    Generates and stores standard OMR sheet layouts.
    Canvas: 1500 x 2000 pixels (3:4 aspect ratio, close to A4).
    """

    def __init__(self, question_count=50, options_per_question=4):
        self.width = TEMPLATE_WIDTH
        self.height = TEMPLATE_HEIGHT
        self.question_count = question_count
        self.options_per_question = options_per_question
        self.bubble_radius = 18
        self.option_labels = ["A", "B", "C", "D", "E"][:options_per_question]

        # Corner fiducial marker outer boundaries
        self.corner_markers = {
            "top_left": (CORNER_OFFSET, CORNER_OFFSET, CORNER_OFFSET + CORNER_MARKER_SIZE, CORNER_OFFSET + CORNER_MARKER_SIZE),
            "top_right": (self.width - CORNER_OFFSET - CORNER_MARKER_SIZE, CORNER_OFFSET, self.width - CORNER_OFFSET, CORNER_OFFSET + CORNER_MARKER_SIZE),
            "bottom_left": (CORNER_OFFSET, self.height - CORNER_OFFSET - CORNER_MARKER_SIZE, CORNER_OFFSET + CORNER_MARKER_SIZE, self.height - CORNER_OFFSET),
            "bottom_right": (self.width - CORNER_OFFSET - CORNER_MARKER_SIZE, self.height - CORNER_OFFSET - CORNER_MARKER_SIZE, self.width - CORNER_OFFSET, self.height - CORNER_OFFSET)
        }

        # Compute question bubble coordinates
        self.bubble_coords = self._calculate_grid_geometry()

    def _calculate_grid_geometry(self):
        """
        Calculates theoretical (cx, cy, r) for each question option.
        Organizes questions into 2 columns (up to 50 questions) or 4 columns (up to 100).
        """
        coords = {}

        if self.question_count <= 25:
            num_cols = 1
            questions_per_col = self.question_count
            col_x_starts = [550]
        elif self.question_count <= 50:
            num_cols = 2
            questions_per_col = 25
            col_x_starts = [260, 880]
        else:
            num_cols = 4
            questions_per_col = 25
            col_x_starts = [120, 480, 840, 1200]

        grid_top_y = 620
        row_step_y = 48
        option_step_x = 65

        for q in range(1, self.question_count + 1):
            coords[q] = {}
            col_idx = (q - 1) // questions_per_col
            row_idx = (q - 1) % questions_per_col

            col_x = col_x_starts[col_idx]
            row_y = grid_top_y + (row_idx * row_step_y)

            # Option bubbles start after question number
            bubble_start_x = col_x + 90

            for opt_idx, opt_label in enumerate(self.option_labels):
                cx = bubble_start_x + (opt_idx * option_step_x)
                cy = row_y
                coords[q][opt_label] = {
                    "cx": int(cx),
                    "cy": int(cy),
                    "r": int(self.bubble_radius),
                    # Normalized relative coords (0.0 to 1.0)
                    "nx": round(cx / self.width, 5),
                    "ny": round(cy / self.height, 5),
                    "nr": round(self.bubble_radius / self.width, 5)
                }

        return coords

    def generate_image(self, exam_name="Internal Assessment Examination", subject="Computer Science", exam_id_code="EXAM-001"):
        """
        Draws high-resolution master OMR template using Pillow and OpenCV.
        """
        img = np.ones((self.height, self.width, 3), dtype=np.uint8) * 255

        # 1. Draw solid black corner fiducial markers with target crosses
        for name, (x1, y1, x2, y2) in self.corner_markers.items():
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 0), -1)
            # Inner white border and center dot for sharp cross-correlation
            cv2.rectangle(img, (x1 + 12, y1 + 12), (x2 - 12, y2 - 12), (255, 255, 255), 3)
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            cv2.circle(img, (cx, cy), 5, (255, 255, 255), -1)

        # 2. Draw outer border
        cv2.rectangle(img, (CORNER_OFFSET, CORNER_OFFSET), (self.width - CORNER_OFFSET, self.height - CORNER_OFFSET), (0, 0, 0), 2)

        # 3. Header Section
        cv2.putText(img, "SMART OMR EVALUATION SYSTEM", (280, 110), cv2.FONT_HERSHEY_DUPLEX, 1.2, (0, 0, 0), 2, cv2.LINE_AA)
        cv2.putText(img, "AI-POWERED OPTICAL MARK RECOGNITION FORM", (390, 145), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (80, 80, 80), 1, cv2.LINE_AA)

        # Header details box
        cv2.rectangle(img, (CORNER_OFFSET + 30, 175), (self.width - CORNER_OFFSET - 30, 310), (0, 0, 0), 2)
        cv2.line(img, (CORNER_OFFSET + 30, 240), (self.width - CORNER_OFFSET - 30, 240), (0, 0, 0), 1)

        # Exam information
        cv2.putText(img, f"EXAM: {exam_name.upper()}", (CORNER_OFFSET + 50, 215), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 0, 0), 2, cv2.LINE_AA)
        cv2.putText(img, f"CODE: {exam_id_code}", (self.width - 400, 215), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 0, 0), 2, cv2.LINE_AA)
        cv2.putText(img, f"SUBJECT: {subject.upper()}", (CORNER_OFFSET + 50, 285), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 1, cv2.LINE_AA)
        cv2.putText(img, f"QUESTIONS: {self.question_count}", (self.width - 400, 285), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 1, cv2.LINE_AA)

        # Candidate & Instructions row
        # Left: Student ID Box
        cv2.rectangle(img, (CORNER_OFFSET + 30, 330), (700, 520), (0, 0, 0), 2)
        cv2.putText(img, "CANDIDATE ROLL / ID NUMBER", (CORNER_OFFSET + 45, 360), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2, cv2.LINE_AA)
        
        # 8-character ID grid write-in boxes
        id_box_start_x = CORNER_OFFSET + 45
        id_box_w = 40
        id_box_h = 50
        for i in range(8):
            bx = id_box_start_x + (i * 48)
            cv2.rectangle(img, (bx, 385), (bx + id_box_w, 385 + id_box_h), (0, 0, 0), 2)

        cv2.putText(img, "Write Student ID in boxes above", (CORNER_OFFSET + 45, 470), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 100, 100), 1, cv2.LINE_AA)
        cv2.putText(img, "Example: STU001", (CORNER_OFFSET + 45, 495), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 100, 100), 1, cv2.LINE_AA)

        # Right: Instructions Box
        cv2.rectangle(img, (740, 330), (self.width - CORNER_OFFSET - 30, 520), (0, 0, 0), 2)
        cv2.putText(img, "INSTRUCTIONS FOR MARKING", (760, 360), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2, cv2.LINE_AA)
        cv2.putText(img, "- Use black or dark blue ballpoint pen only.", (760, 395), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 1, cv2.LINE_AA)
        cv2.putText(img, "- Darken the bubble completely:  [ O ] -> [ * ]", (760, 425), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 1, cv2.LINE_AA)
        # Sample bubbles
        cv2.circle(img, (1260, 420), 12, (0, 0, 0), 2)
        cv2.putText(img, "Correct:", (1170, 425), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 120, 0), 1, cv2.LINE_AA)
        cv2.circle(img, (1260, 420), 12, (0, 0, 0), -1)

        cv2.putText(img, "- Do NOT make stray marks or multiple marks.", (760, 455), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 1, cv2.LINE_AA)
        cv2.putText(img, "- Multiple marks on a question will be flagged AMBIGUOUS.", (760, 485), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (180, 0, 0), 1, cv2.LINE_AA)

        # 4. Draw Question Grid Header
        col_headers = [
            (260, 580, "SEC A: Q01 - Q25"),
            (880, 580, "SEC B: Q26 - Q50")
        ] if self.question_count == 50 else [(550, 580, "ANSWER SHEET")]

        for hx, hy, title in col_headers:
            cv2.putText(img, title, (hx, hy), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 0), 2, cv2.LINE_AA)
            # Option headers A, B, C, D
            for opt_idx, opt_letter in enumerate(self.option_labels):
                opt_x = hx + 90 + (opt_idx * 65)
                cv2.putText(img, opt_letter, (opt_x - 7, hy), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 180), 2, cv2.LINE_AA)

        # 5. Draw Question Rows & Bubbles
        for q_num, options in self.bubble_coords.items():
            first_opt = list(options.values())[0]
            # Question number label
            q_str = f"Q{q_num:02d}"
            cv2.putText(img, q_str, (first_opt["cx"] - 80, first_opt["cy"] + 6), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 1, cv2.LINE_AA)

            # Bubbles A, B, C, D
            for opt_label, b_info in options.items():
                cx = b_info["cx"]
                cy = b_info["cy"]
                r = b_info["r"]
                # Outer circle
                cv2.circle(img, (cx, cy), r, (0, 0, 0), 2)
                # Option letter centered in bubble
                cv2.putText(img, opt_label, (cx - 6, cy + 6), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (120, 120, 120), 1, cv2.LINE_AA)

        # 6. Bottom footer
        cv2.putText(img, "SMART OMR AUTOMATION ENGINE - DO NOT FOLD OR DAMAGE SHEET", (400, self.height - CORNER_OFFSET - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (100, 100, 100), 1, cv2.LINE_AA)

        return img

    def export_pdf(self, png_path, pdf_path):
        """
        Exports the generated PNG template into standard A4 PDF.
        """
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.pdfgen import canvas
            c = canvas.Canvas(pdf_path, pagesize=A4)
            page_w, page_h = A4
            c.drawImage(png_path, 0, 0, width=page_w, height=page_h)
            c.showPage()
            c.save()
            return pdf_path
        except Exception as e:
            print(f"PDF generation note: {e}")
            return None

    def save_template(self, output_dir, filename_prefix="smart_omr_50q"):
        """
        Saves PNG master template, PDF printable sheet, and geometry JSON mapping file.
        """
        os.makedirs(output_dir, exist_ok=True)
        img = self.generate_image()
        png_path = os.path.join(output_dir, f"{filename_prefix}.png")
        pdf_path = os.path.join(output_dir, f"{filename_prefix}.pdf")
        json_path = os.path.join(output_dir, f"{filename_prefix}_geometry.json")

        cv2.imwrite(png_path, img)
        self.export_pdf(png_path, pdf_path)

        geometry_data = {
            "template_width": self.width,
            "template_height": self.height,
            "question_count": self.question_count,
            "options_per_question": self.options_per_question,
            "bubble_radius": self.bubble_radius,
            "corner_markers": self.corner_markers,
            "bubble_coordinates": self.bubble_coords
        }

        with open(json_path, "w") as f:
            json.dump(geometry_data, f, indent=2)

        return png_path, pdf_path, json_path


# Helper function to generate simulated filled sheets for testing
def simulate_filled_sheet(template: OMRTemplate, answers_dict: dict, student_id="STU001", noise_level=0.0):
    """
    Creates a simulated filled OMR sheet with realistic bubble marks.
    answers_dict: {1: 'A', 2: 'B', 3: 'AMBIGUOUS', 4: 'UNANSWERED', ...}
    """
    img = template.generate_image()

    # Draw Student ID in text box
    id_start_x = CORNER_OFFSET + 52
    for i, ch in enumerate(student_id[:8]):
        cv2.putText(img, ch, (id_start_x + (i * 48), 422), cv2.FONT_HERSHEY_DUPLEX, 0.9, (20, 20, 20), 2, cv2.LINE_AA)

    # Fill bubbles based on answers_dict
    for q_num, ans in answers_dict.items():
        if q_num not in template.bubble_coords:
            continue
        options = template.bubble_coords[q_num]

        if ans == "UNANSWERED":
            continue

        if ans in options:
            # Clean filled bubble (solid dark with slight realistic pen softness)
            b = options[ans]
            cv2.circle(img, (b["cx"], b["cy"]), b["r"] - 2, (15, 15, 20), -1)
        elif ans == "AMBIGUOUS" or "/" in str(ans):
            # Fill two bubbles (e.g. A and B)
            keys = list(options.keys())[:2]
            for k in keys:
                b = options[k]
                cv2.circle(img, (b["cx"], b["cy"]), b["r"] - 2, (15, 15, 20), -1)
        elif ans == "PARTIAL":
            # Partial fill
            b = list(options.values())[0]
            cv2.circle(img, (b["cx"], b["cy"]), (b["r"] // 2), (25, 25, 25), -1)

    if noise_level > 0:
        # Add random salt/pepper or slight paper texture
        noise = np.random.normal(0, noise_level * 25, img.shape).astype(np.int16)
        noisy_img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        return noisy_img

    return img
