import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ScanOMR from './pages/ScanOMR';
import BatchScan from './pages/BatchScan';
import CreateExam from './pages/CreateExam';
import AnswerKeyEditor from './pages/AnswerKeyEditor';
import ExamAnalytics from './pages/ExamAnalytics';
import DemoMode from './pages/DemoMode';
import PrintTemplates from './pages/PrintTemplates';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch all exams from backend
  const refreshExams = async () => {
    try {
      const res = await axios.get('/api/exams');
      const examList = res.data || [];
      setExams(examList);
      if (examList.length > 0 && !selectedExamId) {
        setSelectedExamId(examList[0].id);
      }
      setBackendOnline(true);
    } catch (err) {
      console.warn("Backend connection check failed:", err);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshExams();
  }, []);

  const handleExamCreated = (newExam) => {
    setExams(prev => [newExam, ...prev]);
    setSelectedExamId(newExam.id);
    setActiveTab('answer_key'); // Proceed directly to configuring answer key
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedExam={exams.find(e => e.id === selectedExamId)}
        exams={exams}
        backendOnline={backendOnline}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'dashboard' && (
          <Dashboard
            exams={exams}
            setActiveTab={setActiveTab}
            setSelectedExamId={setSelectedExamId}
          />
        )}

        {activeTab === 'scan' && (
          <ScanOMR
            exams={exams}
            selectedExamId={selectedExamId}
            setSelectedExamId={setSelectedExamId}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'batch' && (
          <BatchScan
            exams={exams}
            selectedExamId={selectedExamId}
            setSelectedExamId={setSelectedExamId}
          />
        )}

        {activeTab === 'create_exam' && (
          <CreateExam
            onExamCreated={handleExamCreated}
          />
        )}

        {activeTab === 'answer_key' && (
          <AnswerKeyEditor
            exams={exams}
            selectedExamId={selectedExamId}
            setSelectedExamId={setSelectedExamId}
          />
        )}

        {activeTab === 'analytics' && (
          <ExamAnalytics
            exams={exams}
            selectedExamId={selectedExamId}
            setSelectedExamId={setSelectedExamId}
          />
        )}

        {activeTab === 'demo' && (
          <DemoMode
            exams={exams}
            selectedExamId={selectedExamId}
            setSelectedExamId={setSelectedExamId}
          />
        )}

        {activeTab === 'templates' && (
          <PrintTemplates />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-700">
            Smart OMR &mdash; AI-Powered Smartphone OMR Evaluation Platform
          </p>
          <p className="text-[11px] text-slate-400">
            Engineered with OpenCV, Python FastAPI & React &bull; 100% Deterministic CV Detection
          </p>
        </div>
      </footer>
    </div>
  );
}
