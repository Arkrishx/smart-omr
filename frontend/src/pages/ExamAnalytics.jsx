import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, Users, Award, TrendingUp, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';

export default function ExamAnalytics({ exams = [], selectedExamId, setSelectedExamId }) {
  const safeExams = Array.isArray(exams) ? exams : [];
  const currentExam = safeExams.find(e => e.id === Number(selectedExamId)) || safeExams[0];
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    if (!currentExam) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/exams/${currentExam.id}/analytics`);
      setAnalytics(res.data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [currentExam?.id]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Exam Selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Diagnostic Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Examination Analytics & Item Difficulty</h1>
          <p className="text-xs text-slate-500">Analyze overall performance and question-by-question discrimination metrics</p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Exam:</label>
          <select
            value={currentExam?.id || ''}
            onChange={(e) => setSelectedExamId(Number(e.target.value))}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {safeExams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!analytics || analytics.total_sheets_scanned === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">No Submissions Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Scan answer sheets or switch to Demo Mode to view rich performance analytics and difficulty charts.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center space-x-2 text-slate-400 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Submissions</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">{analytics.total_sheets_scanned}</h3>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center space-x-2 text-blue-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Average Score</span>
              </div>
              <h3 className="text-2xl font-extrabold text-blue-600">{analytics.average_score}</h3>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                <Award className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Highest Score</span>
              </div>
              <h3 className="text-2xl font-extrabold text-emerald-600">{analytics.highest_score}</h3>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center space-x-2 text-rose-600 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Lowest Score</span>
              </div>
              <h3 className="text-2xl font-extrabold text-rose-600">{analytics.lowest_score}</h3>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Pass Rate</span>
              </div>
              <h3 className="text-2xl font-extrabold text-indigo-600">{analytics.pass_percentage}%</h3>
            </div>
          </div>

          {/* Question-by-Question Difficulty Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Question Difficulty & Discrimination Analysis</h3>
                <p className="text-xs text-slate-500">Evaluates accuracy per question to help teachers identify challenging concepts</p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-semibold">
                <span className="flex items-center space-x-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Correct</span>
                </span>
                <span className="flex items-center space-x-1.5 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Wrong</span>
                </span>
                <span className="flex items-center space-x-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span>Blank</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-6 w-16">Q#</th>
                    <th className="py-3 px-6">Success Distribution</th>
                    <th className="py-3 px-6 w-28 text-center">Correct %</th>
                    <th className="py-3 px-6 w-28 text-center">Wrong %</th>
                    <th className="py-3 px-6 w-28 text-center">Unanswered %</th>
                    <th className="py-3 px-6 w-32 text-right">Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(analytics.question_difficulty || []).map((q) => (
                    <tr key={q.question_number} className="hover:bg-slate-50/70">
                      <td className="py-3 px-6 font-bold text-slate-800 font-mono">
                        Q{q.question_number < 10 ? `0${q.question_number}` : q.question_number}
                      </td>
                      <td className="py-3 px-6">
                        {/* Stacked Progress Bar */}
                        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                          <div
                            style={{ width: `${q.correct_percentage}%` }}
                            className="bg-emerald-500 h-full transition-all"
                            title={`Correct: ${q.correct_percentage}%`}
                          />
                          <div
                            style={{ width: `${q.wrong_percentage}%` }}
                            className="bg-rose-400 h-full transition-all"
                            title={`Wrong: ${q.wrong_percentage}%`}
                          />
                          <div
                            style={{ width: `${q.unanswered_percentage}%` }}
                            className="bg-slate-300 h-full transition-all"
                            title={`Unanswered: ${q.unanswered_percentage}%`}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-6 text-center font-bold text-emerald-700">
                        {q.correct_percentage}%
                      </td>
                      <td className="py-3 px-6 text-center font-bold text-rose-700">
                        {q.wrong_percentage}%
                      </td>
                      <td className="py-3 px-6 text-center text-slate-500">
                        {q.unanswered_percentage}%
                      </td>
                      <td className="py-3 px-6 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          q.difficulty === 'Easy'
                            ? 'bg-emerald-100 text-emerald-800'
                            : q.difficulty === 'Moderate'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {q.difficulty}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
