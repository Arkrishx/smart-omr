// Pre-seeded mock data to ensure Smart OMR works seamlessly on Vercel even when the backend is offline

export const DEFAULT_EXAMS = [
  {
    id: 1,
    name: "Computer Science & Algorithms Final 2026",
    subject: "Computer Science",
    class_name: "Grade 12 CS",
    question_count: 50,
    options_per_question: 4,
    marks_per_question: 2.0,
    negative_marks: 0.5,
    answer_keys_count: 50,
    submissions_count: 14,
    created_at: "2026-09-17T08:00:00Z",
    answer_key: {
      "1": "A", "2": "B", "3": "C", "4": "D", "5": "A",
      "6": "B", "7": "C", "8": "D", "9": "A", "10": "B",
      "11": "C", "12": "D", "13": "A", "14": "B", "15": "C",
      "16": "D", "17": "A", "18": "B", "19": "C", "20": "D",
      "21": "A", "22": "B", "23": "C", "24": "D", "25": "A",
      "26": "B", "27": "C", "28": "D", "29": "A", "30": "B",
      "31": "C", "32": "D", "33": "A", "34": "B", "35": "C",
      "36": "D", "37": "A", "38": "B", "39": "C", "40": "D",
      "41": "A", "42": "B", "43": "C", "44": "D", "45": "A",
      "46": "B", "47": "C", "48": "D", "49": "A", "50": "B"
    }
  },
  {
    id: 2,
    name: "Physics & Mathematics Midterm 2026",
    subject: "Physics",
    class_name: "Grade 11 Science",
    question_count: 20,
    options_per_question: 4,
    marks_per_question: 1.0,
    negative_marks: 0.25,
    answer_keys_count: 20,
    submissions_count: 8,
    created_at: "2026-09-17T08:30:00Z",
    answer_key: {
      "1": "C", "2": "A", "3": "B", "4": "D", "5": "C",
      "6": "A", "7": "B", "8": "D", "9": "C", "10": "A",
      "11": "B", "12": "D", "13": "C", "14": "A", "15": "B",
      "16": "D", "17": "C", "18": "A", "19": "B", "20": "D"
    }
  }
];

export const DEFAULT_DEMO_SAMPLES = [
  {
    id: "demo1",
    filename: "demo_1_perfect.jpg",
    title: "Perfect Flat Scan",
    description: "Ideal flat lighting, high contrast, clean marks. Target: 100% detection.",
    url: "/sample_data/demo_1_perfect.jpg",
    simulatedResult: {
      student_id: "DEMO-PERFECT-01",
      score: 100.0,
      total_marks: 100.0,
      percentage: 100.0,
      correct_count: 50,
      wrong_count: 0,
      unanswered_count: 0,
      ambiguous_count: 0,
      quality: {
        is_acceptable: true,
        blur_score: 284.5,
        brightness_score: 215.2,
        contrast_score: 62.4,
        resolution: "1500x2000",
        message: "Optimal image quality detected."
      },
      pipeline_steps: [
        { name: "Image Preprocessing & Quality Check", duration_ms: 38, status: "SUCCESS" },
        { name: "Canny Edge & Quadrilateral Detection", duration_ms: 72, status: "SUCCESS" },
        { name: "Four-Point Perspective Homography", duration_ms: 45, status: "SUCCESS" },
        { name: "Adaptive Gaussian Thresholding", duration_ms: 31, status: "SUCCESS" },
        { name: "Coordinate Grid Bubble Extraction", duration_ms: 64, status: "SUCCESS" },
        { name: "Dark Pixel Ratio Mark Classification", duration_ms: 22, status: "SUCCESS" },
        { name: "Answer Key Comparison & Scoring", duration_ms: 5, status: "SUCCESS" }
      ],
      answers: Array.from({ length: 50 }, (_, i) => ({
        question_number: i + 1,
        detected_answer: ["A", "B", "C", "D"][i % 4],
        correct_answer: ["A", "B", "C", "D"][i % 4],
        confidence: 0.98,
        status: "CORRECT"
      }))
    }
  },
  {
    id: "demo2",
    filename: "demo_2_tilted.jpg",
    title: "Tilted & Rotated Camera",
    description: "Smartphone photograph captured at a 15-degree skew. Rectified via homography.",
    url: "/sample_data/demo_2_tilted.jpg",
    simulatedResult: {
      student_id: "DEMO-TILTED-02",
      score: 94.0,
      total_marks: 100.0,
      percentage: 94.0,
      correct_count: 47,
      wrong_count: 3,
      unanswered_count: 0,
      ambiguous_count: 0,
      quality: {
        is_acceptable: true,
        blur_score: 210.8,
        brightness_score: 202.4,
        contrast_score: 58.1,
        resolution: "1500x2000",
        message: "Perspective homography successfully rectified 14.8° skew."
      },
      pipeline_steps: [
        { name: "Image Preprocessing & Quality Check", duration_ms: 42, status: "SUCCESS" },
        { name: "Canny Edge & Quadrilateral Detection", duration_ms: 85, status: "SUCCESS" },
        { name: "Four-Point Perspective Homography", duration_ms: 58, status: "SUCCESS" },
        { name: "Adaptive Gaussian Thresholding", duration_ms: 34, status: "SUCCESS" },
        { name: "Coordinate Grid Bubble Extraction", duration_ms: 67, status: "SUCCESS" },
        { name: "Dark Pixel Ratio Mark Classification", duration_ms: 24, status: "SUCCESS" },
        { name: "Answer Key Comparison & Scoring", duration_ms: 6, status: "SUCCESS" }
      ],
      answers: Array.from({ length: 50 }, (_, i) => ({
        question_number: i + 1,
        detected_answer: i === 7 ? "B" : ["A", "B", "C", "D"][i % 4],
        correct_answer: ["A", "B", "C", "D"][i % 4],
        confidence: 0.94,
        status: i === 7 ? "WRONG" : "CORRECT"
      }))
    }
  },
  {
    id: "demo3",
    filename: "demo_3_uneven_light.jpg",
    title: "Uneven Lighting & Shadow",
    description: "Strong directional shadow across the bottom. Normalized with CLAHE division.",
    url: "/sample_data/demo_3_uneven_light.jpg",
    simulatedResult: {
      student_id: "DEMO-LIGHT-03",
      score: 98.0,
      total_marks: 100.0,
      percentage: 98.0,
      correct_count: 49,
      wrong_count: 1,
      unanswered_count: 0,
      ambiguous_count: 0,
      quality: {
        is_acceptable: true,
        blur_score: 195.4,
        brightness_score: 168.0,
        contrast_score: 49.3,
        resolution: "1500x2000",
        message: "CLAHE illumination normalization corrected shadow gradient."
      },
      pipeline_steps: [
        { name: "Image Preprocessing & Quality Check", duration_ms: 52, status: "SUCCESS" },
        { name: "Canny Edge & Quadrilateral Detection", duration_ms: 78, status: "SUCCESS" },
        { name: "Four-Point Perspective Homography", duration_ms: 48, status: "SUCCESS" },
        { name: "Adaptive Gaussian Thresholding", duration_ms: 39, status: "SUCCESS" },
        { name: "Coordinate Grid Bubble Extraction", duration_ms: 62, status: "SUCCESS" },
        { name: "Dark Pixel Ratio Mark Classification", duration_ms: 25, status: "SUCCESS" },
        { name: "Answer Key Comparison & Scoring", duration_ms: 5, status: "SUCCESS" }
      ],
      answers: Array.from({ length: 50 }, (_, i) => ({
        question_number: i + 1,
        detected_answer: ["A", "B", "C", "D"][i % 4],
        correct_answer: ["A", "B", "C", "D"][i % 4],
        confidence: 0.92,
        status: "CORRECT"
      }))
    }
  },
  {
    id: "demo4",
    filename: "demo_4_faint_pencil.jpg",
    title: "Faint Pencil Markings",
    description: "Light pencil shading. Evaluated using adaptive fill-threshold calibration.",
    url: "/sample_data/demo_4_faint_pencil.jpg",
    simulatedResult: {
      student_id: "DEMO-FAINT-04",
      score: 88.0,
      total_marks: 100.0,
      percentage: 88.0,
      correct_count: 44,
      wrong_count: 4,
      unanswered_count: 2,
      ambiguous_count: 0,
      quality: {
        is_acceptable: true,
        blur_score: 220.1,
        brightness_score: 218.4,
        contrast_score: 44.7,
        resolution: "1500x2000",
        message: "Adaptive fill threshold identified light graphite marks."
      },
      pipeline_steps: [
        { name: "Image Preprocessing & Quality Check", duration_ms: 40, status: "SUCCESS" },
        { name: "Canny Edge & Quadrilateral Detection", duration_ms: 71, status: "SUCCESS" },
        { name: "Four-Point Perspective Homography", duration_ms: 44, status: "SUCCESS" },
        { name: "Adaptive Gaussian Thresholding", duration_ms: 32, status: "SUCCESS" },
        { name: "Coordinate Grid Bubble Extraction", duration_ms: 65, status: "SUCCESS" },
        { name: "Dark Pixel Ratio Mark Classification", duration_ms: 23, status: "SUCCESS" },
        { name: "Answer Key Comparison & Scoring", duration_ms: 5, status: "SUCCESS" }
      ],
      answers: Array.from({ length: 50 }, (_, i) => ({
        question_number: i + 1,
        detected_answer: i === 12 ? "UNANSWERED" : ["A", "B", "C", "D"][i % 4],
        correct_answer: ["A", "B", "C", "D"][i % 4],
        confidence: 0.88,
        status: i === 12 ? "UNANSWERED" : "CORRECT"
      }))
    }
  },
  {
    id: "demo5",
    filename: "demo_5_ambiguous.jpg",
    title: "Ambiguous Double Marks",
    description: "Candidate marked two bubbles for Question 10. Flagged as AMBIGUOUS.",
    url: "/sample_data/demo_5_ambiguous.jpg",
    simulatedResult: {
      student_id: "DEMO-AMBIGUOUS-05",
      score: 95.5,
      total_marks: 100.0,
      percentage: 95.5,
      correct_count: 48,
      wrong_count: 1,
      unanswered_count: 0,
      ambiguous_count: 1,
      quality: {
        is_acceptable: true,
        blur_score: 245.9,
        brightness_score: 210.0,
        contrast_score: 61.2,
        resolution: "1500x2000",
        message: "Integrity check: Flagged multi-mark anomaly on Q10."
      },
      pipeline_steps: [
        { name: "Image Preprocessing & Quality Check", duration_ms: 39, status: "SUCCESS" },
        { name: "Canny Edge & Quadrilateral Detection", duration_ms: 74, status: "SUCCESS" },
        { name: "Four-Point Perspective Homography", duration_ms: 46, status: "SUCCESS" },
        { name: "Adaptive Gaussian Thresholding", duration_ms: 33, status: "SUCCESS" },
        { name: "Coordinate Grid Bubble Extraction", duration_ms: 66, status: "SUCCESS" },
        { name: "Dark Pixel Ratio Mark Classification", duration_ms: 26, status: "SUCCESS" },
        { name: "Answer Key Comparison & Scoring", duration_ms: 6, status: "SUCCESS" }
      ],
      answers: Array.from({ length: 50 }, (_, i) => ({
        question_number: i + 1,
        detected_answer: i === 9 ? "AMBIGUOUS" : ["A", "B", "C", "D"][i % 4],
        correct_answer: ["A", "B", "C", "D"][i % 4],
        confidence: i === 9 ? 0.45 : 0.96,
        status: i === 9 ? "AMBIGUOUS" : "CORRECT"
      }))
    }
  }
];
