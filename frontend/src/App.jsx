import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DEFAULT_EXAMS } from './data/mockData';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ScanOMR from './pages/ScanOMR';
import BatchScan from './pages/BatchScan';
import CreateExam from './pages/CreateExam';
import AnswerKeyEditor from './pages/AnswerKeyEditor';
import ExamAnalytics from './pages/ExamAnalytics';
import DemoMode from './pages/DemoMode';
import PrintTemplates from './pages/PrintTemplates';
import BackendSettingsModal from './components/BackendSettingsModal';
import { CloudOff, Sparkles, Settings2, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [exams, setExams] = useState(DEFAULT_EXAMS);
  const [selectedExamId, setSelectedExamId] = useState(DEFAULT_EXAMS[0].id);
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backendUrl, setBackendUrl] = useState(
    localStorage.getItem('SMART_OMR_BACKEND_URL') || import.meta.env.VITE_API_URL || 'https://nine-cups-hug.loca.lt'
  );

  // Fetch all exams from backend
  const refreshExams = async () => {
    try {
      const res = await axios.get('/api/exams');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setExams(res.data);
        if (!selectedExamId) {
          setSelectedExamId(res.data[0].id);
        }
        setBackendOnline(true);
      } else {
        // Fallback to local default exams if backend returns non-array or empty
        setExams(DEFAULT_EXAMS);
        setBackendOnline(false);
      }
    } catch (err) {
      console.warn("Backend connection check failed, using pre-seeded demo exams:", err);
      setExams(DEFAULT_EXAMS);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshExams();
  }, []);

  const handleUrlUpdated = (newUrl, newExams) => {
    setBackendUrl(newUrl);
    setExams(newExams);
    if (newExams.length > 0) {
      setSelectedExamId(newExams[0].id);
    }
    setBackendOnline(true);
  };

  const handleExamCreated = (newExam) => {
    setExams(prev => [newExam, ...(Array.isArray(prev) ? prev : [])]);
    setSelectedExamId(newExam.id);
    setActiveTab('answer_key'); // Proceed directly to configuring answer key
  };

  const safeExams = Array.isArray(exams) && exams.length > 0 ? exams : DEFAULT_EXAMS;
  const currentSelectedExam = safeExams.find(e => e.id === selectedExamId) || safeExams[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedExam={currentSelectedExam}
        exams={safeExams}
        backendOnline={backendOnline}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Backend Status Notification Strip */}
      <div className={`text-xs px-4 py-2 transition-colors ${
        backendOnline 
          ? 'bg-slate-900 text-slate-300 border-b border-slate-800' 
          : 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] tracking-wider uppercase ${
              backendOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-400 text-slate-950'
            }`}>
              {backendOnline ? 'CV Engine Live' : 'Demo Mode'}
            </span>
            <span className="font-medium text-slate-200">
              {backendOnline 
                ? `Connected to OpenCV Backend: ${backendUrl}`
                : 'Using pre-seeded demo exams & simulation.'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow-sm transition"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{backendOnline ? 'Change API URL' : 'Connect Backend'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backend Configuration Modal */}
      <BackendSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUrl={backendUrl}
        onUrlUpdated={handleUrlUpdated}
        backendOnline={backendOnline}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'dashboard' && (
          <Dashboard
            exams={safeExams}
            setActiveTab={setActiveTab}
            setSelectedExamId={setSelectedExamId}
          />
        )}

        {activeTab === 'scan' && (
          <ScanOMR
            exams={safeExams}
            selectedExamId={selectedExamId}
            setSelectedExamId={setSelectedExamId}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'batch' && (
          <BatchScan
            exams={safeExams}
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
            exams={safeExams}
            selectedExamId={selectedExamId}
            setSelectedExamId={setSelectedExamId}
          />
        )}

        {activeTab === 'analytics' && (
          <ExamAnalytics
            exams={safeExams}
            selectedExamId={selectedExamId}
            setSelectedExamId={setSelectedExamId}
          />
        )}

        {activeTab === 'demo' && (
          <DemoMode
            exams={safeExams}
            selectedExamId={selectedExamId}
            setSelectedExamId={setSelectedExamId}
            backendOnline={backendOnline}
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
