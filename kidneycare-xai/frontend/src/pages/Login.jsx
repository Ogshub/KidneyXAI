import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Alert } from '../components/common';
import { HeartPulse, LogIn, Shield, Activity, Sun, Moon, ArrowLeft, Palette } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const { isDark, toggleTheme, isBrutalist, setThemeStyle, themeStyle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({ email: '', password: '' });
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

  const handleFillDemo = () => {
    setFormData({ email: 'alice@kidneycare.org', password: 'SecurePassword123!' });
    setError('');
  };

  const toggleStyle = () => {
    setThemeStyle(isBrutalist ? 'clinical' : 'brutalist');
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200 relative overflow-hidden ${
        isBrutalist
          ? 'bg-[var(--bg-page)] text-[var(--text-main)]'
          : 'bg-gradient-to-br from-slate-50 via-teal-50/40 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/40 text-slate-900 dark:text-slate-100'
      }`}
    >
      {/* Background ambient lighting for Clinical mode */}
      {!isBrutalist && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl" />
        </div>
      )}

      {/* Top action header: back to home + theme controls */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <Link
          to="/"
          className={`inline-flex items-center gap-2 text-xs font-bold transition-colors ${
            isBrutalist
              ? 'px-3 py-1.5 border-[2px] border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--brutalist-yellow)] hover:text-[var(--brutalist-black)] uppercase tracking-wider'
              : 'px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Style switcher toggle */}
          <button
            type="button"
            onClick={toggleStyle}
            className={`inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors ${
              isBrutalist
                ? 'px-3 py-1.5 border-[2px] border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--brutalist-yellow)] hover:text-[var(--brutalist-black)] uppercase tracking-wider'
                : 'px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:border-teal-500 dark:hover:border-teal-400'
            }`}
            title={`Current: ${themeStyle}. Click to switch theme style.`}
          >
            <Palette className="w-3.5 h-3.5 text-teal-500" />
            <span className="hidden sm:inline">{isBrutalist ? 'Brutalist Style' : 'Clinical Style'}</span>
          </button>

          {/* Dark/Light mode toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-9 h-9 flex items-center justify-center cursor-pointer transition-colors ${
              isBrutalist
                ? 'border-[2px] border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--brutalist-yellow)] hover:text-[var(--brutalist-black)]'
                : 'rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:border-teal-500 dark:hover:border-teal-400'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Dark Mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* Main card */}
      <main className="relative z-10 w-full max-w-md mx-auto my-6 animate-fade-in-up">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center justify-center w-14 h-14 mb-4 ${
              isBrutalist
                ? 'bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)] border-[3px] border-[var(--brutalist-black)] shadow-[4px_4px_0px_0px_var(--brutalist-black)]'
                : 'rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-500/30'
            }`}
          >
            <HeartPulse className="w-7 h-7" />
          </div>
          <h1
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isBrutalist ? 'text-[var(--text-main)] uppercase tracking-wide' : 'text-slate-900 dark:text-white'
            }`}
          >
            KidneyCare<span className={isBrutalist ? 'text-[var(--brutalist-red)]' : 'text-teal-600 dark:text-teal-400'}>-XAI</span>
          </h1>
          <p
            className={`text-xs sm:text-sm mt-1.5 ${
              isBrutalist ? 'text-[var(--text-muted)] font-semibold uppercase tracking-wider' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Explainable AI for Chronic Kidney Disease Risk Assessment
          </p>
        </div>

        {/* Authentication Box */}
        <div
          className={`p-6 sm:p-8 transition-all ${
            isBrutalist
              ? 'bg-[var(--bg-surface)] border-[3px] border-[var(--border-subtle)] shadow-[6px_6px_0px_0px_var(--brutalist-black)] dark:shadow-[6px_6px_0px_0px_#f5f0e8] rounded-none'
              : 'bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-900/5 dark:shadow-black/40'
          }`}
        >
          {/* Demo Account Quick-Fill */}
          <div
            className={`mb-5 p-3.5 flex items-center justify-between ${
              isBrutalist
                ? 'bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)] border-[2px] border-[var(--brutalist-black)] shadow-[3px_3px_0px_0px_var(--brutalist-black)]'
                : 'bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/25 dark:border-teal-500/30 rounded-2xl'
            }`}
          >
            <div>
              <p
                className={`text-xs font-bold ${
                  isBrutalist ? 'uppercase tracking-wider text-[var(--brutalist-black)]' : 'text-teal-900 dark:text-teal-200'
                }`}
              >
                Pre-Configured Clinician Demo
              </p>
              <p
                className={`text-[11px] font-mono mt-0.5 ${
                  isBrutalist ? 'text-[var(--brutalist-black)]/80 font-bold' : 'text-teal-700 dark:text-teal-300/80'
                }`}
              >
                alice@kidneycare.org
              </p>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                isBrutalist
                  ? 'bg-[var(--brutalist-black)] text-white hover:bg-[var(--brutalist-red)] border-[2px] border-[var(--brutalist-black)] uppercase tracking-wider'
                  : 'bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-md shadow-teal-600/30'
              }`}
            >
              Auto-fill
            </button>
          </div>

          {error && (
            <Alert type="danger" className="mb-4" onClose={() => setError('')}>
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
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className={`w-full px-3.5 py-2.5 text-sm transition-all duration-150 focus:outline-none ${
                  isBrutalist
                    ? 'bg-[var(--bg-surface)] border-[3px] border-[var(--border-subtle)] text-[var(--text-main)] font-semibold focus:border-[var(--brutalist-red)]'
                    : 'rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500'
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-xs font-bold mb-1.5 ${
                  isBrutalist ? 'text-[var(--text-main)] uppercase tracking-wider' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className={`w-full px-3.5 py-2.5 text-sm transition-all duration-150 focus:outline-none ${
                  isBrutalist
                    ? 'bg-[var(--bg-surface)] border-[3px] border-[var(--border-subtle)] text-[var(--text-main)] font-semibold focus:border-[var(--brutalist-red)]'
                    : 'rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                isBrutalist
                  ? 'bg-[var(--brutalist-red)] hover:bg-[var(--brutalist-yellow)] text-white hover:text-[var(--brutalist-black)] border-[3px] border-[var(--brutalist-black)] uppercase tracking-wider shadow-[3px_3px_0px_0px_var(--brutalist-black)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                  : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white rounded-xl shadow-lg shadow-teal-600/25'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Feature badges */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {[
              { icon: Shield, label: 'JWT Secured' },
              { icon: Activity, label: 'SHAP Explainable' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className={`flex items-center gap-2 p-2 transition-colors ${
                  isBrutalist
                    ? 'border-[2px] border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] font-black uppercase text-[10px]'
                    : 'bg-slate-100 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 rounded-xl text-xs text-slate-600 dark:text-slate-400 font-medium'
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
                : 'border-t border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400'
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
              Create account
            </Link>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 w-full text-center py-2">
        <p
          className={`text-[11px] ${
            isBrutalist
              ? 'text-[var(--text-muted)] font-black uppercase tracking-wider'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          KidneyCare-XAI &copy; 2026 — Explainable Clinical AI Decision Support
        </p>
      </footer>
    </div>
  );
};
