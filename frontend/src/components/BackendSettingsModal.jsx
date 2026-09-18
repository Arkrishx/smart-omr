import React, { useState } from 'react';
import axios from 'axios';
import { Server, CheckCircle2, AlertCircle, RefreshCw, X, Globe, Link2 } from 'lucide-react';

export default function BackendSettingsModal({ isOpen, onClose, currentUrl, onUrlUpdated, backendOnline }) {
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    let target = urlInput.trim().replace(/\/+$/, ''); // Strip trailing slashes
    if (!target) {
      setTestResult({ type: 'error', message: 'Please enter a backend URL.' });
      return;
    }

    if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Test request to /api/exams
      const res = await axios.get(`${target}/api/exams`, {
        headers: { 'Bypass-Tunnel-Reminder': 'true' },
        timeout: 8000
      });

      if (Array.isArray(res.data)) {
        localStorage.setItem('SMART_OMR_BACKEND_URL', target);
        axios.defaults.baseURL = target;
        setTestResult({
          type: 'success',
          message: `Connected successfully! Found ${res.data.length} exams in database.`
        });
        if (onUrlUpdated) {
          onUrlUpdated(target, res.data);
        }
      } else {
        setTestResult({
          type: 'error',
          message: 'Endpoint replied, but did not return exam data. Ensure it is the Smart OMR backend.'
        });
      }
    } catch (err) {
      console.error(err);
      setTestResult({
        type: 'error',
        message: err.response?.data?.detail || err.message || 'Connection failed. Check the URL and ensure backend is running.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleResetToTunnel = () => {
    setUrlInput('https://nine-cups-hug.loca.lt');
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              backendOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
            }`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Backend API Connection</h3>
              <p className="text-xs text-slate-400">Configure OpenCV Python server connection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Status Pill */}
        <div className={`p-4 rounded-2xl border text-xs flex items-start space-x-3 ${
          backendOnline ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}>
          {backendOnline ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold">
              {backendOnline ? 'CV Backend Online & Connected' : 'Backend Currently Disconnected'}
            </p>
            <p className="text-[11px] opacity-80 mt-0.5">
              {backendOnline
                ? `Connected to: ${currentUrl || '(Same Domain / Default)'}`
                : 'Using interactive demo simulation. Connect to the public tunnel below for live smartphone camera evaluation.'}
            </p>
          </div>
        </div>

        {/* URL Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Backend Endpoint URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://your-backend.onrender.com or https://xxx.loca.lt"
                className="w-full text-xs font-mono px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 pr-10"
              />
              <Link2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports live public tunnels (<span className="font-mono">loca.lt</span>), Render (<span className="font-mono">onrender.com</span>), or Railway.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleResetToTunnel}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
            >
              Use Live Tunnel (https://nine-cups-hug.loca.lt)
            </button>
          </div>

          {/* Test Status */}
          {testResult && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
              testResult.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {testResult.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span className="font-medium">{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleTestAndSave}
            disabled={testing}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50"
          >
            {testing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Testing Connection...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connect & Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
