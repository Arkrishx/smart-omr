import React from 'react';
import { 
  Camera, 
  LayoutDashboard, 
  ScanLine, 
  Files, 
  PlusCircle, 
  KeyRound, 
  BarChart3, 
  Sparkles, 
  Printer, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, selectedExam, exams, backendOnline }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scan', label: 'Scan OMR', icon: ScanLine },
    { id: 'batch', label: 'Batch Scan', icon: Files },
    { id: 'create_exam', label: 'Create Exam', icon: PlusCircle },
    { id: 'answer_key', label: 'Answer Keys', icon: KeyRound },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'demo', label: 'Demo Mode', icon: Sparkles, badge: 'Live' },
    { id: 'templates', label: 'Print Templates', icon: Printer },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/25">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">Smart<span className="text-blue-600">OMR</span></span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-md">
                  AI CV
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none hidden sm:block">Turn Any Smartphone into an OMR Scanner</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.2 text-[9px] font-extrabold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Status & Active Exam */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50">
              <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-slate-600 hidden sm:inline">{backendOnline ? 'CV Engine Ready' : 'Backend Offline'}</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Scroll */}
        <div className="md:hidden flex overflow-x-auto py-2 space-x-1 border-t border-slate-100 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-shrink-0 flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  isActive ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
