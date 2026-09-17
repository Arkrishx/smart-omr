import React, { useState } from 'react';
import axios from 'axios';
import { 
  Files, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  Download, 
  AlertTriangle,
  Award,
  Users
} from 'lucide-react';
import VisualVerificationModal from '../components/VisualVerificationModal';

export default function BatchScan({ exams, selectedExamId, setSelectedExamId }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchResults, setBatchResults] = useState(null);
  const [batchError, setBatchError] = useState(null);
  const [activeModalItem, setActiveModalItem] = useState(null);

  const safeExams = Array.isArray(exams) ? exams : [];
  const currentExam = safeExams.find(e => e.id === Number(selectedExamId)) || safeExams[0];

  const handleFiles = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      setBatchResults(null);
      setBatchError(null);
    }
  };

  const processBatch = async () => {
    if (!selectedFiles.length) {
      setBatchError("Please select at least one OMR image file.");
      return;
    }
    if (!currentExam) {
      setBatchError("Please select an exam first.");
      return;
    }

    setIsProcessing(true);
    setBatchError(null);

    const formData = new FormData();
    formData.append('exam_id', currentExam.id);
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await axios.post('/api/omr/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBatchResults(res.data);
    } catch (err) {
      console.error(err);
      setBatchError(err.response?.data?.detail || err.message || "Failed to process batch");
    } finally {
      setIsProcessing(false);
    }
  };

  // Export batch summary to CSV
  const exportCSV = () => {
    if (!batchResults || !batchResults.results) return;
    const headers = ["Student ID", "Filename", "Score", "Percentage", "Correct", "Wrong", "Unanswered", "Ambiguous", "Status"];
    const rows = batchResults.results.map(r => [
      r.student_id,
      r.filename,
      r.score,
      `${r.percentage}%`,
      r.correct_count,
      r.wrong_count,
      r.unanswered_count,
      r.ambiguous_count,
      r.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `batch_results_exam_${currentExam.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Exam Selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Files className="w-4 h-4" />
            <span>High-Volume Processing</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Batch OMR Sheet Scanning</h1>
          <p className="text-xs text-slate-500">Upload entire classroom sets (up to 100 images) for sequential evaluation</p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Target Exam:</label>
          <select
            value={currentExam?.id || ''}
            onChange={(e) => {
              setSelectedExamId(Number(e.target.value));
              setBatchResults(null);
            }}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {safeExams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.question_count} Qs)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[180px]">
          <input
            type="file"
            multiple
            onChange={handleFiles}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            id="batch-file-input"
          />
          <label htmlFor="batch-file-input" className="cursor-pointer flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Files className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : "Select Multiple OMR Answer Sheets"}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Select all student photos at once (JPG, PNG, WEBP)
            </p>
          </label>
        </div>

        {selectedFiles.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-800">{selectedFiles.length} Sheets Queued</p>
              <p className="text-[11px] text-slate-500">Ready to feed into computer vision pipeline</p>
            </div>
            <button
              onClick={processBatch}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Process All Sheets</span>
                </>
              )}
            </button>
          </div>
        )}

        {batchError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{batchError}</span>
          </div>
        )}
      </div>

      {/* Batch Results Table */}
      {batchResults && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Submitted</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{batchResults.total_submitted}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-emerald-600">Successfully Processed</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{batchResults.total_processed}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-blue-600">Class Average</p>
              <p className="text-2xl font-extrabold text-blue-600 mt-0.5">
                {batchResults.results.length > 0 
                  ? Math.round(batchResults.results.reduce((a, b) => a + (b.score || 0), 0) / batchResults.results.length)
                  : 0}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-amber-600">Needs Teacher Review</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-0.5">
                {batchResults.results.filter(r => r.ambiguous_count > 0).length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Batch Processing Evaluation Log</h3>
                <p className="text-xs text-slate-500">Click inspect on any student to review the detected bubbles overlay</p>
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-6">Student ID</th>
                    <th className="py-3 px-6">File Name</th>
                    <th className="py-3 px-6">Score</th>
                    <th className="py-3 px-6">Correct</th>
                    <th className="py-3 px-6">Wrong</th>
                    <th className="py-3 px-6">Ambiguous</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batchResults.results.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        {item.student_id || 'N/A'}
                      </td>
                      <td className="py-3.5 px-6 text-slate-500 font-mono">
                        {item.filename}
                      </td>
                      <td className="py-3.5 px-6 font-extrabold text-blue-600">
                        {item.score !== undefined ? `${item.score} (${item.percentage}%)` : '—'}
                      </td>
                      <td className="py-3.5 px-6 text-emerald-700 font-semibold">
                        {item.correct_count ?? '—'}
                      </td>
                      <td className="py-3.5 px-6 text-rose-700 font-semibold">
                        {item.wrong_count ?? '—'}
                      </td>
                      <td className="py-3.5 px-6 text-amber-700 font-semibold">
                        {item.ambiguous_count ?? '—'}
                      </td>
                      <td className="py-3.5 px-6">
                        {item.status === 'Review Required' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Review Required
                          </span>
                        ) : item.success ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Complete
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            Error
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {item.annotated_image_url && (
                          <button
                            onClick={() => setActiveModalItem(item)}
                            className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Visual Verification Modal for Batch Item */}
      {activeModalItem && (
        <VisualVerificationModal
          isOpen={true}
          onClose={() => setActiveModalItem(null)}
          imageUrl={activeModalItem.annotated_image_url}
          score={activeModalItem.score}
          percentage={activeModalItem.percentage}
          candidateId={activeModalItem.student_id}
        />
      )}
    </div>
  );
}
