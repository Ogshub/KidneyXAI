import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Alert } from '../components/common';
import { 
  HeartPulse, 
  UserPlus, 
  ShieldCheck, 
  Sun, 
  Moon, 
  ArrowLeft, 
  Palette, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Sparkles,
  Activity,
  ShieldAlert
} from 'lucide-react';

export const Register = () => {
  const { register } = useAuth();
  const { isDark, toggleTheme, isBrutalist, setThemeStyle, themeStyle } = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
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

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please check your information.';
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
          LEFT COLUMN: Clinical Intelligence Onboarding Showcase
          ───────────────────────────────────────────────────────────── */}
      <section
        className={`hidden lg:flex lg:w-7/12 flex-col justify-between p-10 xl:p-14 relative overflow-hidden border-r ${
          isBrutalist
            ? 'border-r-[3px] border-[var(--border-subtle)] bg-[var(--bg-surface)] [background-image:radial-gradient(var(--border-subtle)_1px,transparent_1px)] [background-size:24px_24px]'
            : 'border-r border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-teal-950/5 via-slate-900/5 to-teal-500/5 dark:from-teal-950/50 dark:via-slate-950 dark:to-slate-900'
        }`}
      >
        {!isBrutalist && (
          <>
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-teal-500/15 dark:bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
          </>
        )}

        {/* Top: Branding */}
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
            Start Your Transparent Kidney Health Journey Today
          </h2>
          <p
            className={`mt-3 text-sm xl:text-base max-w-lg leading-relaxed ${
              isBrutalist ? 'text-[var(--text-muted)] font-semibold' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Register to unlock explainable renal risk analysis, longitudinal health monitoring, and deterministic clinical recommendations.
          </p>
        </div>

        {/* Center: Feature Cards */}
        <div className="relative z-10 my-8 space-y-4 max-w-xl">
          {[
            {
              title: 'Dual-Mode Assessment Architecture',
              desc: 'Screen yourself from home with zero blood tests needed, or analyze full 24-biomarker lab slips.',
              icon: Sparkles,
            },
            {
              title: 'Explainable AI with TreeSHAP',
              desc: 'Never guess what drove a prediction. Every score is dissected into positive and negative clinical feature weights.',
              icon: Activity,
            },
            {
              title: 'KDIGO 2024 Clinical Directives',
              desc: 'Receive deterministic behavioral guidelines across hydration, sodium restriction, exercise, and medication cautions.',
              icon: CheckCircle2,
            },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`p-4 transition-all flex items-start gap-4 ${
                  isBrutalist
                    ? 'bg-[var(--bg-page)] border-[2px] border-[var(--border-subtle)] shadow-[4px_4px_0px_0px_var(--brutalist-black)] dark:shadow-[4px_4px_0px_0px_#f5f0e8]'
                    : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl'
                }`}
              >
                <div
                  className={`w-9 h-9 flex items-center justify-center shrink-0 ${
                    isBrutalist
                      ? 'bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)] border-[2px] border-[var(--brutalist-black)]'
                      : 'rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4
                    className={`text-sm font-bold ${
                      isBrutalist ? 'uppercase tracking-wide text-[var(--text-main)]' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {feature.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Trust Strip */}
        <div className="relative z-10 pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Trained on multi-cohort clinical datasets from UCI Machine Learning Repository, PubMed Central, and Kaggle.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT COLUMN: Register Form
          ───────────────────────────────────────────────────────────── */}
      <section className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-10 xl:p-14 relative z-10">
        {/* Top Header */}
        <header className="flex items-center justify-between mb-6">
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

            <button
              type="button"
              onClick={toggleTheme}
              className={`w-9 h-9 flex items-center justify-center cursor-pointer transition-colors ${
                isBrutalist
                  ? 'border-[2px] border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--brutalist-yellow)] hover:text-[var(--brutalist-black)]'
                  : 'rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:border-teal-500 dark:hover:border-teal-400'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </header>

        {/* Center: Register Form */}
        <div className="w-full max-w-md mx-auto my-auto animate-fade-in-up">
          <div className="mb-6">
            <h1
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isBrutalist ? 'uppercase tracking-wide text-[var(--text-main)]' : 'text-slate-900 dark:text-white'
              }`}
            >
              Create Account
            </h1>
            <p
              className={`text-sm mt-1.5 ${
                isBrutalist ? 'text-[var(--text-muted)] font-bold uppercase tracking-wider' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Join KidneyCare-XAI to access personalized explainable kidney risk assessments.
            </p>
          </div>

          {error && (
            <Alert type="danger" className="mb-5" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className={`block text-xs font-bold mb-1.5 ${
                  isBrutalist ? 'text-[var(--text-main)] uppercase tracking-wider' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Alex Morgan"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  className={`w-full pl-10 pr-4 py-3 text-sm transition-all duration-150 focus:outline-none ${
                    isBrutalist
                      ? 'bg-[var(--bg-surface)] border-[3px] border-[var(--border-subtle)] text-[var(--text-main)] font-semibold focus:border-[var(--brutalist-red)]'
                      : 'rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500'
                  }`}
                />
              </div>
            </div>

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
                  placeholder="alex@example.com"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isBrutalist ? 'text-[var(--text-main)] uppercase tracking-wider' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="At least 6 chars"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    className={`w-full pl-10 pr-9 py-3 text-sm transition-all duration-150 focus:outline-none ${
                      isBrutalist
                        ? 'bg-[var(--bg-surface)] border-[3px] border-[var(--border-subtle)] text-[var(--text-main)] font-semibold focus:border-[var(--brutalist-red)]'
                        : 'rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isBrutalist ? 'text-[var(--text-main)] uppercase tracking-wider' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    className={`w-full pl-10 pr-4 py-3 text-sm transition-all duration-150 focus:outline-none ${
                      isBrutalist
                        ? 'bg-[var(--bg-surface)] border-[3px] border-[var(--border-subtle)] text-[var(--text-main)] font-semibold focus:border-[var(--brutalist-red)]'
                        : 'rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Clinical Disclaimer */}
            <div
              className={`flex items-start gap-2.5 p-3 transition-colors ${
                isBrutalist
                  ? 'border-[2px] border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)]'
                  : 'bg-amber-500/10 border border-amber-500/20 rounded-xl'
              }`}
            >
              <ShieldCheck
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  isBrutalist ? 'text-[var(--brutalist-red)]' : 'text-amber-500 dark:text-amber-400'
                }`}
              />
              <p
                className={`text-xs leading-relaxed ${
                  isBrutalist ? 'font-bold uppercase tracking-wide text-[10px]' : 'text-amber-900 dark:text-amber-200/90'
                }`}
              >
                KidneyCare-XAI is an educational decision-support platform. Always consult a qualified nephrologist or clinician for medical diagnosis.
              </p>
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
                  <span>Creating Account…</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Free Account</span>
                </>
              )}
            </button>
          </form>

          <div
            className={`mt-6 pt-5 text-center text-xs transition-colors ${
              isBrutalist
                ? 'border-t-[2px] border-[var(--border-subtle)] text-[var(--text-muted)] font-bold uppercase tracking-wider'
                : 'border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              className={`font-bold transition-colors ${
                isBrutalist
                  ? 'text-[var(--brutalist-red)] hover:text-[var(--brutalist-black)] underline'
                  : 'text-teal-600 dark:text-teal-400 hover:underline'
              }`}
            >
              Sign In ↗
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
