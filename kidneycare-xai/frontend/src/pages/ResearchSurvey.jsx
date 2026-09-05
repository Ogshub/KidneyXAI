import React, { useState } from 'react';
import { researchApi } from '../api';
import { 
  FileSpreadsheet, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  Users
} from 'lucide-react';
import { Card, Button, Input, Select, Alert } from '../components/common';

export const ResearchSurvey = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const randomParticipantId = 'COL-' + Math.random().toString(36).substring(2, 7).toUpperCase();

  const [form, setForm] = useState({
    participantId: randomParticipantId,
    role: 'Student',
    ageGroup: '18-22',
    gender: 'Prefer not to say',
    diabetes: 'No',
    hypertension: 'No',
    familyHistory: 'No',
    painkillerUsage: 'Rarely',
    waterIntake: '2-3L',
    exercise: '3-4 days/week',
    sleepHours: '7-8',
    saltyProcessed: 'Sometimes',
    fastFood: '1-2 times/week',
    sugaryDrinks: '1/day',
    smoking: 'No',
    alcohol: 'No',
    awareEarlySymptoms: true,
    awareRiskFactors: true,
    monitorsBp: false,
    receivedKidneyInfo: true,
    shapComprehensionScore: 4,
    narrativePreferenceScore: 4,
    guidelineTrustScore: 5,
    actionabilityScore: 5,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await researchApi.submitSurvey(form);
      setSubmitted(true);
    } catch (err) {
      console.error('Survey submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Thank you for participating!
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Your anonymous responses have been recorded under ID <strong className="font-mono text-teal-700">{form.participantId}</strong> in Dataset B for academic lifestyle and renal risk awareness research.
          </p>
        </div>

        <div className="pt-4 flex justify-center gap-3">
          <Button
            onClick={() => {
              setSubmitted(false);
              setForm({
                ...form,
                participantId: 'COL-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
              });
            }}
            variant="outline"
          >
            Submit Another Response
          </Button>
          <a href="/register">
            <Button>Explore Full Decision System</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">
          <Users className="w-4 h-4" />
          Academic Campus Research (Dataset B)
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Kidney Health & Lifestyle Survey
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Help our research team understand kidney health awareness, dietary habits, and hydration patterns among university students and faculty.
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-xs text-teal-950 leading-relaxed">
          <strong className="font-bold text-teal-900">Strictly Anonymized:</strong> No names, email addresses, student IDs, or IP addresses are logged. Your assigned identifier is randomly generated (<span className="font-mono font-semibold">{form.participantId}</span>).
        </div>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Demographics */}
        <Card title="1. Participant Background" icon={Users}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Campus Role"
              name="role"
              value={form.role}
              onChange={handleChange}
              options={[
                { value: 'Student', label: 'Student' },
                { value: 'Faculty', label: 'Faculty / Academic Staff' },
                { value: 'Other Staff', label: 'Other Staff' },
              ]}
              required
            />
            <Select
              label="Age Group"
              name="ageGroup"
              value={form.ageGroup}
              onChange={handleChange}
              options={[
                { value: '18-22', label: '18 – 22' },
                { value: '23-29', label: '23 – 29' },
                { value: '30-39', label: '30 – 39' },
                { value: '40+', label: '40+' },
              ]}
              required
            />
            <Select
              label="Gender (Optional)"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              options={[
                { value: 'Prefer not to say', label: 'Prefer not to say' },
                { value: 'Female', label: 'Female' },
                { value: 'Male', label: 'Male' },
                { value: 'Other', label: 'Other' },
              ]}
            />
          </div>
        </Card>

        {/* Section 2: Health & Risk Factors */}
        <Card title="2. Pre-existing Conditions & Family History" icon={Sparkles}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Diagnosed with Diabetes?"
              name="diabetes"
              value={form.diabetes}
              onChange={handleChange}
              options={[
                { value: 'No', label: 'No' },
                { value: 'Yes', label: 'Yes' },
                { value: "Don't know", label: "Don't know / Unsure" },
              ]}
            />
            <Select
              label="Diagnosed with High Blood Pressure?"
              name="hypertension"
              value={form.hypertension}
              onChange={handleChange}
              options={[
                { value: 'No', label: 'No' },
                { value: 'Yes', label: 'Yes' },
                { value: "Don't know", label: "Don't know / Unsure" },
              ]}
            />
            <Select
              label="Family History of Kidney Issues?"
              name="familyHistory"
              value={form.familyHistory}
              onChange={handleChange}
              options={[
                { value: 'No', label: 'No' },
                { value: 'Yes', label: 'Yes' },
                { value: "Don't know", label: "Don't know / Unsure" },
              ]}
            />
            <Select
              label="Painkiller / NSAID Intake"
              name="painkillerUsage"
              value={form.painkillerUsage}
              onChange={handleChange}
              helperText="Ibuprofen, Paracetamol, etc."
              options={[
                { value: 'Rarely', label: 'Rarely / Never' },
                { value: 'Weekly', label: '1–2 times a week' },
                { value: 'Frequent', label: 'Multiple times a week' },
              ]}
            />
          </div>
        </Card>

        {/* Section 3: Lifestyle Habits */}
        <Card title="3. Daily Lifestyle & Nutrition" icon={FileSpreadsheet}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Select
              label="Average Daily Water Intake"
              name="waterIntake"
              value={form.waterIntake}
              onChange={handleChange}
              options={[
                { value: '< 1L', label: 'Less than 1 Liter' },
                { value: '1-2L', label: '1 – 2 Liters' },
                { value: '2-3L', label: '2 – 3 Liters' },
                { value: '> 3L', label: 'More than 3 Liters' },
              ]}
            />
            <Select
              label="Physical Exercise"
              name="exercise"
              value={form.exercise}
              onChange={handleChange}
              options={[
                { value: 'None', label: 'Sedentary (No exercise)' },
                { value: '1-2 days/week', label: '1 – 2 days / week' },
                { value: '3-4 days/week', label: '3 – 4 days / week' },
                { value: '5+ days/week', label: '5+ days / week' },
              ]}
            />
            <Select
              label="Average Sleep per Night"
              name="sleepHours"
              value={form.sleepHours}
              onChange={handleChange}
              options={[
                { value: '< 6', label: 'Less than 6 hours' },
                { value: '6-7', label: '6 – 7 hours' },
                { value: '7-8', label: '7 – 8 hours' },
                { value: '> 8', label: 'More than 8 hours' },
              ]}
            />
            <Select
              label="Salty / Processed Food Intake"
              name="saltyProcessed"
              value={form.saltyProcessed}
              onChange={handleChange}
              options={[
                { value: 'Rarely', label: 'Rarely' },
                { value: 'Sometimes', label: 'Sometimes' },
                { value: 'Often', label: 'Daily / Often' },
              ]}
            />
            <Select
              label="Fast Food Consumption"
              name="fastFood"
              value={form.fastFood}
              onChange={handleChange}
              options={[
                { value: 'Rarely', label: 'Rarely / Never' },
                { value: '1-2 times/week', label: '1 – 2 times / week' },
                { value: '3+ times/week', label: '3 or more times / week' },
              ]}
            />
            <Select
              label="Sugary Drinks / Sodas"
              name="sugaryDrinks"
              value={form.sugaryDrinks}
              onChange={handleChange}
              options={[
                { value: 'None', label: 'None' },
                { value: '1/day', label: '1 bottle/can per day' },
                { value: '2+/day', label: '2 or more per day' },
              ]}
            />
          </div>
        </Card>

        {/* Section 4: Kidney Health Awareness */}
        <Card title="4. Renal Health Awareness" icon={HelpCircle}>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="awareEarlySymptoms"
                checked={form.awareEarlySymptoms}
                onChange={handleChange}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs font-medium text-slate-700">
                I am aware of early symptoms of kidney compromise (e.g. fatigue, foamy urine, swelling).
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="awareRiskFactors"
                checked={form.awareRiskFactors}
                onChange={handleChange}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs font-medium text-slate-700">
                I am aware that high blood pressure and diabetes are primary risk factors for chronic kidney disease.
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="monitorsBp"
                checked={form.monitorsBp}
                onChange={handleChange}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs font-medium text-slate-700">
                I monitor or check my blood pressure at least once or twice a year.
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                name="receivedKidneyInfo"
                checked={form.receivedKidneyInfo}
                onChange={handleChange}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs font-medium text-slate-700">
                I have received or read educational material on kidney health or hydration before.
              </span>
            </label>
          </div>
        </Card>

        {/* Section 5: XAI & Clinical Decision Support Evaluation (H2 & H3 Research Instrumentation) */}
        <Card 
          title="5. Decision Support & Explainability Evaluation (User Study)" 
          subtitle="Measures user comprehension, trust calibration, and recommendation provenance utility (1 = Strongly Disagree, 5 = Strongly Agree)"
          icon={Sparkles}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                (H2: Explanation Comprehension) "The directional SHAP feature charts helped me understand which biomarkers contributed to the risk score."
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setForm({ ...form, shapComprehensionScore: val })}
                    className={`py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      (form.shapComprehensionScore || 4) === val
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {val} {val === 1 ? '(Disagree)' : val === 5 ? '(Agree)' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                (H2: Bimodal Preference) "I found the plain-language clinical synthesis easier to understand than mathematical charts alone."
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setForm({ ...form, narrativePreferenceScore: val })}
                    className={`py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      (form.narrativePreferenceScore || 4) === val
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                (H3: Recommendation Provenance) "Seeing clinical guideline citations (e.g. KDIGO 2024) and clicking 'Why am I seeing this?' increased my trust in the system."
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setForm({ ...form, guidelineTrustScore: val })}
                    className={`py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      (form.guidelineTrustScore || 5) === val
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                (H3: Actionability & Adherence) "The personalized recommendations provided clear, actionable lifestyle steps to protect renal health."
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setForm({ ...form, actionabilityScore: val })}
                    className={`py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      (form.actionabilityScore || 5) === val
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" size="lg" loading={loading} icon={CheckCircle2} className="shadow-md shadow-teal-600/20">
            Submit Anonymous Research Response
          </Button>
        </div>
      </form>
    </div>
  );
};
