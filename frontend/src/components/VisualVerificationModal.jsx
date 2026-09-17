import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, CheckCircle, AlertCircle, HelpCircle, Eye } from 'lucide-react';

export default function VisualVerificationModal({ imageUrl, warpedUrl, isOpen, onClose, score, percentage, candidateId }) {
  if (!isOpen || !imageUrl) return null;

  const [activeTab, setActiveTab] = useState('annotated'); // 'annotated' or 'warped'

  const displayUrl = activeTab === 'annotated' ? imageUrl : (warpedUrl || imageUrl);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Visual OMR Verification Overlay
              </h3>
              <p className="text-xs text-slate-500">
                Candidate: <span className="font-semibold text-slate-700">{candidateId || 'N/A'}</span> &bull; Score: <span className="font-bold text-blue-600">{score} ({percentage}%)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={imageUrl}
              download="omr_verified.jpg"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Image</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher & Legend */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('annotated')}
              className={`px-3 py-1 rounded-md font-bold transition ${
                activeTab === 'annotated' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Detection Overlay
            </button>
            {warpedUrl && (
              <button
                onClick={() => setActiveTab('warped')}
                className={`px-3 py-1 rounded-md font-bold transition ${
                  activeTab === 'warped' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rectified Top-Down
              </button>
            )}
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-3 font-semibold text-[11px]">
            <span className="flex items-center space-x-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Correct Answer</span>
            </span>
            <span className="flex items-center space-x-1 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Wrong Answer</span>
            </span>
            <span className="flex items-center space-x-1 text-blue-700">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-blue-500 inline-block" />
              <span>Answer Key</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Ambiguous</span>
            </span>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 flex items-center justify-center min-h-[450px]">
          <img
            src={displayUrl}
            alt="OMR Verification View"
            className="max-h-[75vh] w-auto object-contain rounded shadow-lg border border-slate-800"
          />
        </div>

        {/* Footer Note */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          This verification view confirms actual pixel detection, homography matrix perspective correction, and bubble fill analysis.
        </div>
      </div>
    </div>
  );
}
