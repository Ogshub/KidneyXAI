import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Activity, 
  HeartPulse, 
  BarChart3, 
  Compass, 
  History, 
  User, 
  LogOut, 
  Menu, 
  X,
  FileText,
  Award,
  Sun,
  Moon,
  Settings as SettingsIcon
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme, avatar, presetAvatars, isBrutalist } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = isAuthenticated
    ? [
        { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
        { name: 'Risk Assessment', path: '/assessment', icon: HeartPulse },
        { name: 'Daily Tracker', path: '/tracker', icon: Activity },
        { name: 'Recommendations', path: '/recommendations', icon: Compass },
        { name: 'History', path: '/history', icon: History },
        { name: 'Evaluation Analytics', path: '/analytics', icon: Award },
      ]
    : [
        { name: 'Home', path: '/' },
        { name: 'Evaluation Analytics', path: '/analytics', icon: Award },
        { name: 'Research Survey', path: '/research-survey', icon: FileText },
      ];

  const isActive = (path) => location.pathname === path;

  // Render Mini Avatar
  const renderNavbarAvatar = () => {
    // Check for real profile picture from user context
    const profilePicUrl = user?.profilePictureUrl;
    if (profilePicUrl) {
      return (
        <img
          src={profilePicUrl}
          alt="Avatar"
          className={`w-6 h-6 object-cover shrink-0 ${
            isBrutalist
              ? 'border-[2px] border-[var(--brutalist-black)]'
              : 'rounded-full ring-2 ring-teal-500/40'
          }`}
        />
      );
    }

    if (avatar?.startsWith('data:image/')) {
      return (
        <img
          src={avatar}
          alt="Avatar"
          className={`w-6 h-6 object-cover shrink-0 ${
            isBrutalist
              ? 'border-[2px] border-[var(--brutalist-black)]'
              : 'rounded-full ring-2 ring-teal-500/40'
          }`}
        />
      );
    }
    const preset = presetAvatars.find((p) => p.id === avatar) || presetAvatars[0];

    if (isBrutalist) {
      return (
        <div className="w-6 h-6 bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)] text-[11px] flex items-center justify-center font-black border-[2px] border-[var(--brutalist-black)] shrink-0">
          {preset.icon}
        </div>
      );
    }

    return (
      <div
        className={`w-6 h-6 rounded-full bg-gradient-to-tr ${preset.bg} text-[11px] flex items-center justify-center text-white ring-2 ring-teal-500/40 shrink-0 font-bold`}
      >
        {preset.icon}
      </div>
    );
  };

  // ── Brutalist Navbar ──
  if (isBrutalist) {
    return (
      <header className="sticky top-0 z-40 bg-[var(--bg-surface)] border-b-[3px] border-[var(--border-subtle)] transition-colors duration-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-[var(--brutalist-red)] text-white flex items-center justify-center border-[2px] border-[var(--brutalist-black)] shrink-0">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-[var(--text-main)] uppercase">
                  Kidney<span className="text-[var(--brutalist-red)]">Care</span>
                </span>
                <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-black bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)] border-[2px] border-[var(--brutalist-black)] uppercase tracking-wider">
                  XAI
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`h-10 flex items-center gap-2 px-3 text-xs font-black uppercase tracking-wider border-[2px] transition-colors ${
                      isActive(item.path)
                        ? 'border-[var(--brutalist-black)] bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)]'
                        : 'border-transparent text-[var(--text-main)] hover:border-[var(--brutalist-black)] hover:bg-[var(--brutalist-yellow)] hover:text-[var(--brutalist-black)]'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right side actions */}
            <div className="hidden md:flex items-center gap-1.5">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="h-10 w-10 flex items-center justify-center text-[var(--text-main)] border-[2px] border-transparent hover:border-[var(--brutalist-black)] hover:bg-[var(--brutalist-yellow)] hover:text-[var(--brutalist-black)] transition-colors cursor-pointer shrink-0"
                title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {isAuthenticated ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/profile"
                    className={`h-10 flex items-center gap-2 px-3 text-xs font-black uppercase tracking-wider border-[2px] transition-colors shrink-0 ${
                      isActive('/profile')
                        ? 'border-[var(--brutalist-black)] bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)]'
                        : 'border-transparent text-[var(--text-main)] hover:border-[var(--brutalist-black)] hover:bg-[var(--brutalist-yellow)] hover:text-[var(--brutalist-black)]'
                    }`}
                  >
                    {renderNavbarAvatar()}
                    <span>{user?.name?.split(' ')[0] || 'Profile'}</span>
                  </Link>

                  <Link
                    to="/settings"
                    className={`h-10 w-10 flex items-center justify-center border-[2px] transition-colors shrink-0 ${
                      isActive('/settings')
                        ? 'border-[var(--brutalist-black)] bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)]'
                        : 'border-transparent text-[var(--text-main)] hover:border-[var(--brutalist-black)] hover:bg-[var(--brutalist-yellow)] hover:text-[var(--brutalist-black)]'
                    }`}
                    title="Settings"
                  >
                    <SettingsIcon className="w-5 h-5" />
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="h-10 flex items-center gap-1.5 px-3 text-xs font-black uppercase tracking-wider text-[var(--brutalist-red)] border-[2px] border-transparent hover:border-[var(--brutalist-black)] hover:bg-[var(--brutalist-red)] hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Exit</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/settings"
                    className={`h-10 w-10 flex items-center justify-center border-[2px] transition-colors shrink-0 ${
                      isActive('/settings')
                        ? 'border-[var(--brutalist-black)] bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)]'
                        : 'border-transparent text-[var(--text-main)] hover:border-[var(--brutalist-black)] hover:bg-[var(--brutalist-yellow)] hover:text-[var(--brutalist-black)]'
                    }`}
                    title="Settings"
                  >
                    <SettingsIcon className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="h-10 flex items-center px-4 text-xs font-black uppercase tracking-wider border-[2px] border-transparent text-[var(--text-main)] hover:border-[var(--brutalist-black)] hover:bg-[var(--brutalist-yellow)] hover:text-[var(--brutalist-black)] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="h-10 flex items-center px-4 text-xs font-black uppercase tracking-wider text-white bg-[var(--brutalist-red)] hover:bg-[var(--brutalist-black)] border-[2px] border-[var(--brutalist-black)] transition-all shadow-xs"
                  >
                    Get Started ↗
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <div className="flex items-center gap-1 md:hidden">
              <button
                onClick={toggleTheme}
                className="p-2 text-[var(--text-main)] hover:bg-[var(--brutalist-yellow)]"
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[var(--text-main)] hover:bg-[var(--brutalist-yellow)] border-[2px] border-[var(--brutalist-black)]"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown — Brutalist */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-[3px] border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 pt-2 pb-4 space-y-0">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm font-black uppercase tracking-wider ${
                  isActive(item.path)
                    ? 'bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)]'
                    : 'text-[var(--text-main)] hover:bg-[var(--brutalist-yellow)]'
                }`}
              >
                {item.name}
              </Link>
            ))}
            {isAuthenticated ? (
              <div className="pt-2 border-t-[3px] border-[var(--border-subtle)] space-y-0 mt-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-black uppercase text-[var(--text-main)] hover:bg-[var(--brutalist-yellow)]"
                >
                  {renderNavbarAvatar()} Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-black uppercase text-[var(--text-main)] hover:bg-[var(--brutalist-yellow)]"
                >
                  <SettingsIcon className="w-5 h-5" /> Settings
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="w-full text-left px-3 py-2 text-sm font-black uppercase text-[var(--brutalist-red)] hover:bg-[var(--brutalist-red)] hover:text-white"
                >
                  Sign Out ↗
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t-[3px] border-[var(--border-subtle)] space-y-2 mt-2">
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-black uppercase text-[var(--text-main)] hover:bg-[var(--brutalist-yellow)]"
                >
                  Settings
                </Link>
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 border-[3px] border-[var(--border-subtle)] text-xs font-black uppercase text-[var(--text-main)]"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 bg-[var(--brutalist-red)] text-white border-[3px] border-[var(--brutalist-black)] text-xs font-black uppercase"
                  >
                    Get Started ↗
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </header>
    );
  }

  // ── Clinical (default) Navbar ──
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100">
                KidneyCare<span className="text-teal-600 dark:text-teal-400">.XAI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded">
                Decision Support
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
              title={isDark ? 'Switch to Light Theme' : 'Switch to Midnight Dark Theme'}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400 hover:rotate-90 transition-transform duration-300" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600 hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Profile & Avatar Badge */}
                <Link
                  to="/profile"
                  className={`h-10 flex items-center gap-2 px-3 rounded-xl text-sm font-medium border transition-colors shrink-0 ${
                    isActive('/profile')
                      ? 'border-teal-500 text-teal-700 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/40'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {renderNavbarAvatar()}
                  <span>{user?.name?.split(' ')[0] || 'Profile'}</span>
                </Link>

                {/* Settings Gear */}
                <Link
                  to="/settings"
                  className={`h-10 w-10 flex items-center justify-center rounded-xl transition-colors shrink-0 ${
                    isActive('/settings')
                      ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Settings & Preferences"
                >
                  <SettingsIcon className="w-5 h-5" />
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="h-10 flex items-center gap-1.5 px-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/settings"
                  className={`h-10 w-10 flex items-center justify-center rounded-xl transition-colors shrink-0 ${
                    isActive('/settings')
                      ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Settings"
                >
                  <SettingsIcon className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="h-10 flex items-center px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="h-10 flex items-center px-4 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-sm transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu and theme toggle */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isActive(item.path)
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.name}
            </Link>
          ))}
          {isAuthenticated ? (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {renderNavbarAvatar()}
                Profile Details
              </Link>
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <SettingsIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Settings & Avatars
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Settings & Themes
              </Link>
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
