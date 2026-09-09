import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Alert } from '../components/common';
import { HeartPulse, UserPlus, ShieldCheck, Sun, Moon, ArrowLeft, Palette } from 'lucide-react';

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
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl" />
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
            Create Account
          </h1>
          <p
            className={`text-xs sm:text-sm mt-1.5 ${
              isBrutalist ? 'text-[var(--text-muted)] font-semibold uppercase tracking-wider' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Join KidneyCare-XAI for personalized explainable risk tracking
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
          {error && (
            <Alert type="danger" className="mb-4" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', name: 'name', type: 'text', placeholder: 'e.g. Alex Morgan', autoComplete: 'name' },
              { label: 'Email Address', name: 'email', type: 'email', placeholder: 'alex@example.com', autoComplete: 'email' },
              { label: 'Password', name: 'password', type: 'password', placeholder: 'At least 6 characters', autoComplete: 'new-password' },
              { label: 'Confirm Password', name: 'confirmPassword', type: 'password', placeholder: 'Confirm your password', autoComplete: 'new-password' },
            ].map(({ label, name, type, placeholder, autoComplete }) => (
              <div key={name}>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isBrutalist ? 'text-[var(--text-main)] uppercase tracking-wider' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {label}
                </label>
                <input
                  type={type}
                  name={name}
                  placeholder={placeholder}
                  value={formData[name]}
                  onChange={handleChange}
                  required
                  autoComplete={autoComplete}
                  className={`w-full px-3.5 py-2.5 text-sm transition-all duration-150 focus:outline-none ${
                    isBrutalist
                      ? 'bg-[var(--bg-surface)] border-[3px] border-[var(--border-subtle)] text-[var(--text-main)] font-semibold focus:border-[var(--brutalist-red)]'
                      : 'rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500'
                  }`}
                />
              </div>
            ))}

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
                KidneyCare-XAI is an educational decision-support tool. Always consult a qualified physician for diagnosis.
              </p>
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
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div
            className={`mt-6 pt-5 text-center text-xs transition-colors ${
              isBrutalist
                ? 'border-t-[2px] border-[var(--border-subtle)] text-[var(--text-muted)] font-bold uppercase tracking-wider'
                : 'border-t border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400'
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
              Sign In
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
