import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Printer, Download, FileText, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';

export default function PrintTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/omr/templates')
      .then(res => setTemplates(res.data.templates || []))
      .catch(err => console.error("Error fetching templates:", err))
      .finally(() => setLoading(false));
  }, []);

  const standardSheets = [
    {
      id: '50q',
      name: 'Standard 50-Question OMR Sheet (A4)',
      questions: 50,
      options: 'A, B, C, D',
      description: '2-column layout (Q01-Q25, Q26-Q50), candidate ID write-in box, corner fiducial markers for phone scanning.',
      pngUrl: '/omr_templates/smart_omr_50q.png',
      pdfUrl: '/omr_templates/smart_omr_50q.pdf',
    },
    {
      id: '20q',
      name: 'Quick Assessment 20-Question Sheet (A4)',
      questions: 20,
      options: 'A, B, C, D',
      description: 'Single column compact layout ideal for chapter quizzes and formative tests.',
      pngUrl: '/omr_templates/smart_omr_20q.png',
      pdfUrl: '/omr_templates/smart_omr_20q.pdf',
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Printer className="w-4 h-4" />
            <span>Official Formats</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Printable OMR Answer Sheets</h1>
          <p className="text-xs text-slate-500">
            Download standard high-resolution PDF and PNG templates ready for home or school printing
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {standardSheets.map((sheet) => (
          <div key={sheet.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{sheet.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{sheet.questions} Questions &bull; Options {sheet.options}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] uppercase border border-blue-200">
                  Ready to Print
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {sheet.description}
              </p>

              {/* Preview Thumbnail */}
              <div className="relative aspect-[3/4] max-h-[380px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center group">
                <img
                  src={sheet.pngUrl}
                  alt={sheet.name}
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition duration-300"
                />
                <a
                  href={sheet.pngUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold space-x-1 backdrop-blur-xs"
                >
                  <span>Open Full Resolution</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
              <a
                href={sheet.pdfUrl}
                download
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF (A4)</span>
              </a>
              <a
                href={sheet.pngUrl}
                download
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>PNG Image</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Printing Guidance Card */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Printing & Scanning Best Practices</span>
        </h4>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li>Print on standard A4 paper at 100% scale without stretching or page shrinking.</li>
          <li>Ensure the four black corner target markers are clearly printed and unclipped.</li>
          <li>Students should fill bubbles fully with black or dark blue ballpoint pen.</li>
          <li>When scanning with your phone, place the sheet on a flat surface in good lighting.</li>
        </ul>
      </div>
    </div>
  );
}
