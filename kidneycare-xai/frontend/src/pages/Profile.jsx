import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { profileApi } from '../api';
import { 
  User, 
  Heart, 
  Scale, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  Activity
} from 'lucide-react';
import { Card, Button, Input, Select, Alert, Spinner, Badge } from '../components/common';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const { isBrutalist } = useTheme();

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
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
          // Update user context with profile picture if available
          if (profileData.profilePictureUrl) {
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
        setErrorMsg('Could not load profile information.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    setSavingPersonal(true);
    setSuccessMsg('');
    setErrorMsg('');

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
      setSuccessMsg('Personal demographics and body metrics saved.');
    } catch (err) {
      console.error('Update personal profile error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to update personal profile.');
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleHealthSubmit = async (e) => {
    e.preventDefault();
    setSavingHealth(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await profileApi.updateHealthProfile(healthForm);
      setSuccessMsg('Clinical health background and medical history updated.');
    } catch (err) {
      console.error('Update health profile error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to update health profile.');
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

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className={`text-sm ${isBrutalist ? 'text-[var(--text-muted)] uppercase tracking-wider font-bold' : 'text-slate-500'}`}>Retrieving user profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
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
          Manage your personal details, BMI indicators, and clinical background conditions.
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
