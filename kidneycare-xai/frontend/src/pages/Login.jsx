import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Alert } from '../components/common';
import { 
  HeartPulse, 
  LogIn, 
  Shield, 
  Activity, 
  Sun, 
  Moon, 
  ArrowLeft, 
  Palette, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Award
} from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const { isDark, toggleTheme, isBrutalist, setThemeStyle, themeStyle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email: formData.email.trim(), password: formData.password });
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleStyle = () => {
    setThemeStyle(isBrutalist ? 'clinical' : 'brutalist');
  };

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-200 relative overflow-hidden ${
        isBrutalist
          ? 'bg-[var(--bg-page)] text-[var(--text-main)]'
          : 'bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/30 text-slate-900 dark:text-slate-100'
      }`}
    >
      {/* ─────────────────────────────────────────────────────────────
          LEFT COLUMN: Clinical AI Intelligence Showcase (Desktop)
          ───────────────────────────────────────────────────────────── */}
      <section
        className={`hidden lg:flex lg:w-7/12 flex-col justify-between p-10 xl:p-14 relative overflow-hidden border-r ${
          isBrutalist
            ? 'border-r-[3px] border-[var(--border-subtle)] bg-[var(--bg-surface)] [background-image:radial-gradient(var(--border-subtle)_1px,transparent_1px)] [background-size:24px_24px]'
            : 'border-r border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-teal-950/5 via-slate-900/5 to-teal-500/5 dark:from-teal-950/50 dark:via-slate-950 dark:to-slate-900'
        }`}
      >
        {/* Subtle glowing ambient spheres for Clinical theme */}
        {!isBrutalist && (
          <>
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-teal-500/15 dark:bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          </>
        )}

        {/* Top: Branding & Tagline */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div
              className={`w-12 h-12 flex items-center justify-center ${
                isBrutalist
                  ? 'bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)] border-[3px] border-[var(--brutalist-black)] shadow-[4px_4px_0px_0px_var(--brutalist-black)]'
                  : 'rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-500/30'
              }`}
            >
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span
                className={`text-xl font-black tracking-tight ${
                  isBrutalist ? 'text-[var(--text-main)] uppercase' : 'text-slate-900 dark:text-white'
                }`}
              >
                KidneyCare<span className={isBrutalist ? 'text-[var(--brutalist-red)]' : 'text-teal-600 dark:text-teal-400'}>-XAI</span>
              </span>
              <p
                className={`text-xs ${
                  isBrutalist ? 'font-bold uppercase tracking-wider text-[var(--text-muted)]' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Clinical Renal Intelligence Platform
              </p>
            </div>
          </div>

          <h2
            className={`text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight max-w-xl ${
              isBrutalist ? 'uppercase' : 'text-slate-900 dark:text-white'
            }`}
          >
            Explainable AI for Chronic Kidney Disease Early Risk Detection
          </h2>
          <p
            className={`mt-3 text-sm xl:text-base max-w-lg leading-relaxed ${
              isBrutalist ? 'text-[var(--text-muted)] font-semibold' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Combining 10-fold cross-validated machine learning with real-time TreeSHAP feature attribution to eliminate the black-box dilemma in nephrology diagnostics.
          </p>
        </div>

        {/* Center: Live Interactive Decision Engine Preview Card */}
        <div className="relative z-10 my-8">
          <div
            className={`p-6 transition-all ${
              isBrutalist
                ? 'bg-[var(--bg-page)] border-[3px] border-[var(--border-subtle)] shadow-[6px_6px_0px_0px_var(--brutalist-black)] dark:shadow-[6px_6px_0px_0px_#f5f0e8]'
                : 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-900/5 dark:shadow-black/40'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span
                  className={`text-xs font-mono font-bold ${
                    isBrutalist ? 'uppercase tracking-wider' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  LIVE SHAP WATERFALL SIMULATION • PATIENT #KC-8842
                </span>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 font-bold rounded-full ${
                  isBrutalist
                    ? 'border-[2px] border-[var(--brutalist-black)] bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)] uppercase'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}
              >
                11.4% (Low Risk)
              </span>
            </div>

            {/* TreeSHAP Feature Attribution Rows */}
            <div className="space-y-3">
              {[
                { name: 'Serum Creatinine', value: '0.85 mg/dL', shap: '-0.44', label: 'Healthy clearance', type: 'protective', width: '75%' },
                { name: 'Blood Pressure', value: '115/75 mmHg', shap: '-0.31', label: 'Optimal vitals', type: 'protective', width: '55%' },
                { name: 'Hemoglobin', value: '15.0 g/dL', shap: '-0.25', label: 'Normal RBC profile', type: 'protective', width: '45%' },
                { name: 'Patient Age', value: '48 years', shap: '+0.09', label: 'Demographic factor', type: 'risk', width: '25%' },
              ].map((item) => (
                <div key={item.name} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {item.name} <span className="font-mono text-slate-400">({item.value})</span>
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        item.type === 'protective'
                          ? isBrutalist ? 'text-emerald-700 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'
                          : isBrutalist ? 'text-[var(--brutalist-red)]' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      SHAP {item.shap} ({item.label})
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    {item.type === 'protective' ? (
                      <div
                        className={`h-full rounded-full ${
                          isBrutalist ? 'bg-emerald-500' : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                        }`}
                        style={{ width: item.width }}
                      />
                    ) : (
                      <div
                        className={`h-full rounded-full ml-auto ${
                          isBrutalist ? 'bg-[var(--brutalist-red)]' : 'bg-rose-500'
                        }`}
                        style={{ width: item.width }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span>Every individual prediction delivers deterministic feature weights and KDIGO-aligned clinical interventions.</span>
            </p>
          </div>
        </div>

        {/* Bottom: Research Rigor & Standards Metrics */}
        <div className="relative z-10 pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p
                className={`text-2xl xl:text-3xl font-black ${
                  isBrutalist ? 'text-[var(--brutalist-red)]' : 'text-teal-600 dark:text-teal-400'
                }`}
              >
                98.50%
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                10-Fold CV Accuracy
              </p>
            </div>
            <div>
              <p
                className={`text-2xl xl:text-3xl font-black ${
                  isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-900 dark:text-white'
                }`}
              >
                0.9981
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                AUROC Discrimination
              </p>
            </div>
            <div>
              <p
                className={`text-2xl xl:text-3xl font-black ${
                  isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-900 dark:text-white'
                }`}
              >
                3,047
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Multi-Cohort Cases
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT COLUMN: Authentication Portal Form
          ───────────────────────────────────────────────────────────── */}
      <section className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-10 xl:p-14 relative z-10">
        {/* Top Header: Navigation & Theme Switchers */}
        <header className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className={`inline-flex items-center gap-2 text-xs font-bold transition-colors ${
              isBrutalist
                ? 'px-3 py-1.5 border-[2px] border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--brutalist-yellow)] hover:text-[var(--brutalist-black)] uppercase tracking-wider'
                : 'px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:border-teal-500 dark:hover:border-teal-400'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Style switcher toggle */}
            <button
              type="button"
              onClick={toggleStyle}
              className={`inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors ${
                isBrutalist
                  ? 'px-3 py-1.5 border-[2px] border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--brutalist-yellow)] hover:text-[var(--brutalist-black)] uppercase tracking-wider'
                  : 'px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:border-teal-500 dark:hover:border-teal-400'
              }`}
              title={`Switch style (current: ${themeStyle})`}
            >
              <Palette className="w-3.5 h-3.5 text-teal-500" />
              <span className="hidden sm:inline">{isBrutalist ? 'Brutalist' : 'Clinical'}</span>
            </button>

            {/* Dark/Light mode toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`w-9 h-9 flex items-center justify-center cursor-pointer transition-colors ${
                isBrutalist
                  ? 'border-[2px] border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--brutalist-yellow)] hover:text-[var(--brutalist-black)]'
                  : 'rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:border-teal-500 dark:hover:border-teal-400'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </header>

        {/* Center: Sign In Form Box */}
        <div className="w-full max-w-md mx-auto my-auto animate-fade-in-up">
          <div className="mb-6">
            <h1
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isBrutalist ? 'uppercase tracking-wide text-[var(--text-main)]' : 'text-slate-900 dark:text-white'
              }`}
            >
              Welcome Back
            </h1>
            <p
              className={`text-sm mt-1.5 ${
                isBrutalist ? 'text-[var(--text-muted)] font-bold uppercase tracking-wider' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Sign in to manage risk assessments, explore TreeSHAP waterfall graphs, and log daily lifestyle habits.
            </p>
          </div>

          {/* Error display */}
          {error && (
            <Alert type="danger" className="mb-5" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className={`block text-xs font-bold mb-1.5 ${
                  isBrutalist ? 'text-[var(--text-main)] uppercase tracking-wider' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className={`w-full pl-10 pr-4 py-3 text-sm transition-all duration-150 focus:outline-none ${
                    isBrutalist
                      ? 'bg-[var(--bg-surface)] border-[3px] border-[var(--border-subtle)] text-[var(--text-main)] font-semibold focus:border-[var(--brutalist-red)]'
                      : 'rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className={`block text-xs font-bold ${
                    isBrutalist ? 'text-[var(--text-main)] uppercase tracking-wider' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className={`w-full pl-10 pr-10 py-3 text-sm transition-all duration-150 focus:outline-none ${
                    isBrutalist
                      ? 'bg-[var(--bg-surface)] border-[3px] border-[var(--border-subtle)] text-[var(--text-main)] font-semibold focus:border-[var(--brutalist-red)]'
                      : 'rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                isBrutalist
                  ? 'bg-[var(--brutalist-red)] hover:bg-[var(--brutalist-yellow)] text-white hover:text-[var(--brutalist-black)] border-[3px] border-[var(--brutalist-black)] uppercase tracking-wider shadow-[4px_4px_0px_0px_var(--brutalist-black)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                  : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white rounded-xl shadow-lg shadow-teal-600/30 active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Security & Explainability Highlights */}
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            {[
              { icon: Shield, label: 'HMAC-SHA256 JWT' },
              { icon: Activity, label: 'SHAP Explainability' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className={`flex items-center gap-2 p-2.5 transition-colors ${
                  isBrutalist
                    ? 'border-[2px] border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] font-black uppercase text-[10px]'
                    : 'bg-slate-100/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 rounded-xl text-xs text-slate-600 dark:text-slate-400 font-medium'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isBrutalist ? 'text-[var(--brutalist-red)]' : 'text-teal-600 dark:text-teal-400'}`} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div
            className={`mt-6 pt-5 text-center text-xs transition-colors ${
              isBrutalist
                ? 'border-t-[2px] border-[var(--border-subtle)] text-[var(--text-muted)] font-bold uppercase tracking-wider'
                : 'border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className={`font-bold transition-colors ${
                isBrutalist
                  ? 'text-[var(--brutalist-red)] hover:text-[var(--brutalist-black)] underline'
                  : 'text-teal-600 dark:text-teal-400 hover:underline'
              }`}
            >
              Create Account ↗
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <footer className="mt-8 text-center">
          <p
            className={`text-[11px] ${
              isBrutalist
                ? 'text-[var(--text-muted)] font-black uppercase tracking-wider'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            KidneyCare-XAI &copy; 2026 • Clinical AI Decision Support System
          </p>
        </footer>
      </section>
    </div>
  );
};
