import React from 'react';
import { CheckCircle2, Clock, Sparkles, AlertTriangle } from 'lucide-react';

export default function PipelineVisualizer({ steps, totalSeconds }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Computer Vision Pipeline Execution
          </h3>
        </div>
        {totalSeconds !== undefined && (
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Total: {totalSeconds}s
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {steps.map((step, idx) => {
          const isWarn = step.status === 'warning';
          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                isWarn 
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Step {idx + 1}</span>
                  {isWarn ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>
                <h4 className="text-xs font-bold leading-tight mb-1 text-slate-900">{step.step}</h4>
                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{step.detail}</p>
              </div>
              <div className="mt-2.5 pt-1.5 border-t border-slate-200/50 flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>Speed</span>
                <span className="font-semibold text-slate-700">{step.duration_ms} ms</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
