import os
import sys
from PIL import Image, ImageDraw, ImageFont

# Set up paths
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "docs_generated")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Font loading helper
def get_font(size, bold=False):
    font_paths = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf"
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

# -------------------------------------------------------------
# DIAGRAM 1: SYSTEM ARCHITECTURE
# -------------------------------------------------------------
def generate_architecture_diagram():
    w, h = 1200, 620
    im = Image.new("RGB", (w, h), "#0B1120")
    draw = ImageDraw.Draw(im)

    title_font = get_font(28, bold=True)
    sub_font = get_font(16)
    box_title_font = get_font(18, bold=True)
    box_sub_font = get_font(13)
    badge_font = get_font(12, bold=True)

    # Title Banner
    draw.text((40, 30), "Smart OMR - End-to-End System Architecture", fill="#38BDF8", font=title_font)
    draw.text((40, 65), "Decoupled Edge Frontend, High-Performance CV Microservice, and Relational Data Layer", fill="#94A3B8", font=sub_font)

    # 4 Tier Cards
    tiers = [
        {
            "title": "Tier 1: Client Edge",
            "subtitle": "Vercel Edge Network",
            "color": "#3B82F6",
            "bg": "#1E293B",
            "border": "#2563EB",
            "items": [
                "• React 18 SPA + Vite 5",
                "• Tailwind CSS Responsive UI",
                "• HTML5 Camera MediaStream",
                "• In-Browser Snapshot Canvas",
                "• Offline Demo Fallback Engine"
            ]
        },
        {
            "title": "Tier 2: API Gateway",
            "subtitle": "FastAPI ASGI Service",
            "color": "#10B981",
            "bg": "#1E293B",
            "border": "#059669",
            "items": [
                "• Uvicorn Async Worker",
                "• Multipart File Ingestion",
                "• Pydantic v2 Schema Guard",
                "• CORS Dynamic Origin Filter",
                "• Static Files FileServer"
            ]
        },
        {
            "title": "Tier 3: CV Core",
            "subtitle": "OpenCV & NumPy Engine",
            "color": "#F59E0B",
            "bg": "#1E293B",
            "border": "#D97706",
            "items": [
                "• Laplacian Blur Quality Gate",
                "• Canny & Polygon Sheet Quad",
                "• 4-Point Homography Warp",
                "• Adaptive Gaussian Binarizer",
                "• Dark Pixel Mark Classifier"
            ]
        },
        {
            "title": "Tier 4: Persistence",
            "subtitle": "SQLAlchemy & Storage",
            "color": "#8B5CF6",
            "bg": "#1E293B",
            "border": "#7C3AED",
            "items": [
                "• SQLite Relational DB",
                "• Exams & Submissions Schema",
                "• Question Answers Matrix",
                "• Annotated JPG Overlays",
                "• ReportLab A4 PDF Engine"
            ]
        }
    ]

    card_w = 260
    card_h = 420
    spacing = 25
    start_x = 40
    start_y = 115

    for i, t in enumerate(tiers):
        x = start_x + i * (card_w + spacing)
        y = start_y

        # Draw card container
        draw.rounded_rectangle([x, y, x + card_w, y + card_h], radius=16, fill=t["bg"], outline=t["border"], width=2)
        
        # Header strip
        draw.rounded_rectangle([x, y, x + card_w, y + 65], radius=14, fill="#0F172A")
        draw.rectangle([x, y + 45, x + card_w, y + 65], fill="#0F172A") # flatten bottom corners
        draw.line([x, y + 65, x + card_w, y + 65], fill=t["border"], width=2)

        draw.text((x + 16, y + 14), t["title"], fill=t["color"], font=box_title_font)
        draw.text((x + 16, y + 38), t["subtitle"], fill="#64748B", font=badge_font)

        # Content items
        item_y = y + 90
        for item in t["items"]:
            draw.text((x + 18, item_y), item, fill="#E2E8F0", font=box_sub_font)
            item_y += 32

        # Connecting arrow between cards
        if i < len(tiers) - 1:
            arrow_x = x + card_w + 5
            arrow_y = y + card_h // 2
            draw.line([arrow_x, arrow_y, arrow_x + 15, arrow_y], fill="#38BDF8", width=3)
            draw.polygon([
                (arrow_x + 15, arrow_y - 6),
                (arrow_x + 15, arrow_y + 6),
                (arrow_x + 22, arrow_y)
            ], fill="#38BDF8")

    # Bottom Protocol Indicator
    draw.rounded_rectangle([40, 555, 1160, 595], radius=8, fill="#1E293B", outline="#334155", width=1)
    draw.text((55, 566), "Data Bus: HTTPS Multipart Uploads (Client -> API)  |  In-Memory NumPy Arrays (API -> CV)  |  Async SQL Transactions (CV -> DB)", fill="#94A3B8", font=badge_font)

    out_path = os.path.join(OUTPUT_DIR, "diagram_architecture.png")
    im.save(out_path, quality=95)
    return out_path

# -------------------------------------------------------------
# DIAGRAM 2: COMPUTER VISION PIPELINE FLOWCHART
# -------------------------------------------------------------
def generate_pipeline_diagram():
    w, h = 1200, 580
    im = Image.new("RGB", (w, h), "#090D16")
    draw = ImageDraw.Draw(im)

    title_font = get_font(26, bold=True)
    sub_font = get_font(15)
    step_num_font = get_font(12, bold=True)
    step_title_font = get_font(15, bold=True)
    step_desc_font = get_font(11)

    draw.text((40, 25), "Deterministic 7-Stage Computer Vision Pipeline", fill="#38BDF8", font=title_font)
    draw.text((40, 58), "Sequential Pixel Operations Transforming Raw Smartphone Captures into Verified Academic Scores", fill="#94A3B8", font=sub_font)

    steps = [
        {"num": "STEP 1", "title": "Quality Gate", "sub": "Laplacian Var Blur\nLuminance Check\nCLAHE Norm", "col": "#38BDF8"},
        {"num": "STEP 2", "title": "Sheet Quad", "sub": "Canny Edges\nDouglas-Peucker\nFiducial Fallback", "col": "#60A5FA"},
        {"num": "STEP 3", "title": "Homography", "sub": "Clockwise Sort\n3x3 Matrix H\n1500x2000 Warp", "col": "#818CF8"},
        {"num": "STEP 4", "title": "Adaptive Bin", "sub": "Gaussian Local\nThresholding\nInverted Mask", "col": "#A78BFA"},
        {"num": "STEP 5", "title": "Grid Slicing", "sub": "Parametric Map\nSub-pixel Coords\nCircular ROI", "col": "#F472B6"},
        {"num": "STEP 6", "title": "Mark Classifier", "sub": "Dark Pixel Ratio\nRing Subtraction\nAmbiguity Filter", "col": "#FB7185"},
        {"num": "STEP 7", "title": "Overlay & Score", "sub": "Answer Key Diff\nPenalty Formula\nAR Visual Trace", "col": "#34D399"}
    ]

    card_w = 142
    card_h = 240
    gap = 21
    start_x = 40
    start_y = 110

    for i, s in enumerate(steps):
        x = start_x + i * (card_w + gap)
        y = start_y

        # Card container
        draw.rounded_rectangle([x, y, x + card_w, y + card_h], radius=12, fill="#131C31", outline=s["col"], width=2)
        
        # Step header
        draw.rounded_rectangle([x + 10, y + 10, x + card_w - 10, y + 36], radius=6, fill="#1E293B")
        draw.text((x + 42, y + 16), s["num"], fill=s["col"], font=step_num_font)
        
        # Title
        draw.text((x + 12, y + 48), s["title"], fill="#F8FAFC", font=step_title_font)
        draw.line([x + 12, y + 72, x + card_w - 12, y + 72], fill="#334155", width=1)

        # Bullets
        bullet_y = y + 84
        for line in s["sub"].split("\n"):
            draw.text((x + 12, bullet_y), f"• {line}", fill="#CBD5E1", font=step_desc_font)
            bullet_y += 24

        # Arrow to next step
        if i < len(steps) - 1:
            arrow_x = x + card_w + 3
            arrow_y = y + card_h // 2
            draw.line([arrow_x, arrow_y, arrow_x + 12, arrow_y], fill="#64748B", width=2)
            draw.polygon([
                (arrow_x + 12, arrow_y - 4),
                (arrow_x + 12, arrow_y + 4),
                (arrow_x + 17, arrow_y)
            ], fill="#64748B")

    # Lower explanatory box with mathematical model summary
    draw.rounded_rectangle([40, 380, 1160, 545], radius=14, fill="#131C31", outline="#1E293B", width=2)
    draw.text((60, 395), "Key Algorithmic Formulations", fill="#F1F5F9", font=get_font(16, bold=True))

    eqs = [
        "1. Blur Variance: Var(∇²I) ≥ 60.0 (Optimal: ≥ 100.0) — Rejects camera shake before evaluation.",
        "2. Perspective Warp: [x' y' 1]ᵀ = H · [x y 1]ᵀ where H is the 8-DOF homography matrix computed from 4 corners.",
        "3. Dark Pixel Ratio: R_fill = (Marked Black Pixels in Mask) / (Total Bubble Mask Area).",
        "4. Ambiguity Guard: Marked if R_fill ≥ 0.30; Unanswered if R_fill < 0.12; Ambiguous if top two marks have gap Δ < 0.14.",
        "5. Final Mark Formula: Score = (Correct_Count × Marks_per_Q) - (Wrong_Count × Negative_Penalty)."
    ]

    eq_y = 425
    for eq in eqs:
        draw.text((60, eq_y), eq, fill="#94A3B8", font=get_font(12))
        eq_y += 22

    out_path = os.path.join(OUTPUT_DIR, "diagram_pipeline.png")
    im.save(out_path, quality=95)
    return out_path

# -------------------------------------------------------------
# DIAGRAM 3: BUBBLE FILL DECISION THRESHOLDS
# -------------------------------------------------------------
def generate_bubble_logic_diagram():
    w, h = 1200, 480
    im = Image.new("RGB", (w, h), "#0F172A")
    draw = ImageDraw.Draw(im)

    title_font = get_font(26, bold=True)
    sub_font = get_font(15)
    label_font = get_font(14, bold=True)
    desc_font = get_font(12)

    draw.text((40, 25), "Bubble Fill Ratio (R_fill) Decision Boundaries", fill="#38BDF8", font=title_font)
    draw.text((40, 58), "Mathematical Classification Logic Eliminating False Positives and Erroneous Smudges", fill="#94A3B8", font=sub_font)

    # Threshold Bar Background
    bar_x = 80
    bar_y = 140
    bar_w = 1040
    bar_h = 55

    # Segments:
    # 0.00 - 0.12: Unanswered (Gray)
    # 0.12 - 0.30: Ambiguity / Partial Noise Zone (Amber)
    # 0.30 - 1.00: Confirmed Mark (Emerald)
    p_unans = int(bar_w * 0.22) # 0 to 0.22 scale
    p_amb = int(bar_w * 0.40)   # 0.22 to 0.40
    
    draw.rectangle([bar_x, bar_y, bar_x + p_unans, bar_y + bar_h], fill="#334155")
    draw.rectangle([bar_x + p_unans, bar_y, bar_x + p_amb, bar_y + bar_h], fill="#D97706")
    draw.rectangle([bar_x + p_amb, bar_y, bar_x + bar_w, bar_y + bar_h], fill="#059669")
    draw.rectangle([bar_x, bar_y, bar_x + bar_w, bar_y + bar_h], outline="#64748B", width=2)

    # Bar Labels
    draw.text((bar_x + 30, bar_y + 18), "UNANSWERED (0.00 to 0.22)", fill="#CBD5E1", font=label_font)
    draw.text((bar_x + p_unans + 20, bar_y + 18), "PARTIAL / SMUDGE", fill="#FEF3C7", font=label_font)
    draw.text((bar_x + p_amb + 180, bar_y + 18), "CONFIRMED MARK (0.40 to 1.00)", fill="#ECFDF5", font=label_font)

    # 3 Explanation Cards below bar
    cards = [
        {
            "title": "State: UNANSWERED",
            "val": "R_fill < 0.22",
            "color": "#94A3B8",
            "bg": "#1E293B",
            "desc": "Bubble is blank, empty, or contains only faint background printing. Confidence score is high (1.0 - fill/empty_thresh). 0 marks deducted."
        },
        {
            "title": "State: AMBIGUOUS",
            "val": "Multi-mark or Δ < 0.14",
            "color": "#F59E0B",
            "bg": "#1E293B",
            "desc": "Candidate shaded two bubbles, or attempted an erasure leaving graphite residue. Top two options within ambiguity gap. Flagged for teacher review."
        },
        {
            "title": "State: DETECTED",
            "val": "R_fill ≥ 0.22 (Dominant)",
            "color": "#10B981",
            "bg": "#1E293B",
            "desc": "Single clear selection with strong separation from remaining bubbles. Evaluated against official Answer Key for positive or negative marks."
        }
    ]

    card_w = 330
    card_h = 190
    card_gap = 25
    c_start_x = 80
    c_start_y = 230

    for i, c in enumerate(cards):
        cx = c_start_x + i * (card_w + card_gap)
        cy = c_start_y

        draw.rounded_rectangle([cx, cy, cx + card_w, cy + card_h], radius=12, fill=c["bg"], outline=c["color"], width=2)
        draw.text((cx + 16, cy + 16), c["title"], fill=c["color"], font=label_font)
        draw.text((cx + 16, cy + 38), f"Rule: {c['val']}", fill="#38BDF8", font=get_font(13, bold=True))
        draw.line([cx + 16, cy + 62, cx + card_w - 16, cy + 62], fill="#334155", width=1)
        
        # Word wrap description
        words = c["desc"].split()
        lines = []
        cur_line = []
        for word in words:
            cur_line.append(word)
            if len(" ".join(cur_line)) > 38:
                lines.append(" ".join(cur_line))
                cur_line = []
        if cur_line:
            lines.append(" ".join(cur_line))

        line_y = cy + 74
        for l in lines:
            draw.text((cx + 16, line_y), l, fill="#CBD5E1", font=desc_font)
            line_y += 20

    out_path = os.path.join(OUTPUT_DIR, "diagram_bubble_logic.png")
    im.save(out_path, quality=95)
    return out_path

if __name__ == "__main__":
    generate_architecture_diagram()
    generate_pipeline_diagram()
    generate_bubble_logic_diagram()
    print("All diagrams generated successfully!")
