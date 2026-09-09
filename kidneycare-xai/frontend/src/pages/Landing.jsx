import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartPulse, 
  BrainCircuit, 
  Activity, 
  ShieldAlert, 
  ArrowRight, 
  LineChart, 
  CheckCircle2, 
  Sparkles, 
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '../components/common';
import { FeatureImportanceChart } from '../components/charts';

export const Landing = () => {
  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-6 pb-12 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Explainable AI • Clinical Machine Learning Decision Support
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Personalized Kidney Health Risk Intelligence <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700">
              Powered by Transparent AI
            </span>
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            KidneyCare-XAI bridges clinical machine learning with local SHAP feature explanations, rule-based preventive guidance, and longitudinal lifestyle monitoring.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/register">
              <Button size="lg" icon={ArrowRight} className="shadow-lg shadow-teal-600/20">
                Start Risk Assessment
              </Button>
            </Link>
            <Link to="/analytics">
              <Button size="lg" variant="secondary" icon={FileSpreadsheet}>
                Explore Multi-Cohort Analytics (3,047 Records)
              </Button>
            </Link>
          </div>

          {/* Research & Disclaimer Notice */}
          <div className="p-4 mt-6 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-left max-w-2xl mx-auto flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="font-semibold text-amber-950">Academic Decision Support Notice:</strong> This framework assists in risk awareness and educational guidance. It is NOT a diagnostic tool and does not replace certified clinical lab testing or nephrologist consultation.
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars (4-step pipeline) */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            The KidneyCare-XAI Framework
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            A cohesive 4-step pipeline ensuring algorithmic transparency and personalized actionability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">01. Predict</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Machine Learning</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Calibrated classifiers (XGBoost / Random Forest) trained on clinical markers like creatinine, urea, and albumin to evaluate kidney risk profile.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-1">02. Explain</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">SHAP Interpretability</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deconstructs model decisions into exact positive and negative feature contributions so patients understand the rationale behind every score.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">03. Recommend</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Traceable Rules</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent clinical and lifestyle heuristics with explicit "Why am I seeing this?" justifications and priority classifications.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">04. Monitor</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Lifestyle Tracking</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Longitudinal tracking of hydration, exercise, sleep, and sodium intake to encourage healthy behavioral modifications over time.
            </p>
          </div>
        </div>
      </section>

      {/* Global Feature Importance Preview */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <LineChart className="w-3.5 h-3.5 text-teal-600" />
              Global Model Transparency
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How the AI Evaluates Biomarkers
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Instead of an opaque black box, our model exposes both population-level feature weightings and localized individual SHAP scores. Markers like Serum Creatinine, Hemoglobin, and Blood Urea are key indicators monitored by the engine.
            </p>
            <ul className="space-y-2.5 pt-2 text-sm text-slate-700">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Local explainability per assessment with exact SHAP directionality</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Deterministic rules ensuring medical safety bounds</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Composite Lifestyle Progress Score to track day-to-day adherence</span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Model Global Feature Importance (SHAP Mean)</h3>
            <FeatureImportanceChart height={260} />
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-10 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Ready to assess your kidney health profile?
        </h2>
        <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
          Create an account to input your clinical values, visualize your SHAP breakdown, and log daily hydration and lifestyle metrics.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold">
              Create Free Account
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              Sign In to Existing Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
