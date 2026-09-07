import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { profileApi } from '../api';
import { uploadToCloudinary } from '../utils/cloudinary';
import { 
  User, 
  Heart, 
  Scale, 
  Check, 
  Camera,
  Upload,
  Loader2
} from 'lucide-react';
import { Card, Button, Input, Select, Alert, Spinner, Badge } from '../components/common';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const { isBrutalist, avatar, setAvatar, presetAvatars } = useTheme();
  const fileInputRef = useRef(null);

  const [personalForm, setPersonalForm] = useState({
    name: '',
    email: '',
    age: '',
    gender: 'Other',
    heightCm: '',
    weightKg: '',
    bio: '',
    phone: '',
    affiliation: '',
  });

  const [healthForm, setHealthForm] = useState({
    diabetes: 'no',
    hypertension: 'no',
    familyHistory: 'no',
    smoking: 'no',
    alcohol: 'no',
    painkillerUsage: 'none',
  });

  const [bmi, setBmi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingHealth, setSavingHealth] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 4500);
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const [profileData, healthData] = await Promise.all([
          profileApi.getProfile().catch(() => null),
          profileApi.getHealthProfile().catch(() => null),
        ]);

        if (profileData) {
          setPersonalForm({
            name: profileData.name || '',
            email: profileData.email || '',
            age: profileData.age ? profileData.age.toString() : '',
            gender: profileData.gender || 'Other',
            heightCm: profileData.heightCm ? profileData.heightCm.toString() : '',
            weightKg: profileData.weightKg ? profileData.weightKg.toString() : '',
            bio: profileData.bio || '',
            phone: profileData.phone || '',
            affiliation: profileData.affiliation || '',
          });
          if (profileData.bmi) setBmi(profileData.bmi);
          if (profileData.profilePictureUrl) {
            setAvatar(profileData.profilePictureUrl);
            updateUser({ profilePictureUrl: profileData.profilePictureUrl });
          }
        }

        if (healthData) {
          setHealthForm({
            diabetes: healthData.diabetes || 'no',
            hypertension: healthData.hypertension || 'no',
            familyHistory: healthData.familyHistory || 'no',
            smoking: healthData.smoking || 'no',
            alcohol: healthData.alcohol || 'no',
            painkillerUsage: healthData.painkillerUsage || 'none',
          });
          if (!bmi && healthData.bmi) setBmi(healthData.bmi);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        showError('Could not load profile information.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // ── Custom Photo Upload Handler ──
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Image size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    try {
      setUploadingPhoto(true);

      // Upload media to cloud storage
      const photoUrl = await uploadToCloudinary(file);

      // Set local avatar preview
      setAvatar(photoUrl);

      // Persist photo URL to profile
      await profileApi.updateProfile({ profilePictureUrl: photoUrl });

      // Update Auth context and local state
      updateUser({ profilePictureUrl: photoUrl });

      showSuccess('Profile photo updated successfully!');
    } catch (err) {
      console.error('Photo upload failed:', err);
      showError(err.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Select Preset Persona ──
  const handleSelectPreset = async (preset) => {
    setAvatar(preset.id);
    updateUser({ profilePictureUrl: preset.id });
    showSuccess(`Selected avatar: ${preset.label}`);

    try {
      await profileApi.updateProfile({ profilePictureUrl: preset.id });
    } catch (err) {
      console.warn('Failed to sync avatar preset:', err);
    }
  };

  // ── Save Demographics ──
  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    setSavingPersonal(true);

    try {
      const payload = {
        name: personalForm.name,
        age: personalForm.age ? parseInt(personalForm.age, 10) : null,
        gender: personalForm.gender,
        heightCm: personalForm.heightCm ? parseFloat(personalForm.heightCm) : null,
        weightKg: personalForm.weightKg ? parseFloat(personalForm.weightKg) : null,
        bio: personalForm.bio || null,
        phone: personalForm.phone || null,
        affiliation: personalForm.affiliation || null,
      };

      const updated = await profileApi.updateProfile(payload);
      updateUser({ name: updated.name });
      if (updated.bmi) setBmi(updated.bmi);
      showSuccess('Personal demographics and body metrics saved.');
    } catch (err) {
      console.error('Update personal profile error:', err);
      showError(err.response?.data?.message || 'Failed to update personal profile.');
    } finally {
      setSavingPersonal(false);
    }
  };

  // ── Save Medical History ──
  const handleHealthSubmit = async (e) => {
    e.preventDefault();
    setSavingHealth(true);

    try {
      await profileApi.updateHealthProfile(healthForm);
      showSuccess('Clinical health background and medical history updated.');
    } catch (err) {
      console.error('Update health profile error:', err);
      showError(err.response?.data?.message || 'Failed to update health profile.');
    } finally {
      setSavingHealth(false);
    }
  };

  const getBmiCategory = (val) => {
    if (!val) return null;
    if (val < 18.5) return { text: 'Underweight', badge: 'moderate' };
    if (val < 25.0) return { text: 'Normal weight', badge: 'low' };
    if (val < 30.0) return { text: 'Overweight', badge: 'moderate' };
    return { text: 'Obese', badge: 'critical' };
  };

  const bmiCat = getBmiCategory(bmi);

  // ── Render Active Avatar Element ──
  const renderCurrentAvatar = (size = 'w-24 h-24 text-3xl') => {
    if (avatar && (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:image/'))) {
      return (
        <img
          src={avatar}
          alt="Profile Avatar"
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

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className={`text-sm ${isBrutalist ? 'text-[var(--text-muted)] uppercase tracking-wider font-bold' : 'text-slate-500'}`}>Retrieving user profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1 ${
          isBrutalist ? 'text-[var(--brutalist-red)]' : 'text-teal-600'
        }`}>
          <User className="w-4 h-4" />
          User Profile & Baseline Metrics
        </div>
        <h1 className={`text-3xl font-extrabold tracking-tight ${
          isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-900 dark:text-slate-100'
        }`}>
          Profile & Medical History
        </h1>
        <p className={`text-sm mt-1 ${
          isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-600 dark:text-slate-400'
        }`}>
          Manage your personal identity, profile picture, body metrics, and clinical history.
        </p>
      </div>

      {successMsg && (
        <Alert type="success" onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert type="danger" onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      {/* ── Profile Photo & Avatar Studio Card ── */}
      <Card
        title="Profile Photo & Clinical Identity"
        subtitle="Upload a custom photo or select a clinical persona avatar"
        icon={Camera}
      >
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar Preview & Direct Upload */}
          <div className="flex flex-col items-center text-center space-y-3 shrink-0">
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
                title="Change Photo"
              >
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              icon={uploadingPhoto ? Loader2 : Upload}
            >
              {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
            </Button>
          </div>

          {/* User Details & Persona Selection */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h3 className={`text-xl font-extrabold ${isBrutalist ? 'text-[var(--text-main)] uppercase tracking-wider' : 'text-slate-900 dark:text-slate-100'}`}>
                  {personalForm.name || user?.name || 'Registered User'}
                </h3>
                <div className="flex justify-center md:justify-start">
                  <Badge variant="teal">{user?.role || 'CLINICIAN'}</Badge>
                </div>
              </div>
              <p className={`text-xs mt-0.5 ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-500 dark:text-slate-400'}`}>
                {personalForm.email || user?.email}
              </p>
              {personalForm.affiliation && (
                <p className={`text-xs mt-0.5 font-medium ${isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-700 dark:text-slate-300'}`}>
                  {personalForm.affiliation}
                </p>
              )}
            </div>

            {/* Presets Grid */}
            <div>
              <p className={`text-xs font-semibold mb-2 ${
                isBrutalist ? 'text-[var(--text-muted)] uppercase tracking-wider font-black' : 'text-slate-600 dark:text-slate-400'
              }`}>
                Or choose a clinical persona:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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
                      <span className="text-xl">{preset.icon}</span>
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
        </div>
      </Card>

      {/* BMI Card */}
      {bmi && (
        <div className={`p-6 flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isBrutalist
            ? 'bg-[var(--bg-surface)] border-[3px] border-[var(--border-subtle)]'
            : 'rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 flex items-center justify-center ${
              isBrutalist
                ? 'bg-[var(--brutalist-yellow)] text-[var(--brutalist-black)] border-[2px] border-[var(--brutalist-black)]'
                : 'rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
            }`}>
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-black ${isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-900 dark:text-slate-100'}`}>{bmi.toFixed(1)}</span>
                <span className={`text-xs font-semibold ${isBrutalist ? 'text-[var(--text-muted)] uppercase' : 'text-slate-500 dark:text-slate-400'}`}>kg/m²</span>
                {bmiCat && <Badge variant={bmiCat.badge}>{bmiCat.text}</Badge>}
              </div>
              <p className={`text-xs mt-0.5 ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-500 dark:text-slate-400'}`}>
                Automatically calculated from your current height and weight values.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Section 1: Demographics */}
        <form onSubmit={handlePersonalSubmit}>
          <Card title="Demographics & Vitals" subtitle="Personal details and body metrics" icon={User}>
            <div className="space-y-4">
              <Input
                label="Full Name"
                name="name"
                value={personalForm.name}
                onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                required
              />

              <Input
                label="Email Address"
                type="email"
                name="email"
                value={personalForm.email}
                disabled
                helperText="Email cannot be changed"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Age"
                  type="number"
                  name="age"
                  value={personalForm.age}
                  onChange={(e) => setPersonalForm({ ...personalForm, age: e.target.value })}
                  min="1"
                  max="120"
                />

                <Select
                  label="Gender"
                  name="gender"
                  value={personalForm.gender}
                  onChange={(e) => setPersonalForm({ ...personalForm, gender: e.target.value })}
                  options={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Height (cm)"
                  type="number"
                  step="0.5"
                  name="heightCm"
                  value={personalForm.heightCm}
                  onChange={(e) => setPersonalForm({ ...personalForm, heightCm: e.target.value })}
                  placeholder="e.g. 175"
                />

                <Input
                  label="Weight (kg)"
                  type="number"
                  step="0.5"
                  name="weightKg"
                  value={personalForm.weightKg}
                  onChange={(e) => setPersonalForm({ ...personalForm, weightKg: e.target.value })}
                  placeholder="e.g. 70"
                />
              </div>

              <Input
                label="Bio / About"
                name="bio"
                value={personalForm.bio}
                onChange={(e) => setPersonalForm({ ...personalForm, bio: e.target.value })}
                placeholder="Short description about yourself"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Phone / Contact"
                  name="phone"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                  placeholder="e.g. +91 9876543210"
                />

                <Input
                  label="Affiliation"
                  name="affiliation"
                  value={personalForm.affiliation}
                  onChange={(e) => setPersonalForm({ ...personalForm, affiliation: e.target.value })}
                  placeholder="e.g. Dept. of Nephrology"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" size="md" loading={savingPersonal} icon={Check} className="w-full">
                  Save Demographics
                </Button>
              </div>
            </div>
          </Card>
        </form>

        {/* Section 2: Medical History */}
        <form onSubmit={handleHealthSubmit}>
          <Card title="Medical Background" subtitle="Preexisting risk factors and clinical history" icon={Heart}>
            <div className="space-y-4">
              <Select
                label="Diabetes Status"
                name="diabetes"
                value={healthForm.diabetes}
                onChange={(e) => setHealthForm({ ...healthForm, diabetes: e.target.value })}
                options={[
                  { value: 'no', label: 'No history of diabetes' },
                  { value: 'prediabetes', label: 'Pre-diabetes' },
                  { value: 'type1', label: 'Type 1 Diabetes' },
                  { value: 'type2', label: 'Type 2 Diabetes' },
                ]}
              />

              <Select
                label="Hypertension / High Blood Pressure"
                name="hypertension"
                value={healthForm.hypertension}
                onChange={(e) => setHealthForm({ ...healthForm, hypertension: e.target.value })}
                options={[
                  { value: 'no', label: 'Normal blood pressure' },
                  { value: 'elevated', label: 'Elevated / Borderline' },
                  { value: 'stage1', label: 'Hypertension (Stage 1)' },
                  { value: 'stage2', label: 'Hypertension (Stage 2)' },
                ]}
              />

              <Select
                label="Family History of Kidney Disease"
                name="familyHistory"
                value={healthForm.familyHistory}
                onChange={(e) => setHealthForm({ ...healthForm, familyHistory: e.target.value })}
                options={[
                  { value: 'no', label: 'No family history' },
                  { value: 'yes', label: 'Yes (first-degree relative)' },
                  { value: 'unknown', label: 'Unknown' },
                ]}
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Smoking Status"
                  name="smoking"
                  value={healthForm.smoking}
                  onChange={(e) => setHealthForm({ ...healthForm, smoking: e.target.value })}
                  options={[
                    { value: 'no', label: 'Non-smoker' },
                    { value: 'occasional', label: 'Occasional' },
                    { value: 'regular', label: 'Regular' },
                  ]}
                />

                <Select
                  label="Alcohol Intake"
                  name="alcohol"
                  value={healthForm.alcohol}
                  onChange={(e) => setHealthForm({ ...healthForm, alcohol: e.target.value })}
                  options={[
                    { value: 'no', label: 'None' },
                    { value: 'moderate', label: 'Moderate' },
                    { value: 'heavy', label: 'Frequent / Heavy' },
                  ]}
                />
              </div>

              <Select
                label="Frequent NSAID / Painkiller Use"
                name="painkillerUsage"
                value={healthForm.painkillerUsage}
                onChange={(e) => setHealthForm({ ...healthForm, painkillerUsage: e.target.value })}
                helperText="Ibuprofen, naproxen, or other NSAIDs"
                options={[
                  { value: 'none', label: 'Rarely / Never' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'daily', label: 'Daily / Chronic' },
                ]}
              />

              <div className="pt-2">
                <Button type="submit" size="md" variant="secondary" loading={savingHealth} icon={Check} className="w-full">
                  Save Medical Background
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};
