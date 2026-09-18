import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, ZoomIn, ZoomOut, Download, CheckCircle, AlertCircle, HelpCircle, Eye, RefreshCw, ExternalLink } from 'lucide-react';

export default function VisualVerificationModal({ imageUrl, warpedUrl, fallbackUrl, isOpen, onClose, score, percentage, candidateId }) {
  if (!isOpen || (!imageUrl && !fallbackUrl)) return null;

  const [activeTab, setActiveTab] = useState('annotated'); // 'annotated', 'warped', or 'original'
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  const resolveUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    // If it starts with /uploads, resolve against the connected backend API URL
    if (url.startsWith('/uploads')) {
      let backendBase = (
        axios.defaults.baseURL || 
        localStorage.getItem('SMART_OMR_BACKEND_URL') || 
        import.meta.env.VITE_API_URL || 
        ''
      ).trim().replace(/\/+$/, '');
      if (backendBase && !/^https?:\/\//i.test(backendBase)) {
        backendBase = `https://${backendBase}`;
      }
      return backendBase ? `${backendBase}${url}` : url;
    }
    return url;
  };

  const getRawUrl = () => {
    if (activeTab === 'original' && fallbackUrl) return fallbackUrl;
    if (activeTab === 'warped' && warpedUrl) return warpedUrl;
    return imageUrl || fallbackUrl;
  };

  const rawUrl = getRawUrl();
  const displayUrl = resolveUrl(rawUrl);

  useEffect(() => {
    setImgLoading(true);
    setImgError(false);
  }, [displayUrl, activeTab]);

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
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
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
            {fallbackUrl && (
              <button
                onClick={() => setActiveTab('original')}
                className={`px-3 py-1 rounded-md font-bold transition ${
                  activeTab === 'original' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Original Scan
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
        <div className="relative flex-1 overflow-auto p-4 bg-slate-950 flex items-center justify-center min-h-[450px]">
          {imgLoading && !imgError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-xs">Loading verified overlay image...</p>
            </div>
          )}

          {imgError ? (
            <div className="text-center p-8 max-w-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Image Preview Notice</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  The evaluated image was stored on your cloud container. You can open the raw image directly or view your uploaded copy.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                {fallbackUrl && activeTab !== 'original' && (
                  <button
                    onClick={() => setActiveTab('original')}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition border border-slate-700"
                  >
                    <span>View Original Upload</span>
                  </button>
                )}
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Raw Image</span>
                </a>
              </div>
            </div>
          ) : (
            <img
              src={displayUrl}
              alt="OMR Verification View"
              onLoad={() => setImgLoading(false)}
              onError={() => {
                setImgLoading(false);
                setImgError(true);
              }}
              className={`max-h-[75vh] w-auto object-contain rounded shadow-lg border border-slate-800 transition-opacity duration-200 ${
                imgLoading ? 'opacity-0' : 'opacity-100'
              }`}
            />
          )}
        </div>

        {/* Footer Note */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          This verification view confirms actual pixel detection, homography matrix perspective correction, and bubble fill analysis.
        </div>
      </div>
    </div>
  );
}
