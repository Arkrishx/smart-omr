import React, { useState } from 'react';
import axios from 'axios';
import { PlusCircle, CheckCircle2, Sparkles, BookOpen, Layers } from 'lucide-react';

export default function CreateExam({ onExamCreated }) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [questionCount, setQuestionCount] = useState(50);
  const [optionsCount, setOptionsCount] = useState(4);
  const [marksPerQuestion, setMarksPerQuestion] = useState(2.0);
  const [negativeMarks, setNegativeMarks] = useState(0.5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) {
      setMessage({ type: 'error', text: 'Exam Name and Subject are required.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await axios.post('/api/exams', {
        name: name.trim(),
        subject: subject.trim(),
        class_name: className.trim() || null,
        question_count: Number(questionCount),
        options_per_question: Number(optionsCount),
        marks_per_question: Number(marksPerQuestion),
        negative_marks: Number(negativeMarks)
      });

      setMessage({ type: 'success', text: `Examination "${res.data.name}" created successfully!` });
      if (onExamCreated) {
        onExamCreated(res.data);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.detail || err.message || 'Failed to create exam' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create New Examination</h1>
            <p className="text-xs text-slate-500">Configure questions count, marks per question, and negative marking</p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-xs font-semibold mb-6 flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Exam Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Computer Science Midterm Examination 2026"
              required
              className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Computer Science"
                required
                className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Class / Grade (Optional)
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. Grade 12 Section B"
                className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Number of Questions
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              >
                <option value={20}>20 Questions (Mini Test)</option>
                <option value={50}>50 Questions (Standard OMR Sheet)</option>
                <option value={100}>100 Questions (Full Assessment)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Options per Question
              </label>
              <select
                value={optionsCount}
                onChange={(e) => setOptionsCount(Number(e.target.value))}
                className="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              >
                <option value={4}>4 Options (A, B, C, D)</option>
                <option value={5}>5 Options (A, B, C, D, E)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Marks per Correct Answer (+)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={marksPerQuestion}
                onChange={(e) => setMarksPerQuestion(parseFloat(e.target.value) || 1)}
                className="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Negative Marking per Wrong Answer (-)
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
              <p className="text-[10px] text-slate-400 mt-1">Set to 0 if negative marking is not applicable</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSubmitting ? "Creating..." : "Create Examination"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
