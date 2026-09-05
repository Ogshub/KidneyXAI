import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const PRESET_AVATARS = [
  { id: 'doc-1', label: 'Nephrologist Dr. Alice', icon: '🩺', bg: 'from-teal-500 to-emerald-600' },
  { id: 'doc-2', label: 'Clinician Dr. David', icon: '👨‍⚕️', bg: 'from-blue-500 to-cyan-600' },
  { id: 'researcher', label: 'Dr. Sarah (Research)', icon: '🔬', bg: 'from-purple-500 to-indigo-600' },
  { id: 'patient-f', label: 'Patient Elena', icon: '👩', bg: 'from-rose-400 to-amber-500' },
  { id: 'patient-m', label: 'Patient Marcus', icon: '👨', bg: 'from-emerald-500 to-teal-700' },
  { id: 'ai-guard', label: 'KidneyCare AI Sentinel', icon: '🛡️', bg: 'from-cyan-500 to-blue-700' },
];

export const ThemeProvider = ({ children }) => {
  // ── Theme State ('light' | 'dark' | 'system') ──
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('kidneycare_theme') || 'system';
  });

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('kidneycare_theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // ── Avatar State ──
  const [avatar, setAvatarState] = useState(() => {
    return localStorage.getItem('kidneycare_avatar') || 'doc-1';
  });

  // ── Clinical Decision Support Preferences ──
  const [cdsPreferences, setCdsPreferencesState] = useState(() => {
    try {
      const saved = localStorage.getItem('kidneycare_cds_prefs');
      return saved ? JSON.parse(saved) : {
        creatinineUnit: 'mg/dL', // 'mg/dL' or 'µmol/L'
        glucoseUnit: 'mg/dL',    // 'mg/dL' or 'mmol/L'
        bimodalViewMode: 'narrative_first', // 'narrative_first' or 'shap_first'
        highContrastMode: false,
        compactDensity: false,
        soundAlerts: false,
        anonymousResearchSync: true,
      };
    } catch {
      return {
        creatinineUnit: 'mg/dL',
        glucoseUnit: 'mg/dL',
        bimodalViewMode: 'narrative_first',
        highContrastMode: false,
        compactDensity: false,
        soundAlerts: false,
        anonymousResearchSync: true,
      };
    }
  });

  // ── Synchronize Theme to DOM & Root ──
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (dark) => {
      setIsDark(dark);
      if (dark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handler = (e) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  // Apply high-contrast mode attribute if toggled
  useEffect(() => {
    if (cdsPreferences.highContrastMode) {
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }
  }, [cdsPreferences.highContrastMode]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('kidneycare_theme', newTheme);
  };

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
  };

  const setAvatar = (newAvatar) => {
    setAvatarState(newAvatar);
    localStorage.setItem('kidneycare_avatar', newAvatar);
  };

  const updateCdsPreferences = (newPrefs) => {
    setCdsPreferencesState((prev) => {
      const updated = { ...prev, ...newPrefs };
      localStorage.setItem('kidneycare_cds_prefs', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        setTheme,
        toggleTheme,
        avatar,
        setAvatar,
        presetAvatars: PRESET_AVATARS,
        cdsPreferences,
        updateCdsPreferences,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
