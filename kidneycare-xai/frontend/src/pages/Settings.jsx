import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { profileApi } from '../api';
import { uploadToCloudinary } from '../utils/cloudinary';
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
  HeartPulse,
  Palette,
  Zap,
  Eye,
  Loader2
} from 'lucide-react';
import { Card, Button, Input, Select, Badge, Alert, Spinner } from '../components/common';

export const Settings = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const { 
    theme, 
    setTheme, 
    isDark, 
    avatar, 
    setAvatar, 
    presetAvatars, 
    cdsPreferences, 
    updateCdsPreferences,
    themeStyle,
    setThemeStyle,
    isBrutalist
  } = useTheme();

  const fileInputRef = useRef(null);

  // ── Tab State ──
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'appearance' | 'cds' | 'privacy'

  // ── Profile / Demographic Fields (Synced with Supabase & Spring Boot) ──
  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState('CLINICIAN');
  const [affiliation, setAffiliation] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('UTC+05:30');
  const [bio, setBio] = useState('');

  // ── Loading & Progress State ──
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ── CDS Preferences State ──
  const [localCds, setLocalCds] = useState(cdsPreferences);

  // ── Feedback State ──
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // ── Fetch Profile on Mount from Supabase via Spring Boot ──
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const fetchUserData = async () => {
      try {
        setLoadingProfile(true);
        const data = await profileApi.getProfile();
        if (isMounted && data) {
          setProfileName(data.name || user?.name || '');
          setAffiliation(data.affiliation || '');
          setPhone(data.phone || '');
          setTimezone(data.timezone || 'UTC+05:30');
          setBio(data.bio || '');

          if (data.profilePictureUrl) {
            setAvatar(data.profilePictureUrl);
            updateUser({ profilePictureUrl: data.profilePictureUrl });
          }
        }
      } catch (err) {
        console.warn('Could not load profile from Supabase API:', err);
        // Fallback to local user state
        if (isMounted) {
          setProfileName(user?.name || '');
          setProfileRole(user?.role || 'CLINICIAN');
        }
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    fetchUserData();
    return () => { isMounted = false; };
  }, [isAuthenticated]);

  // ── Safeguard: Redirect if not logged in ──
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ── Cloudinary Media Upload Handler (Cloud Name: mkvwiqlw) ──
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).', 'danger');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit. Please choose a smaller photo.', 'danger');
      return;
    }

    try {
      setUploadingPhoto(true);
      showToast('Uploading multimedia to Cloudinary (mkvwiqlw)...', 'info');

      // 1. Upload to Cloudinary (cloud: mkvwiqlw)
      const cloudUrl = await uploadToCloudinary(file);

      // 2. Set local avatar state
      setAvatar(cloudUrl);

      // 3. Persist Cloudinary URL to Supabase users table via Spring Boot API
      await profileApi.updateProfile({ profilePictureUrl: cloudUrl });

      // 4. Update AuthContext state and localStorage
      updateUser({ profilePictureUrl: cloudUrl });

      showToast('Profile photo uploaded to Cloudinary and saved in Supabase!', 'success');
    } catch (err) {
      console.error('Photo upload failed:', err);
      showToast(err.message || 'Failed to upload photo. Please try again.', 'danger');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Select Preset Persona & Persist to Supabase ──
  const handleSelectPreset = async (preset) => {
    setAvatar(preset.id);
    updateUser({ profilePictureUrl: preset.id });
    showToast(`Selected avatar: ${preset.label}`);

    try {
      // Save preset ID to Supabase
      await profileApi.updateProfile({ profilePictureUrl: preset.id });
    } catch (err) {
      console.warn('Failed to sync avatar preset to Supabase:', err);
    }
  };

  // ── Save Profile Details to Supabase ──
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const payload = {
        name: profileName.trim(),
        affiliation: affiliation.trim(),
        phone: phone.trim(),
        timezone: timezone,
        bio: bio.trim(),
      };

      // Call Spring Boot PUT /api/profile -> commits to PostgreSQL in Supabase
      const updated = await profileApi.updateProfile(payload);

      // Update active user state
      updateUser({
        name: updated.name || profileName,
        affiliation: updated.affiliation,
        phone: updated.phone,
        timezone: updated.timezone,
        bio: updated.bio,
      });

      showToast('Demographics and practice identity saved to Supabase successfully!');
    } catch (err) {
      console.error('Failed to save profile to Supabase:', err);
      showToast(err.response?.data?.message || 'Failed to save to Supabase. Check backend connection.', 'danger');
    } finally {
      setSavingProfile(false);
    }
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
        phone,
        timezone,
        bio,
      },
      preferences: localCds,
      appVersion: 'KidneyCare-XAI v1.0',
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
    if (window.confirm('Reset local preferences, custom avatar, and theme cache to system defaults?')) {
      localStorage.removeItem('kidneycare_avatar');
      localStorage.removeItem('kidneycare_theme');
      localStorage.removeItem('kidneycare_theme_style');
      localStorage.removeItem('kidneycare_cds_prefs');
      setAvatar('doc-1');
      setTheme('system');
      setThemeStyle('clinical');
      showToast('Local application cache reset to defaults.');
    }
  };

  // ── Render Active Avatar Element ──
  const renderCurrentAvatar = (size = 'w-24 h-24 text-3xl') => {
    // Cloudinary URL or custom base64 photo
    if (avatar && (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:image/'))) {
      return (
        <img
          src={avatar}
          alt="Avatar Preview"
          className={`${size} object-cover shadow-md ${
            isBrutalist
              ? 'border-[3px] border-[var(--brutalist-black)]'
              : 'rounded-2xl ring-4 ring-teal-500/30'
          }`}
        />
      );
    }

    const preset = presetAvatars.find((p) => p.id === avatar) || presetAvatars[0];

    if (isBrutalist) {
      return (
        <div className={`${size} bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)] flex items-center justify-center border-[3px] border-[var(--brutalist-black)] font-black`}>
          <span>{preset.icon}</span>
        </div>
      );
    }

    return (
      <div
        className={`${size} rounded-2xl bg-gradient-to-tr ${preset.bg} text-white flex items-center justify-center ring-4 ring-teal-500/30 shadow-md font-bold`}
      >
        <span>{preset.icon}</span>
      </div>
    );
  };

  // ── Tab Button Style Helper ──
  const tabStyle = (tabName) => {
    if (isBrutalist) {
      return `flex items-center gap-2 px-4 py-3 border-b-[3px] text-xs font-black uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
        activeTab === tabName
          ? 'border-[var(--brutalist-red)] text-[var(--brutalist-red)] bg-[var(--brutalist-yellow)]/20'
          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--brutalist-yellow)]/10'
      }`;
    }
    return `flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
      activeTab === tabName
        ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
    }`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 transition-colors duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1 ${
            isBrutalist ? 'text-[var(--brutalist-red)]' : 'text-teal-600 dark:text-teal-400'
          }`}>
            <Sliders className="w-4 h-4" />
            System & Personalization Preferences
          </div>
          <h1 className={`text-3xl font-extrabold tracking-tight ${
            isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-900 dark:text-slate-100'
          }`}>
            Settings & Workspace
          </h1>
          <p className={`text-sm mt-1 ${
            isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-600 dark:text-slate-400'
          }`}>
            Manage your Cloudinary profile photo, Supabase identity, theme style, and medical standards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isBrutalist ? 'default' : (isDark ? 'teal' : 'default')} size="lg">
            {isBrutalist ? `⬡ ${themeStyle.toUpperCase()} MODE` : (isDark ? '🌙 Dark Mode Active' : '☀️ Light Mode Active')}
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
      <div className={`flex gap-2 overflow-x-auto ${
        isBrutalist ? 'border-b-[3px] border-[var(--border-subtle)]' : 'border-b border-slate-200 dark:border-slate-800'
      }`}>
        <button onClick={() => setActiveTab('profile')} className={tabStyle('profile')}>
          <User className="w-4 h-4" />
          Profile & Cloudinary Avatar
        </button>
        <button onClick={() => setActiveTab('appearance')} className={tabStyle('appearance')}>
          <Palette className="w-4 h-4" />
          Theme & Display
        </button>
        <button onClick={() => setActiveTab('cds')} className={tabStyle('cds')}>
          <HeartPulse className="w-4 h-4" />
          Clinical Units & XAI
        </button>
        <button onClick={() => setActiveTab('privacy')} className={tabStyle('privacy')}>
          <ShieldCheck className="w-4 h-4" />
          Data & Privacy
        </button>
      </div>

      {/* ── TAB 1: Profile & Avatar Studio ── */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Avatar Studio Card */}
          <Card
            title="Profile Photo & Avatars"
            subtitle="Cloudinary media storage (mkvwiqlw) synced to Supabase"
            icon={Camera}
            className="lg:col-span-1"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                {renderCurrentAvatar()}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className={`absolute bottom-0 right-0 p-2 shadow-lg transition-all cursor-pointer ${
                    isBrutalist
                      ? 'bg-[var(--brutalist-red)] text-white border-[2px] border-[var(--brutalist-black)] hover:bg-[var(--brutalist-yellow)] hover:text-[var(--brutalist-black)]'
                      : 'rounded-xl bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                  title="Upload to Cloudinary"
                >
                  {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <h4 className={`font-bold ${isBrutalist ? 'text-[var(--text-main)] uppercase tracking-wider' : 'text-slate-900 dark:text-slate-100'}`}>
                  {profileName || user?.name || 'Authorized User'}
                </h4>
                <p className={`text-xs ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-500 dark:text-slate-400'}`}>
                  {user?.email}
                </p>
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
                  disabled={uploadingPhoto}
                  icon={uploadingPhoto ? Loader2 : Upload}
                  className="w-full"
                >
                  {uploadingPhoto ? 'Uploading to Cloudinary...' : 'Upload Photo (Cloudinary)'}
                </Button>
                <p className="text-[10px] text-slate-500 mt-1">
                  Stored in cloud: <span className="font-mono font-semibold">mkvwiqlw</span> • URL in Supabase
                </p>
              </div>

              {/* Preset Avatars Grid */}
              <div className={`w-full pt-4 ${isBrutalist ? 'border-t-[3px] border-[var(--border-subtle)]' : 'border-t border-slate-100 dark:border-slate-800'}`}>
                <p className={`text-xs font-semibold mb-3 text-left ${
                  isBrutalist ? 'text-[var(--text-muted)] uppercase tracking-wider font-black' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  Or pick a clinical persona:
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {presetAvatars.map((preset) => {
                    const isSelected = avatar === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2 flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                          isBrutalist
                            ? `border-[2px] ${isSelected ? 'border-[var(--brutalist-red)] bg-[var(--brutalist-yellow)]/30' : 'border-[var(--border-subtle)] hover:border-[var(--brutalist-red)]'}`
                            : `rounded-xl ${isSelected ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-2 ring-teal-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40'}`
                        }`}
                        title={preset.label}
                      >
                        <span className="text-2xl">{preset.icon}</span>
                        <span className={`text-[10px] font-medium truncate w-full text-center ${
                          isBrutalist ? 'text-[var(--text-muted)] uppercase font-bold' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {preset.label.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Profile Details Form (Tailored to Necessary Clinical Info) */}
          <form onSubmit={handleSaveProfile} className="lg:col-span-2">
            <Card
              title="Identity & Practice Info"
              subtitle="Essential details saved directly to Supabase"
              icon={User}
            >
              {loadingProfile ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Spinner size="md" />
                  <p className="text-xs text-slate-500">Loading profile from Supabase...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name *"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g. Dr. Alex Mercer"
                      required
                    />

                    <Input
                      label="Registered Account Email"
                      value={user?.email || ''}
                      disabled
                      helperText="Verified authentication identifier"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Clinical / Workspace Role"
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
                      label="Emergency Contact / Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                    />

                    <Select
                      label="Timezone for Logs & Alerts"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      options={[
                        { value: 'UTC+05:30', label: 'Asia/Kolkata (UTC+05:30)' },
                        { value: 'UTC-05:00', label: 'US Eastern (UTC-05:00)' },
                        { value: 'UTC+00:00', label: 'UTC / GMT Standard' },
                        { value: 'UTC+08:00', label: 'Singapore / Perth (UTC+08:00)' },
                        { value: 'UTC+01:00', label: 'Central European Time (UTC+01:00)' },
                      ]}
                    />
                  </div>

                  <Input
                    label="Clinical Focus / Brief Bio (Optional)"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. CKD stage 3b-5 hemodialysis management and risk modeling"
                  />

                  <div className="pt-4 flex items-center justify-between">
                    <p className={`text-xs ${isBrutalist ? 'text-[var(--text-muted)] font-bold' : 'text-slate-500'}`}>
                      Changes are persisted directly to Supabase cloud PostgreSQL.
                    </p>
                    <Button type="submit" disabled={savingProfile} icon={savingProfile ? Loader2 : Save}>
                      {savingProfile ? 'Saving to Supabase...' : 'Save to Supabase'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </form>
        </div>
      )}

      {/* ── TAB 2: Theme & Display Studio ── */}
      {activeTab === 'appearance' && (
        <div className="space-y-8">
          {/* Theme Style Switcher (Clinical vs Brutalist) */}
          <Card
            title="Design Language"
            subtitle="Switch between the clinical interface or the bold House-inspired brutalist theme"
            icon={Palette}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Clinical Theme Card */}
              <div
                onClick={() => {
                  setThemeStyle('clinical');
                  showToast('Switched to Clinical Design Language');
                }}
                className={`p-6 border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-4 relative ${
                  isBrutalist
                    ? `border-[3px] ${themeStyle === 'clinical' ? 'border-[var(--brutalist-red)] bg-[var(--brutalist-yellow)]/20' : 'border-[var(--border-subtle)] hover:border-[var(--brutalist-red)]'}`
                    : `rounded-2xl ${themeStyle === 'clinical' ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 shadow-md ring-2 ring-teal-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'}`
                }`}
              >
                <div className={`w-full p-4 ${isBrutalist ? '' : 'rounded-xl'} bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-800 dark:to-teal-900/30 border border-slate-200 dark:border-slate-700`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-teal-500 flex items-center justify-center">
                      <HeartPulse className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">KidneyCare.XAI</span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-3/4 rounded bg-teal-200 dark:bg-teal-800"></div>
                    <div className="h-2 w-1/2 rounded bg-slate-200 dark:bg-slate-700"></div>
                  </div>
                </div>
                <div>
                  <h4 className={`font-bold text-base ${isBrutalist ? 'text-[var(--text-main)] uppercase' : 'text-slate-900 dark:text-slate-100'}`}>Clinical</h4>
                  <p className={`text-xs mt-1 ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-500 dark:text-slate-400'}`}>
                    Clean, rounded, medical-grade interface with teal accents and soft shadows.
                  </p>
                </div>
                {themeStyle === 'clinical' && (
                  <span className={`inline-flex items-center gap-1 text-xs font-bold ${isBrutalist ? 'text-[var(--brutalist-red)] uppercase tracking-wider' : 'text-teal-600 dark:text-teal-400'}`}>
                    <Check className="w-3.5 h-3.5" /> Active
                  </span>
                )}
              </div>

              {/* Brutalist "House" Theme Card */}
              <div
                onClick={() => {
                  setThemeStyle('brutalist');
                  showToast('Switched to House Brutalist Design Language');
                }}
                className={`p-6 border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-4 relative ${
                  isBrutalist
                    ? `border-[3px] ${themeStyle === 'brutalist' ? 'border-[var(--brutalist-red)] bg-[var(--brutalist-yellow)]/20' : 'border-[var(--border-subtle)] hover:border-[var(--brutalist-red)]'}`
                    : `rounded-2xl ${themeStyle === 'brutalist' ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 shadow-md ring-2 ring-teal-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'}`
                }`}
              >
                <div className="w-full p-4 bg-[#1a1a1a] border-[3px] border-[#1a1a1a]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-[#e63326] flex items-center justify-center border-[2px] border-[#f5f0e8]">
                      <Zap className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[10px] font-black text-[#f5f0e8] uppercase tracking-wider">KIDNEYCARE</span>
                    <span className="px-1 py-0.5 text-[8px] font-black bg-[#f5c518] text-[#1a1a1a] border border-[#f5f0e8]">XAI</span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-3/4 bg-[#f5c518]"></div>
                    <div className="h-2 w-1/2 bg-[#e63326]"></div>
                  </div>
                </div>
                <div>
                  <h4 className={`font-bold text-base ${isBrutalist ? 'text-[var(--text-main)] uppercase' : 'text-slate-900 dark:text-slate-100'}`}>House</h4>
                  <p className={`text-xs mt-1 ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-500 dark:text-slate-400'}`}>
                    Bold, raw brutalist design with sharp corners, thick borders, and red/yellow/black accents.
                  </p>
                </div>
                {themeStyle === 'brutalist' && (
                  <span className={`inline-flex items-center gap-1 text-xs font-bold ${isBrutalist ? 'text-[var(--brutalist-red)] uppercase tracking-wider' : 'text-teal-600 dark:text-teal-400'}`}>
                    <Check className="w-3.5 h-3.5" /> Active
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Color Mode (Light / Dark / System) */}
          <Card
            title="Color Mode"
            subtitle="Choose between light, dark, or system-synced color scheme"
            icon={Moon}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Light Theme Card */}
              <div
                onClick={() => {
                  setTheme('light');
                  showToast('Switched to Light Mode');
                }}
                className={`p-6 border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-3 relative ${
                  isBrutalist
                    ? `border-[3px] ${theme === 'light' ? 'border-[var(--brutalist-red)] bg-[var(--brutalist-yellow)]/20' : 'border-[var(--border-subtle)] hover:border-[var(--brutalist-red)]'}`
                    : `rounded-2xl ${theme === 'light' ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 shadow-md ring-2 ring-teal-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'}`
                }`}
              >
                <div className={`w-14 h-14 flex items-center justify-center shadow-xs ${
                  isBrutalist ? 'bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)] border-[2px] border-[var(--brutalist-black)]' : 'rounded-2xl bg-amber-50 text-amber-500'
                }`}>
                  <Sun className="w-7 h-7" />
                </div>
                <div>
                  <h4 className={`font-bold text-base ${isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-900 dark:text-slate-100'}`}>Light</h4>
                  <p className={`text-xs mt-1 ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-500 dark:text-slate-400'}`}>
                    {isBrutalist ? 'Warm cream with bold contrast.' : 'Crisp medical white for bright rooms.'}
                  </p>
                </div>
                {theme === 'light' && (
                  <span className={`inline-flex items-center gap-1 text-xs font-bold ${isBrutalist ? 'text-[var(--brutalist-red)] uppercase tracking-wider' : 'text-teal-600 dark:text-teal-400'}`}>
                    <Check className="w-3.5 h-3.5" /> Active
                  </span>
                )}
              </div>

              {/* Dark Theme Card */}
              <div
                onClick={() => {
                  setTheme('dark');
                  showToast('Switched to Dark Mode');
                }}
                className={`p-6 border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-3 relative ${
                  isBrutalist
                    ? `border-[3px] ${theme === 'dark' ? 'border-[var(--brutalist-red)] bg-[var(--brutalist-yellow)]/20' : 'border-[var(--border-subtle)] hover:border-[var(--brutalist-red)]'}`
                    : `rounded-2xl ${theme === 'dark' ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 shadow-md ring-2 ring-teal-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'}`
                }`}
              >
                <div className={`w-14 h-14 flex items-center justify-center shadow-xs ${
                  isBrutalist ? 'bg-[var(--brutalist-black)] text-[var(--brutalist-cream)] border-[2px] border-[var(--brutalist-cream)]' : 'rounded-2xl bg-indigo-950/60 text-indigo-400'
                }`}>
                  <Moon className="w-7 h-7" />
                </div>
                <div>
                  <h4 className={`font-bold text-base ${isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-900 dark:text-slate-100'}`}>Dark</h4>
                  <p className={`text-xs mt-1 ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-500 dark:text-slate-400'}`}>
                    {isBrutalist ? 'Deep black with cream accents.' : 'Deep slate to eliminate eye fatigue.'}
                  </p>
                </div>
                {theme === 'dark' && (
                  <span className={`inline-flex items-center gap-1 text-xs font-bold ${isBrutalist ? 'text-[var(--brutalist-red)] uppercase tracking-wider' : 'text-teal-600 dark:text-teal-400'}`}>
                    <Check className="w-3.5 h-3.5" /> Active
                  </span>
                )}
              </div>

              {/* System Theme Card */}
              <div
                onClick={() => {
                  setTheme('system');
                  showToast('Theme synced to OS preferences');
                }}
                className={`p-6 border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-3 relative ${
                  isBrutalist
                    ? `border-[3px] ${theme === 'system' ? 'border-[var(--brutalist-red)] bg-[var(--brutalist-yellow)]/20' : 'border-[var(--border-subtle)] hover:border-[var(--brutalist-red)]'}`
                    : `rounded-2xl ${theme === 'system' ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 shadow-md ring-2 ring-teal-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'}`
                }`}
              >
                <div className={`w-14 h-14 flex items-center justify-center shadow-xs ${
                  isBrutalist ? 'bg-[var(--bg-surface)] text-[var(--text-main)] border-[2px] border-[var(--border-subtle)]' : 'rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  <Laptop className="w-7 h-7" />
                </div>
                <div>
                  <h4 className={`font-bold text-base ${isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-900 dark:text-slate-100'}`}>System</h4>
                  <p className={`text-xs mt-1 ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-500 dark:text-slate-400'}`}>
                    Automatically follows your device schedule.
                  </p>
                </div>
                {theme === 'system' && (
                  <span className={`inline-flex items-center gap-1 text-xs font-bold ${isBrutalist ? 'text-[var(--brutalist-red)] uppercase tracking-wider' : 'text-teal-600 dark:text-teal-400'}`}>
                    <Check className="w-3.5 h-3.5" /> Active
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Accessibility & Visual Ergonomics */}
          <Card
            title="Display Ergonomics & Accessibility"
            subtitle="Fine-tune visual contrast, information density, and alert visibility"
            icon={Eye}
          >
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-4 border ${
                isBrutalist
                  ? 'border-[3px] border-[var(--border-subtle)] bg-[var(--bg-surface)]'
                  : 'rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
              }`}>
                <div>
                  <h4 className={`text-sm font-bold ${isBrutalist ? 'text-[var(--text-main)] uppercase tracking-wider' : 'text-slate-900 dark:text-slate-100'}`}>High-Contrast Medical Mode</h4>
                  <p className={`text-xs mt-0.5 ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-500 dark:text-slate-400'}`}>
                    Reinforces chart borders, sharpens text outlines, and maximizes contrast.
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
                  <div className={`w-11 h-6 peer-focus:outline-none peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white ${
                    isBrutalist
                      ? 'bg-[var(--border-subtle)] peer-checked:bg-[var(--brutalist-red)] after:border-[var(--border-subtle)]'
                      : 'bg-slate-200 rounded-full dark:bg-slate-700 peer-checked:bg-teal-600 after:border-slate-300 after:rounded-full'
                  }`}></div>
                </label>
              </div>

              <div className={`flex items-center justify-between p-4 border ${
                isBrutalist
                  ? 'border-[3px] border-[var(--border-subtle)] bg-[var(--bg-surface)]'
                  : 'rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
              }`}>
                <div>
                  <h4 className={`text-sm font-bold ${isBrutalist ? 'text-[var(--text-main)] uppercase tracking-wider' : 'text-slate-900 dark:text-slate-100'}`}>Compact Density Workspace</h4>
                  <p className={`text-xs mt-0.5 ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-500 dark:text-slate-400'}`}>
                    Reduces vertical paddings to display more clinical telemetry.
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
                  <div className={`w-11 h-6 peer-focus:outline-none peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white ${
                    isBrutalist
                      ? 'bg-[var(--border-subtle)] peer-checked:bg-[var(--brutalist-red)] after:border-[var(--border-subtle)]'
                      : 'bg-slate-200 rounded-full dark:bg-slate-700 peer-checked:bg-teal-600 after:border-slate-300 after:rounded-full'
                  }`}></div>
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
                helperText="Controls whether clinicians/patients first see plain-language narrative synthesis or visual TreeSHAP waterfall"
                options={[
                  {
                    value: 'narrative_first',
                    label: 'Plain-Language Clinical Narrative First (Recommended for Shared Decision-Making)',
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
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border ${
              isBrutalist
                ? 'border-[3px] border-[var(--border-subtle)] bg-[var(--bg-surface)]'
                : 'rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
            }`}>
              <div>
                <h4 className={`text-sm font-bold ${isBrutalist ? 'text-[var(--text-main)] uppercase tracking-wider' : 'text-slate-900 dark:text-slate-100'}`}>Export Complete Health Dossier</h4>
                <p className={`text-xs mt-0.5 ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-500 dark:text-slate-400'}`}>
                  Contains demographic records, affiliation, contact details, and clinical configuration.
                </p>
              </div>
              <Button onClick={handleExportData} variant="outline" icon={Download} size="sm">
                Download JSON
              </Button>
            </div>
          </Card>

          <Card
            title="Reset & Cache Management"
            subtitle="Clear cached avatars, session data, and preferences from this browser"
            icon={Trash2}
          >
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border ${
              isBrutalist
                ? 'border-[3px] border-[var(--brutalist-red)] bg-[var(--brutalist-red)]/10'
                : 'rounded-xl border-rose-200 dark:border-rose-950 bg-rose-50/40 dark:bg-rose-950/20'
            }`}>
              <div>
                <h4 className={`text-sm font-bold ${isBrutalist ? 'text-[var(--brutalist-red)] uppercase tracking-wider' : 'text-rose-900 dark:text-rose-200'}`}>Reset Local Client Cache</h4>
                <p className={`text-xs mt-0.5 ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-rose-700/80 dark:text-rose-400'}`}>
                  Restores default settings, clears custom photo, and resets theme to clinical/system.
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
