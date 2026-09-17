import cv2
import numpy as np
from PIL import Image
import io

def load_image(input_source):
    """
    Loads an image from a file path, bytes, or returns as-is if already a numpy array.
    Always returns BGR numpy array.
    """
    if isinstance(input_source, np.ndarray):
        return input_source

    if isinstance(input_source, bytes):
        nparr = np.frombuffer(input_source, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img

    if isinstance(input_source, str):
        img = cv2.imread(input_source)
        if img is None:
            raise ValueError(f"Unable to read image at path: {input_source}")
        return img

    raise TypeError(f"Unsupported image input type: {type(input_source)}")

def resize_image(img, max_dim=2400):
    """
    Resizes image proportionally if its largest dimension exceeds max_dim.
    Preserves aspect ratio and sufficient resolution for bubble detection.
    """
    h, w = img.shape[:2]
    if max(h, w) <= max_dim:
        return img, 1.0

    scale = max_dim / float(max(h, w))
    new_w = int(w * scale)
    new_h = int(h * scale)
    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    return resized, scale

def convert_grayscale(img):
    """
    Converts BGR image to grayscale.
    """
    if len(img.shape) == 2:
        return img
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

def remove_noise(gray_img, method="gaussian", ksize=5):
    """
    Applies noise reduction (Gaussian blur or Bilateral filter).
    """
    if method == "bilateral":
        return cv2.bilateralFilter(gray_img, d=9, sigmaColor=75, sigmaSpace=75)
    return cv2.GaussianBlur(gray_img, (ksize, ksize), 0)

def normalize_lighting(gray_img):
    """
    Applies CLAHE (Contrast Limited Adaptive Histogram Equalization)
    and background division to neutralize shadows and uneven lighting.
    """
    # Background estimation via morphological closing
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (30, 30))
    background = cv2.morphologyEx(gray_img, cv2.MORPH_DILATE, kernel)
    
    # Division normalization to flatten shadow gradients
    diff = cv2.divide(gray_img, background, scale=255)
    
    # Contrast equalization
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    normalized = clahe.apply(diff)
    return normalized

def threshold_image(gray_img, method="adaptive"):
    """
    Converts grayscale image to binary using adaptive Gaussian thresholding or Otsu.
    Returns binary image where paper is black and marks/lines are white (or inverted).
    """
    if method == "otsu":
        _, binary = cv2.threshold(gray_img, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        return binary

    # Adaptive Gaussian thresholding with inverted output
    binary = cv2.adaptiveThreshold(
        gray_img,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        blockSize=25,
        C=10
    )
    return binary

def assess_image_quality(img):
    """
    Evaluates image resolution, blurriness, brightness, and contrast.
    Returns structured QualityReport dict with actionable feedback.
    """
    gray = convert_grayscale(img)
    h, w = gray.shape

    # 1. Resolution Check
    is_res_ok = (w >= 800 and h >= 800)

    # 2. Blur / Sharpness check using Laplacian variance
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    blur_score = float(laplacian.var())

    # 3. Brightness check (mean intensity 0 - 255)
    brightness_score = float(np.mean(gray))

    # 4. Contrast check (standard deviation 0 - 128)
    contrast_score = float(np.std(gray))

    warnings = []
    is_acceptable = True

    if not is_res_ok:
        warnings.append(f"Image resolution ({w}x{h}) is too low. Minimum 800x800 recommended for reliable bubble detection.")

    if blur_score < 60.0:
        is_acceptable = False
        warnings.append("Image appears blurry. Please hold the smartphone steady and capture again.")
    elif blur_score < 100.0:
        warnings.append("Slight camera shake detected. Ensure good focus on the OMR sheet.")

    if brightness_score < 55.0:
        is_acceptable = False
        warnings.append("Image is too dark. Please move to a brighter area or turn on phone flash.")
    elif brightness_score > 230.0:
        warnings.append("Image is overexposed. Avoid direct glare or harsh reflection.")

    if contrast_score < 30.0:
        warnings.append("Low contrast detected between paper and marks.")

    # Status message
    if not is_acceptable:
        message = "Image quality check failed. " + " ".join(warnings)
    elif warnings:
        message = "Image quality acceptable with warnings. " + " ".join(warnings)
    else:
        message = "Image quality is optimal. Clear focus, good lighting, and sharp edges detected."

    return {
        "is_acceptable": is_acceptable,
        "blur_score": round(blur_score, 2),
        "brightness_score": round(brightness_score, 2),
        "contrast_score": round(contrast_score, 2),
        "message": message,
        "warnings": warnings,
        "resolution": f"{w}x{h}"
    }
