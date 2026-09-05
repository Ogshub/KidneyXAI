import React from 'react';
import { AlertTriangle, ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto border-t border-slate-800">
      {/* Medical Disclaimer Banner */}
      <div className="bg-amber-950/40 border-b border-amber-500/20 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed">
            <strong className="text-amber-300 font-semibold block sm:inline mr-1">
              Important Medical Disclaimer:
            </strong>
            KidneyCare-XAI is an educational research and lifestyle decision-support prototype. It does NOT provide clinical diagnoses or replace professional medical consultations, laboratory testing, or physician guidance. If you experience symptoms or have preexisting conditions, please consult a qualified healthcare professional.
          </div>
        </div>
      </div>

      {/* Main footer contents */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold text-sm">
                K
              </div>
              <span className="text-white font-bold text-base tracking-tight">KidneyCare-XAI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              An explainable machine learning decision-support framework integrating SHAP interpretability, clinical feature analysis, lifestyle tracking, and rule-based preventive health guidance.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Transparent AI • Rule Traceability • Longitudinal Tracking</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/dashboard" className="hover:text-teal-400 transition-colors">Dashboard</Link></li>
              <li><Link to="/assessment" className="hover:text-teal-400 transition-colors">Risk Assessment</Link></li>
              <li><Link to="/tracker" className="hover:text-teal-400 transition-colors">Daily Tracker</Link></li>
              <li><Link to="/recommendations" className="hover:text-teal-400 transition-colors">Recommendations</Link></li>
              <li><Link to="/history" className="hover:text-teal-400 transition-colors">History & Trends</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Research & Ethics</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/research-survey" className="hover:text-teal-400 transition-colors">Dataset B Survey</Link></li>
              <li><span className="text-slate-500">FastAPI ML Service (SHAP)</span></li>
              <li><span className="text-slate-500">Spring Boot Orchestration</span></li>
              <li><span className="text-slate-500">PostgreSQL / Supabase</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} KidneyCare-XAI. Academic Research Prototype.
          </div>
          <div className="flex items-center gap-1">
            <span>Built with Explainable Artificial Intelligence</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
