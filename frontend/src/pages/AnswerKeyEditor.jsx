import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { KeyRound, CheckCircle2, Save, FileSpreadsheet, RefreshCw, AlertCircle } from 'lucide-react';

export default function AnswerKeyEditor({ exams, selectedExamId, setSelectedExamId }) {
  const currentExam = exams.find(e => e.id === Number(selectedExamId)) || exams[0];
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [showCsvModal, setShowCsvModal] = useState(false);

  const questionCount = currentExam ? currentExam.question_count : 50;
  const optionLabels = ["A", "B", "C", "D", "E"].slice(0, currentExam?.options_per_question || 4);

  // Load existing answer key
  const fetchAnswerKey = async () => {
    if (!currentExam) return;
    setLoading(true);
    setSaveStatus(null);
    try {
      const res = await axios.get(`/api/exams/${currentExam.id}`);
      const existing = res.data.answer_key || {};
      const filled = {};
      for (let q = 1; q <= questionCount; q++) {
        filled[q] = existing[q] || existing[String(q)] || "";
      }
      setAnswers(filled);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnswerKey();
  }, [currentExam?.id]);

  const selectOption = (qNum, opt) => {
    setAnswers(prev => ({ ...prev, [qNum]: opt }));
    setSaveStatus(null);
  };

  const fillPattern = (pattern) => {
    const newAnswers = {};
    for (let q = 1; q <= questionCount; q++) {
      if (pattern === 'alternating') {
        newAnswers[q] = optionLabels[(q - 1) % optionLabels.length];
      } else {
        newAnswers[q] = pattern;
      }
    }
    setAnswers(newAnswers);
  };

  const handleSave = async () => {
    if (!currentExam) return;

    // Validate
    const missing = [];
    for (let q = 1; q <= questionCount; q++) {
      if (!answers[q]) missing.push(q);
    }

    if (missing.length > 0) {
      setSaveStatus({
        type: 'error',
        text: `Missing answers for ${missing.length} questions (e.g. Q${missing[0]}). Please complete all questions.`
      });
      return;
    }

    setSaving(true);
    setSaveStatus(null);

    const payload = {
      answers: Object.entries(answers).map(([q, ans]) => ({
        question_number: Number(q),
        correct_answer: ans
      }))
    };

    try {
      await axios.post(`/api/exams/${currentExam.id}/answer-key`, payload);
      setSaveStatus({ type: 'success', text: `Saved all ${questionCount} answers successfully!` });
    } catch (err) {
      console.error(err);
      setSaveStatus({ type: 'error', text: err.response?.data?.detail || err.message || "Failed to save key" });
    } finally {
      setSaving(false);
    }
  };

  const importCsv = () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split('\n');
    const newAns = { ...answers };
    let parsedCount = 0;

    lines.forEach(line => {
      const parts = line.split(/[,\t\s]+/);
      if (parts.length >= 2) {
        const qNum = parseInt(parts[0].replace(/\D/g, ''));
        const opt = parts[1].trim().toUpperCase();
        if (qNum > 0 && qNum <= questionCount && optionLabels.includes(opt)) {
          newAns[qNum] = opt;
          parsedCount++;
        }
      }
    });

    setAnswers(newAns);
    setShowCsvModal(false);
    setSaveStatus({ type: 'success', text: `Successfully imported ${parsedCount} answers from CSV.` });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Exam Selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <KeyRound className="w-4 h-4" />
            <span>Master Key Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Answer Key Matrix Editor</h1>
          <p className="text-xs text-slate-500">Configure the official answers used to evaluate student submissions</p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Exam:</label>
          <select
            value={currentExam?.id || ''}
            onChange={(e) => setSelectedExamId(Number(e.target.value))}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.question_count} Qs)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Tools:</span>
          <button
            onClick={() => fillPattern('alternating')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700 transition"
          >
            Pattern A-B-C-D
          </button>
          <button
            onClick={() => setShowCsvModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import CSV</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-1.5 px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Key..." : "Save Answer Key"}</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {saveStatus && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
          saveStatus.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{saveStatus.text}</span>
        </div>
      )}

      {/* Matrix Grid: Organized in Columns of 25 */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: questionCount }).map((_, idx) => {
            const qNum = idx + 1;
            const currentAns = answers[qNum];
            return (
              <div
                key={qNum}
                className="flex items-center justify-between p-2 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition"
              >
                <span className="font-bold text-xs text-slate-700 font-mono w-10">
                  Q{qNum < 10 ? `0${qNum}` : qNum}
                </span>

                <div className="flex items-center space-x-1">
                  {optionLabels.map((opt) => {
                    const isSelected = currentAns === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => selectOption(qNum, opt)}
                        className={`w-7 h-7 rounded-full text-xs font-bold transition ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-400'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Import Answers from CSV</h3>
            <p className="text-xs text-slate-500">Paste comma-separated rows with Question and Answer: e.g. 1,A</p>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="1,A&#10;2,B&#10;3,C&#10;4,D&#10;5,A"
              className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={importCsv}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Apply Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
