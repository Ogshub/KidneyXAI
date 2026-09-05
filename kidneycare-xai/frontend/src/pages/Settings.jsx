import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  User, 
  Moon, 
  Sun, 
  Laptop, 
  Camera, 
  Upload, 
  Sliders, 
  ShieldCheck, 
  Download, 
  Trash2, 
  Check, 
  Save, 
  Activity, 
  Sparkles,
  FileCode,
  Bell,
  Eye,
  HeartPulse
} from 'lucide-react';
import { Card, Button, Input, Select, Badge, Alert } from '../components/common';

export const Settings = () => {
  const { user, updateUser } = useAuth();
  const { 
    theme, 
    setTheme, 
    isDark, 
    avatar, 
    setAvatar, 
    presetAvatars, 
    cdsPreferences, 
    updateCdsPreferences 
  } = useTheme();

  const fileInputRef = useRef(null);

  // ── Tab State ──
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'appearance' | 'cds' | 'privacy'

  // ── Profile Fields ──
  const [profileName, setProfileName] = useState(user?.name || 'Alice Smith');
  const [profileRole, setProfileRole] = useState(user?.role || 'CLINICIAN');
  const [affiliation, setAffiliation] = useState(localStorage.getItem('kidneycare_affiliation') || 'Renal Decision Unit');
  const [phone, setPhone] = useState(localStorage.getItem('kidneycare_phone') || '+1 (555) 234-5678');

  // ── CDS Preferences State ──
  const [localCds, setLocalCds] = useState(cdsPreferences);

  // ── Feedback State ──
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // ── Custom Image Upload Handler ──
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).', 'danger');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size exceeds 2MB limit. Please choose a smaller photo.', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result;
      if (base64Data) {
        setAvatar(base64Data);
        showToast('Custom profile photo uploaded and saved.');
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Save Profile Details ──
  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUser({ name: profileName, role: profileRole });
    localStorage.setItem('kidneycare_affiliation', affiliation);
    localStorage.setItem('kidneycare_phone', phone);
    showToast('Profile demographics and clinician details updated successfully.');
  };

  // ── Save CDS Preferences ──
  const handleSaveCds = () => {
    updateCdsPreferences(localCds);
    showToast('Clinical decision support preferences and units saved.');
  };

  // ── Export Health Data Snapshot (JSON) ──
  const handleExportData = () => {
    const exportPayload = {
      exportDate: new Date().toISOString(),
      user: {
        name: profileName,
        email: user?.email,
        role: profileRole,
        affiliation,
      },
      preferences: localCds,
      appVersion: 'KidneyCare-XAI v1.0 (IEEE Novelty Baseline)',
      guidelinesConformity: 'KDIGO 2024 Clinical Practice Guideline',
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kidneycare_profile_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Exported clinical profile snapshot to JSON file.');
  };

  // ── Clear Local Cache ──
  const handleClearCache = () => {
    if (window.confirm('Reset all local preferences, custom avatar, and theme cache to system defaults?')) {
      localStorage.removeItem('kidneycare_avatar');
      localStorage.removeItem('kidneycare_theme');
      localStorage.removeItem('kidneycare_cds_prefs');
      localStorage.removeItem('kidneycare_affiliation');
      localStorage.removeItem('kidneycare_phone');
      setAvatar('doc-1');
      setTheme('system');
      showToast('Local application cache reset to defaults.');
    }
  };

  // ── Render Active Avatar Element ──
  const renderCurrentAvatar = (size = 'w-24 h-24 text-3xl') => {
    if (avatar?.startsWith('data:image/')) {
      return (
        <img
          src={avatar}
          alt="Avatar Preview"
          className={`${size} rounded-2xl object-cover ring-4 ring-teal-500/30 shadow-md`}
        />
      );
    }

    const preset = presetAvatars.find((p) => p.id === avatar) || presetAvatars[0];
    return (
      <div
        className={`${size} rounded-2xl bg-gradient-to-tr ${preset.bg} text-white flex items-center justify-center ring-4 ring-teal-500/30 shadow-md font-bold`}
      >
        <span>{preset.icon}</span>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 transition-colors duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            System & Personalization Preferences
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Settings & Workspace
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Customize your clinical avatar, dark theme palette, medical unit standards, and privacy controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isDark ? 'teal' : 'default'} size="lg">
            {isDark ? '🌙 Dark Mode Active' : '☀️ Light Mode Active'}
          </Badge>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <Alert type={toastType} onClose={() => setToastMessage('')}>
          {toastMessage}
        </Alert>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          Profile & Avatar Studio
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'appearance'
              ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Moon className="w-4 h-4" />
          Dark Theme & Display
        </button>

        <button
          onClick={() => setActiveTab('cds')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'cds'
              ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          Clinical Units & XAI Preferences
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Data & Privacy Controls
        </button>
      </div>

      {/* ── TAB 1: Profile & Avatar Studio ── */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Avatar Studio Card */}
          <Card
            title="Profile Photo & Avatars"
            subtitle="Choose a clinical avatar or upload your photo"
            icon={Camera}
            className="lg:col-span-1"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                {renderCurrentAvatar()}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-xl bg-teal-600 text-white shadow-lg hover:bg-teal-700 transition-all cursor-pointer"
                  title="Upload Custom Photo"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">{profileName}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || 'clinician@kidneycare.org'}</p>
                <div className="mt-1">
                  <Badge variant="teal">{profileRole}</Badge>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <div className="w-full pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  icon={Upload}
                  className="w-full"
                >
                  Upload Custom Photo
                </Button>
              </div>

              {/* Preset Avatars Grid */}
              <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 text-left">
                  Or pick a clinical persona:
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {presetAvatars.map((preset) => {
                    const isSelected = avatar === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setAvatar(preset.id);
                          showToast(`Selected avatar: ${preset.label}`);
                        }}
                        className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-2 ring-teal-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40'
                        }`}
                        title={preset.label}
                      >
                        <span className="text-2xl">{preset.icon}</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate w-full text-center">
                          {preset.label.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Profile Details Form */}
          <form onSubmit={handleSaveProfile} className="lg:col-span-2">
            <Card
              title="Demographics & Practice Info"
              subtitle="Update your workspace identity and contact details"
              icon={User}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                  />

                  <Input
                    label="Registered Email"
                    value={user?.email || 'alice@kidneycare.org'}
                    disabled
                    helperText="Managed by authentication provider"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="System Role"
                    value={profileRole}
                    onChange={(e) => setProfileRole(e.target.value)}
                    options={[
                      { value: 'CLINICIAN', label: 'Clinician / Nephrologist' },
                      { value: 'RESEARCHER', label: 'Clinical AI Researcher' },
                      { value: 'PATIENT', label: 'Patient Self-Management' },
                      { value: 'STUDENT', label: 'Medical / Postgraduate Student' },
                    ]}
                  />

                  <Input
                    label="Hospital / Department Affiliation"
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value)}
                    placeholder="e.g. Department of Nephrology"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Direct Contact / Pager"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                  />

                  <Select
                    label="Timezone for Daily Logs"
                    defaultValue="UTC+05:30"
                    options={[
                      { value: 'UTC+05:30', label: 'Asia/Kolkata (UTC+05:30)' },
                      { value: 'UTC-05:00', label: 'Eastern Time (UTC-05:00)' },
                      { value: 'UTC+00:00', label: 'UTC / GMT' },
                      { value: 'UTC+08:00', label: 'Singapore / Perth (UTC+08:00)' },
                    ]}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" icon={Save}>
                    Save Profile Changes
                  </Button>
                </div>
              </div>
            </Card>
          </form>
        </div>
      )}

      {/* ── TAB 2: Dark Theme & Display Studio ── */}
      {activeTab === 'appearance' && (
        <div className="space-y-8">
          <Card
            title="Theme Selection & Color Mode"
            subtitle="Choose between a pristine light theme, a high-contrast dark room mode, or system sync"
            icon={Moon}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Light Theme Card */}
              <div
                onClick={() => {
                  setTheme('light');
                  showToast('Switched to Crisp Clinical Light Theme');
                }}
                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-3 relative ${
                  theme === 'light'
                    ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 shadow-md ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-xs">
                  <Sun className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">Clinical Light</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Crisp medical white designed for bright outpatient consultation rooms.
                  </p>
                </div>
                {theme === 'light' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400">
                    <Check className="w-3.5 h-3.5" /> Active Theme
                  </span>
                )}
              </div>

              {/* Dark Theme Card */}
              <div
                onClick={() => {
                  setTheme('dark');
                  showToast('Switched to Midnight Clinical Dark Theme');
                }}
                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-3 relative ${
                  theme === 'dark'
                    ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 shadow-md ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 text-indigo-400 flex items-center justify-center shadow-xs">
                  <Moon className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">Midnight Dark</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Deep slate palette with teal/cyan illumination to eliminate night-shift eye fatigue.
                  </p>
                </div>
                {theme === 'dark' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400">
                    <Check className="w-3.5 h-3.5" /> Active Theme
                  </span>
                )}
              </div>

              {/* System Theme Card */}
              <div
                onClick={() => {
                  setTheme('system');
                  showToast('Synchronized theme to OS system preferences');
                }}
                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-3 relative ${
                  theme === 'system'
                    ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 shadow-md ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-xs">
                  <Laptop className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">System Dynamic</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Automatically switches appearance based on your device schedule.
                  </p>
                </div>
                {theme === 'system' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400">
                    <Check className="w-3.5 h-3.5" /> Active Theme
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Accessibility & Visual Enhancements */}
          <Card
            title="Display Ergonomics & Accessibility"
            subtitle="Fine-tune visual contrast, information density, and alert visibility"
            icon={Eye}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">High-Contrast Medical Mode</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Reinforces chart borders, sharpens text outlines, and maximizes contrast for laboratory workstations.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localCds.highContrastMode}
                    onChange={(e) => {
                      const updated = { ...localCds, highContrastMode: e.target.checked };
                      setLocalCds(updated);
                      updateCdsPreferences(updated);
                      showToast(`High-Contrast Mode ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Compact Density Workspace</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Reduces vertical paddings on cards and tables to display more clinical telemetry simultaneously.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localCds.compactDensity}
                    onChange={(e) => {
                      const updated = { ...localCds, compactDensity: e.target.checked };
                      setLocalCds(updated);
                      updateCdsPreferences(updated);
                      showToast(`Compact Density ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 3: Clinical Units & XAI Preferences ── */}
      {activeTab === 'cds' && (
        <div className="space-y-8">
          <Card
            title="Laboratory Metric Units & Standards"
            subtitle="Conform your data inputs to regional medical laboratory standards"
            icon={Activity}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Select
                label="Serum Creatinine Unit"
                value={localCds.creatinineUnit}
                onChange={(e) => setLocalCds({ ...localCds, creatinineUnit: e.target.value })}
                helperText="Standard US metric: mg/dL (Normal ~0.7-1.3) | SI unit: µmol/L (Normal ~60-115)"
                options={[
                  { value: 'mg/dL', label: 'mg/dL (Milligrams per deciliter)' },
                  { value: 'µmol/L', label: 'µmol/L (Micromoles per liter)' },
                ]}
              />

              <Select
                label="Random Blood Glucose Unit"
                value={localCds.glucoseUnit}
                onChange={(e) => setLocalCds({ ...localCds, glucoseUnit: e.target.value })}
                helperText="Standard: mg/dL (Normal ~70-140) | International: mmol/L (Normal ~3.9-7.8)"
                options={[
                  { value: 'mg/dL', label: 'mg/dL (Milligrams per deciliter)' },
                  { value: 'mmol/L', label: 'mmol/L (Millimoles per liter)' },
                ]}
              />
            </div>
          </Card>

          <Card
            title="Bimodal Explainability (XAI) Presentation"
            subtitle="Configure default cognitive presentation modes addressing H2/H3 comprehension hypotheses"
            icon={Sparkles}
          >
            <div className="space-y-4">
              <Select
                label="Default Assessment Result Orientation"
                value={localCds.bimodalViewMode}
                onChange={(e) => setLocalCds({ ...localCds, bimodalViewMode: e.target.value })}
                helperText="Controls whether patients/clinicians first see plain-language clinical synthesis or visual TreeSHAP waterfall"
                options={[
                  {
                    value: 'narrative_first',
                    label: 'Plain-Language Clinical Narrative First (Recommended for Patient & Clinician Shared Decision)',
                  },
                  {
                    value: 'shap_first',
                    label: 'Visual TreeSHAP Feature Attributions First (Optimized for Biostatisticians)',
                  },
                ]}
              />

              <div className="pt-2 flex justify-end">
                <Button onClick={handleSaveCds} icon={Save}>
                  Save Clinical Preferences
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 4: Data & Privacy Controls ── */}
      {activeTab === 'privacy' && (
        <div className="space-y-8">
          <Card
            title="Data Export & Portability"
            subtitle="Download your patient record, assessment logs, and clinical preferences in machine-readable JSON"
            icon={Download}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Export Complete Health Dossier</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Contains all demographic records, KDIGO rule preferences, and profile configuration.
                </p>
              </div>
              <Button onClick={handleExportData} variant="outline" icon={Download} size="sm">
                Download JSON File
              </Button>
            </div>
          </Card>

          <Card
            title="Reset & Cache Management"
            subtitle="Clear cached avatars, session data, and preferences from this browser"
            icon={Trash2}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-rose-200 dark:border-rose-950 bg-rose-50/40 dark:bg-rose-950/20">
              <div>
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">Reset Local Client Cache</h4>
                <p className="text-xs text-rose-700/80 dark:text-rose-400 mt-0.5">
                  Restores default settings, clears custom profile photo, and resets dark mode to system.
                </p>
              </div>
              <Button onClick={handleClearCache} variant="danger" icon={Trash2} size="sm">
                Reset Cache
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
