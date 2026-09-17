import cv2
import numpy as np

def order_corners(pts):
    """
    Orders 4 quadrilateral coordinate points in standard clockwise order:
    [top-left, top-right, bottom-right, bottom-left].
    pts shape: (4, 2)
    """
    pts = np.asarray(pts, dtype=np.float32).reshape(4, 2)
    rect = np.zeros((4, 2), dtype=np.float32)

    # Sum of coordinates:
    # Top-left has the smallest sum (x + y)
    # Bottom-right has the largest sum (x + y)
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    # Difference of coordinates (y - x):
    # Top-right has the smallest difference (y - x)
    # Bottom-left has the largest difference (y - x)
    diff = pts[:, 1] - pts[:, 0]
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]

    return rect

def four_point_transform(img, pts, target_width=1500, target_height=2000, dst_corners=None):
    """
    Applies perspective transformation to rectify a skewed, tilted,
    or rotated photograph of an OMR sheet into a standardized top-down view.
    """
    rect = order_corners(pts)

    if dst_corners is None:
        # Default full-canvas destination points
        dst = np.array([
            [0, 0],
            [target_width - 1, 0],
            [target_width - 1, target_height - 1],
            [0, target_height - 1]
        ], dtype=np.float32)
    else:
        dst = np.asarray(dst_corners, dtype=np.float32)

    # Compute 3x3 homography matrix
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(
        img,
        M,
        (target_width, target_height),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE
    )

    return warped, M
