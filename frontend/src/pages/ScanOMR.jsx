import React, { useState, useRef } from 'react';
import axios from 'axios';
import { 
  Camera, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  Printer, 
  FileText, 
  Sparkles,
  Award,
  AlertTriangle
} from 'lucide-react';
import CameraScanner from '../components/CameraScanner';
import PipelineVisualizer from '../components/PipelineVisualizer';
import VisualVerificationModal from '../components/VisualVerificationModal';

export default function ScanOMR({ exams = [], selectedExamId, setSelectedExamId, setActiveTab }) {
  const [activeMode, setActiveMode] = useState('upload'); // 'upload' or 'camera'
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fileInputRef = useRef(null);

  // Active exam object
  const safeExams = Array.isArray(exams) ? exams : [];
  const currentExam = safeExams.find(e => e.id === Number(selectedExamId)) || safeExams[0];

  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setScanError(null);
    const reader = new FileReader();
    reader.onload = (e) => setFilePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleCameraCapture = (blob, filename) => {
    const file = new File([blob], filename || "camera_omr.jpg", { type: "image/jpeg" });
    handleFileSelect(file);
    processOMR(file);
  };

  const processOMR = async (fileToProcess = selectedFile) => {
    if (!fileToProcess) {
      setScanError("Please select or capture an OMR sheet image first.");
      return;
    }
    if (!currentExam) {
      setScanError("Please select an exam first.");
      return;
    }

    setIsProcessing(true);
    setScanError(null);

    const formData = new FormData();
    formData.append('file', fileToProcess);
    formData.append('exam_id', currentExam.id);
    if (studentId.trim()) {
      formData.append('student_id', studentId.trim());
    }

    try {
      const res = await axios.post('/api/omr/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setScanResult(res.data);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message || "Failed to process OMR sheet";
      setScanError(detail);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setScanResult(null);
    setScanError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Exam Selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>AI Evaluation Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Scan & Evaluate OMR Sheet</h1>
          <p className="text-xs text-slate-500">Capture with your phone camera or upload a photo to evaluate immediately</p>
        </div>

        {/* Select Target Exam */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Target Exam:</label>
          <select
            value={currentExam?.id || ''}
            onChange={(e) => {
              setSelectedExamId(Number(e.target.value));
              setScanResult(null);
            }}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {safeExams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.question_count} Qs &bull; +{e.marks_per_question}/-{e.negative_marks})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Input Methods: Camera vs File Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Capture / Upload Form */}
        <div className="lg:col-span-6 space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveMode('upload')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-bold rounded-lg transition ${
                activeMode === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Photo</span>
            </button>
            <button
              onClick={() => setActiveMode('camera')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-bold rounded-lg transition ${
                activeMode === 'camera' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Smartphone Camera</span>
            </button>
          </div>

          {/* Student ID Write-in (Optional) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Candidate / Student Roll Number (Optional)
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. STU-2026-042 (Will auto-generate if blank)"
              className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>

          {activeMode === 'camera' ? (
            <CameraScanner onCapture={handleCameraCapture} disabled={isProcessing} />
          ) : (
            /* Drag & Drop Upload Zone */
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px]"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : "Click to select or drag OMR photograph here"}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Supports smartphone photos in JPG, PNG, or WEBP (up to 15MB)
                </p>
              </div>

              {filePreview && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{selectedFile?.name}</p>
                      <p className="text-[11px] text-slate-400">Ready to evaluate</p>
                    </div>
                  </div>
                  <button
                    onClick={() => processOMR()}
                    disabled={isProcessing}
                    className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Evaluating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Process OMR Sheet</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {scanError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Scan Evaluation Failed</p>
                <p className="mt-0.5">{scanError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Instant Results View */}
        <div className="lg:col-span-6">
          {!scanResult ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 h-full flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
                <ScanLine className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700">No OMR Sheet Evaluated Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Capture or upload an OMR answer sheet, or switch to Demo Mode to test with pre-generated sample sheets.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quality Alert / Status */}
              {scanResult.quality && (
                <div className={`p-4 rounded-xl border text-xs flex items-start space-x-3 ${
                  scanResult.quality.is_acceptable 
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                    : 'bg-amber-50/80 border-amber-200 text-amber-900'
                }`}>
                  {scanResult.quality.is_acceptable ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">{scanResult.quality.message}</p>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Blur Score: {scanResult.quality.blur_score} &bull; Brightness: {scanResult.quality.brightness_score} &bull; Resolution: {scanResult.quality.resolution}
                    </p>
                  </div>
                </div>
              )}

              {/* Score Highlight Cards */}
              <div className="bg-gradient-to-br from-white to-blue-50/40 rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Candidate</span>
                    <h3 className="text-lg font-bold text-slate-900">{scanResult.student_id}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Score</span>
                    <div className="text-2xl font-black text-blue-600">
                      {scanResult.score} <span className="text-xs font-semibold text-slate-400">/ {scanResult.total_marks}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mt-4 text-center">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/70">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Percentage</p>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">{scanResult.percentage}%</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80">
                    <p className="text-[10px] uppercase font-bold text-emerald-700">Correct</p>
                    <p className="text-base font-extrabold text-emerald-700 mt-0.5">{scanResult.correct_count}</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200/80">
                    <p className="text-[10px] uppercase font-bold text-rose-700">Wrong</p>
                    <p className="text-base font-extrabold text-rose-700 mt-0.5">{scanResult.wrong_count}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80">
                    <p className="text-[10px] uppercase font-bold text-amber-700">Ambiguous</p>
                    <p className="text-base font-extrabold text-amber-700 mt-0.5">{scanResult.ambiguous_count}</p>
                  </div>
                </div>

                {/* Visual Overlay Trigger */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Inspect Visual OMR Overlay</span>
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition"
                  >
                    Scan Another
                  </button>
                </div>
              </div>

              {/* Question-by-Question Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Question-by-Question Results ({scanResult.answers.length} Qs)
                  </h3>
                  <span className="text-[11px] text-slate-400">Scroll to view all</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Q#</th>
                        <th className="py-2.5 px-4">Detected</th>
                        <th className="py-2.5 px-4">Answer Key</th>
                        <th className="py-2.5 px-4">Confidence</th>
                        <th className="py-2.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scanResult.answers.map((ans) => {
                        const isCorrect = ans.status === 'CORRECT';
                        const isWrong = ans.status === 'WRONG';
                        const isAmb = ans.status === 'AMBIGUOUS';
                        return (
                          <tr key={ans.question_number} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-bold text-slate-800">
                              Q{ans.question_number < 10 ? `0${ans.question_number}` : ans.question_number}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold">
                              {ans.detected_answer === 'UNANSWERED' ? (
                                <span className="text-slate-400 font-normal">&mdash;</span>
                              ) : (
                                ans.detected_answer
                              )}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-semibold text-slate-600">
                              {ans.correct_answer || 'N/A'}
                            </td>
                            <td className="py-2.5 px-4 text-slate-500 font-mono">
                              {Math.round(ans.confidence * 100)}%
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {isCorrect && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                  Correct
                                </span>
                              )}
                              {isWrong && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                                  Wrong
                                </span>
                              )}
                              {isAmb && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                                  Ambiguous
                                </span>
                              )}
                              {ans.status === 'UNANSWERED' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                                  Unanswered
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Stage Visualizer */}
      {scanResult && (
        <PipelineVisualizer
          steps={scanResult.pipeline_steps}
          totalSeconds={scanResult.pipeline_steps?.reduce((a, s) => a + (s.duration_ms || 0), 0) / 1000}
        />
      )}

      {/* Visual Verification Modal */}
      {scanResult && (
        <VisualVerificationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          imageUrl={scanResult.annotated_image_url}
          warpedUrl={scanResult.warped_image_url}
          score={scanResult.score}
          percentage={scanResult.percentage}
          candidateId={scanResult.student_id}
        />
      )}
    </div>
  );
}
