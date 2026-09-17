import cv2
import numpy as np
from app.cv.preprocessing import convert_grayscale, remove_noise, normalize_lighting
from app.cv.perspective import order_corners

def detect_edges(img):
    """
    Computes edges using Gaussian blur and dynamic Canny thresholding based on image median.
    """
    gray = convert_grayscale(img)
    blurred = remove_noise(gray, ksize=5)

    # Dynamic Canny thresholding based on median intensity
    v = np.median(blurred)
    sigma = 0.33
    lower = int(max(0, (1.0 - sigma) * v))
    upper = int(min(255, (1.0 + sigma) * v))
    edges = cv2.Canny(blurred, lower, upper)

    # Morphological dilation to close small gaps in paper borders
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    edges = cv2.dilate(edges, kernel, iterations=1)

    return edges

def find_sheet_corners_via_contour(img):
    """
    Primary method: Finds the largest quadrilateral representing the OMR sheet boundary.
    """
    h, w = img.shape[:2]
    total_area = w * h

    edges = detect_edges(img)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return None

    # Sort contours by area descending
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < (0.15 * total_area):
            # Too small to be the OMR sheet
            continue

        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)

        # Look for 4-sided polygon
        if len(approx) == 4:
            pts = approx.reshape(4, 2)
            # Verify polygon is convex
            if cv2.isContourConvex(approx):
                return pts

    return None

def find_sheet_corners_via_markers(img):
    """
    Secondary fallback: Detects the 4 high-contrast corner fiducial markers.
    Used when paper boundary blends with a white table or background.
    """
    gray = convert_grayscale(img)
    # Adaptive thresholding to isolate black corner squares
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY_INV, 31, 15
    )

    contours, _ = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    h, w = gray.shape

    candidates = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 300 or area > (w * h * 0.05):
            continue

        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
        if len(approx) == 4 and cv2.isContourConvex(approx):
            bx, by, bw, bh = cv2.boundingRect(cnt)
            aspect = float(bw) / float(bh)
            if 0.7 <= aspect <= 1.3:
                cx = bx + bw / 2.0
                cy = by + bh / 2.0
                candidates.append((cx, cy, bw, bh))

    # If we found at least 4 marker candidates in distinct quadrants:
    if len(candidates) >= 4:
        # Sort candidates into 4 quadrants
        mid_x = w / 2.0
        mid_y = h / 2.0
        tl = [c for c in candidates if c[0] < mid_x and c[1] < mid_y]
        tr = [c for c in candidates if c[0] >= mid_x and c[1] < mid_y]
        bl = [c for c in candidates if c[0] < mid_x and c[1] >= mid_y]
        br = [c for c in candidates if c[0] >= mid_x and c[1] >= mid_y]

        if tl and tr and bl and br:
            # Pick the most extreme in each quadrant
            c_tl = min(tl, key=lambda c: c[0] + c[1])
            c_tr = min(tr, key=lambda c: (w - c[0]) + c[1])
            c_br = min(br, key=lambda c: (w - c[0]) + (h - c[1]))
            c_bl = min(bl, key=lambda c: c[0] + (h - c[1]))

            # Extrapolate sheet corners from marker centers (markers are at 50px offset on 1500x2000 master)
            pts = np.array([
                [c_tl[0] - c_tl[2] / 2, c_tl[1] - c_tl[3] / 2],
                [c_tr[0] + c_tr[2] / 2, c_tr[1] - c_tr[3] / 2],
                [c_br[0] + c_br[2] / 2, c_br[1] + c_br[3] / 2],
                [c_bl[0] - c_bl[2] / 2, c_bl[1] + c_bl[3] / 2]
            ], dtype=np.float32)
            return pts

    return None

def detect_omr_sheet(img):
    """
    Comprehensive OMR sheet detector.
    Attempts primary contour detection, then marker fallback, then full-frame check.
    Returns:
        pts (4x2 np.ndarray): Ordered 4 corners of the sheet.
        detection_method (str): 'contour', 'markers', or 'full_frame'.
    """
    # 1. Primary: Contour quad detection
    pts = find_sheet_corners_via_contour(img)
    if pts is not None:
        return order_corners(pts), "contour"

    # 2. Secondary: Corner fiducial markers
    pts = find_sheet_corners_via_markers(img)
    if pts is not None:
        return order_corners(pts), "markers"

    # 3. Fallback: Full frame (for direct scanned images or already cropped photographs)
    h, w = img.shape[:2]
    full_frame = np.array([
        [0, 0],
        [w - 1, 0],
        [w - 1, h - 1],
        [0, h - 1]
    ], dtype=np.float32)
    return full_frame, "full_frame"
