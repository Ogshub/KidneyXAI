import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentApi } from '../api';
import { 
  HeartPulse, 
  Sparkles, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  FlaskConical, 
  Activity,
  ArrowRight,
  Home,
  ChevronDown,
  ChevronUp,
  ShieldCheck
} from 'lucide-react';
import { Button, Input, Select, Card, Alert } from '../components/common';

export const Assessment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('HOME'); // 'HOME' | 'LAB'
  const [showOptionalLabs, setShowOptionalLabs] = useState(false);

  const initialForm = {
    age: '45',
    bloodPressure: '80',
    specificGravity: '1.020',
    albumin: '0',
    sugar: '0',
    redBloodCells: 'normal',
    pusCell: 'normal',
    pusCellClumps: 'notpresent',
    bacteria: 'notpresent',
    bloodGlucoseRandom: '110',
    bloodUrea: '36',
    serumCreatinine: '1.1',
    sodium: '138',
    potassium: '4.5',
    hemoglobin: '15.2',
    packedCellVolume: '44',
    whiteBloodCellCount: '7500',
    redBloodCellCount: '5.1',
    hypertension: 'no',
    diabetesMellitus: 'no',
    coronaryArteryDisease: 'no',
    appetite: 'good',
    pedalEdema: 'no',
    anemia: 'no',
  };

  const [form, setForm] = useState(initialForm);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const loadSampleHealthy = () => {
    setForm({
      age: '32',
      bloodPressure: '75',
      specificGravity: '1.025',
      albumin: '0',
      sugar: '0',
      redBloodCells: 'normal',
      pusCell: 'normal',
      pusCellClumps: 'notpresent',
      bacteria: 'notpresent',
      bloodGlucoseRandom: '95',
      bloodUrea: '25',
      serumCreatinine: '0.9',
      sodium: '140',
      potassium: '4.2',
      hemoglobin: '15.6',
      packedCellVolume: '46',
      whiteBloodCellCount: '6800',
      redBloodCellCount: '5.2',
      hypertension: 'no',
      diabetesMellitus: 'no',
      coronaryArteryDisease: 'no',
      appetite: 'good',
      pedalEdema: 'no',
      anemia: 'no',
    });
  };

  const loadSampleElevatedRisk = () => {
    setForm({
      age: '58',
      bloodPressure: '90',
      specificGravity: '1.010',
      albumin: '2',
      sugar: '1',
      redBloodCells: 'abnormal',
      pusCell: 'abnormal',
      pusCellClumps: 'present',
      bacteria: 'notpresent',
      bloodGlucoseRandom: '165',
      bloodUrea: '65',
      serumCreatinine: '2.4',
      sodium: '132',
      potassium: '5.3',
      hemoglobin: '10.8',
      packedCellVolume: '33',
      whiteBloodCellCount: '10200',
      redBloodCellCount: '3.8',
      hypertension: 'yes',
      diabetesMellitus: 'yes',
      coronaryArteryDisease: 'no',
      appetite: 'poor',
      pedalEdema: 'yes',
      anemia: 'yes',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Map fields to numerical types where expected
      const payload = {
        age: parseFloat(form.age),
        bloodPressure: parseFloat(form.bloodPressure),
        specificGravity: form.specificGravity ? parseFloat(form.specificGravity) : null,
        albumin: form.albumin ? parseFloat(form.albumin) : null,
        sugar: form.sugar ? parseFloat(form.sugar) : null,
        redBloodCells: form.redBloodCells,
        pusCell: form.pusCell,
        pusCellClumps: form.pusCellClumps,
        bacteria: form.bacteria,
        bloodGlucoseRandom: form.bloodGlucoseRandom ? parseFloat(form.bloodGlucoseRandom) : null,
        bloodUrea: form.bloodUrea ? parseFloat(form.bloodUrea) : null,
        serumCreatinine: form.serumCreatinine ? parseFloat(form.serumCreatinine) : null,
        sodium: form.sodium ? parseFloat(form.sodium) : null,
        potassium: form.potassium ? parseFloat(form.potassium) : null,
        hemoglobin: form.hemoglobin ? parseFloat(form.hemoglobin) : null,
        packedCellVolume: form.packedCellVolume ? parseFloat(form.packedCellVolume) : null,
        whiteBloodCellCount: form.whiteBloodCellCount ? parseFloat(form.whiteBloodCellCount) : null,
        redBloodCellCount: form.redBloodCellCount ? parseFloat(form.redBloodCellCount) : null,
        hypertension: form.hypertension,
        diabetesMellitus: form.diabetesMellitus,
        coronaryArteryDisease: form.coronaryArteryDisease,
        appetite: form.appetite,
        pedalEdema: form.pedalEdema,
        anemia: form.anemia,
      };

      const result = await assessmentApi.createAssessment(payload);
      // Navigate to results screen with the returned assessment
      navigate(`/assessment/result/${result.id}`, { state: { assessment: result } });
    } catch (err) {
      console.error('Assessment submission error:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to process clinical assessment with ML service. Please ensure the backend and ML service are active.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4" />
            Machine Learning Inference
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Kidney Disease Risk Assessment
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            {mode === 'HOME'
              ? 'Quick at-home screener based on your vitals, symptoms, and lifestyle — no lab test required.'
              : 'Enter your clinical lab measurements to run the full 24-feature XGBoost/SHAP decision-support engine.'}
          </p>
        </div>

        {/* Preset Sample Fillers (visible in Lab mode) */}
        {mode === 'LAB' && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={loadSampleHealthy}>
              Load Normal Sample
            </Button>
            <Button size="sm" variant="secondary" onClick={loadSampleElevatedRisk}>
              Load Elevated Sample
            </Button>
          </div>
        )}
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700">
        <button
          type="button"
          onClick={() => setMode('HOME')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
            mode === 'HOME'
              ? 'bg-white dark:bg-neutral-900 text-teal-600 dark:text-teal-400 shadow-sm border border-slate-200/80 dark:border-neutral-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home Lifestyle & Symptom Check</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-semibold ml-1">
            No Lab Test Needed
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMode('LAB')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
            mode === 'LAB'
              ? 'bg-white dark:bg-neutral-900 text-teal-600 dark:text-teal-400 shadow-sm border border-slate-200/80 dark:border-neutral-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Clinical Lab Report Analyzer</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-neutral-700 text-slate-800 dark:text-slate-200 font-semibold ml-1">
            Full 24 Markers
          </span>
        </button>
      </div>

      {mode === 'HOME' && (
        <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="text-xs text-teal-950 dark:text-teal-200 leading-relaxed">
            <strong className="font-semibold text-teal-900 dark:text-teal-100">At-Home Self-Screening Mode:</strong> You do not need hospital blood tests or urine reports to use this! Answer simple questions about your age, resting blood pressure, physical symptoms, and health history. The AI automatically applies standard healthy clinical medians for unmeasured lab metrics.
          </div>
        </div>
      )}

      {error && (
        <Alert type="danger" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Vitals & Demographics */}
        <Card title="1. Demographics & Blood Pressure" icon={HeartPulse}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <Input
              label="Age (Years)"
              type="number"
              name="age"
              value={form.age}
              onChange={handleChange}
              min="1"
              max="120"
              required
            />
            <Input
              label="Resting Blood Pressure (mm/Hg)"
              type="number"
              name="bloodPressure"
              value={form.bloodPressure}
              onChange={handleChange}
              helperText="Diastolic / resting (e.g., 80 mm/Hg)"
              min="40"
              max="200"
              required
            />
            <Select
              label="Known Hypertension History"
              name="hypertension"
              value={form.hypertension}
              onChange={handleChange}
              options={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
          </div>
        </Card>

        {/* Section 2: Symptoms & Medical History */}
        <Card title="2. Early Warning Signs & Health History" icon={Sparkles}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <Select
              label="Swollen Feet / Ankles (Edema)"
              name="pedalEdema"
              value={form.pedalEdema}
              onChange={handleChange}
              options={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes (Noticeable swelling)' },
              ]}
            />
            <Select
              label="Appetite Status"
              name="appetite"
              value={form.appetite}
              onChange={handleChange}
              options={[
                { value: 'good', label: 'Good / Normal' },
                { value: 'poor', label: 'Poor (Loss of appetite)' },
              ]}
            />
            <Select
              label="Fatigue / Anemia Signs"
              name="anemia"
              value={form.anemia}
              onChange={handleChange}
              options={[
                { value: 'no', label: 'No (Normal energy)' },
                { value: 'yes', label: 'Yes (Frequent weakness / fatigue)' },
              ]}
            />
            <Select
              label="Diabetes History"
              name="diabetesMellitus"
              value={form.diabetesMellitus}
              onChange={handleChange}
              options={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
            <Select
              label="Heart / Artery Disease"
              name="coronaryArteryDisease"
              value={form.coronaryArteryDisease}
              onChange={handleChange}
              options={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
          </div>
        </Card>

        {/* Home Mode: Optional Collapsible Lab Values */}
        {mode === 'HOME' && (
          <div className="border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <button
              type="button"
              onClick={() => setShowOptionalLabs(!showOptionalLabs)}
              className="flex items-center justify-between w-full text-left font-semibold text-slate-800 dark:text-slate-200 text-sm hover:text-teal-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-teal-600" />
                <span>Have any recent blood or urine test numbers? (Optional)</span>
              </div>
              {showOptionalLabs ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            <p className="text-xs text-slate-500">
              If you leave this closed, our algorithm automatically uses standard healthy median baselines for lab parameters.
            </p>

            {showOptionalLabs && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-3 border-t border-slate-100 dark:border-neutral-800">
                <Input
                  label="Serum Creatinine (mg/dL)"
                  type="number"
                  step="0.1"
                  name="serumCreatinine"
                  value={form.serumCreatinine}
                  onChange={handleChange}
                  helperText="Normal: 0.6 – 1.3 mg/dL"
                />
                <Input
                  label="Blood Urea / BUN (mg/dL)"
                  type="number"
                  step="0.1"
                  name="bloodUrea"
                  value={form.bloodUrea}
                  onChange={handleChange}
                  helperText="Normal: 15 – 45 mg/dL"
                />
                <Input
                  label="Hemoglobin (g/dL)"
                  type="number"
                  step="0.1"
                  name="hemoglobin"
                  value={form.hemoglobin}
                  onChange={handleChange}
                  helperText="Normal: 13.5 – 17.5 g/dL"
                />
                <Input
                  label="Random Blood Sugar (mg/dL)"
                  type="number"
                  step="1"
                  name="bloodGlucoseRandom"
                  value={form.bloodGlucoseRandom}
                  onChange={handleChange}
                  helperText="Normal: < 140 mg/dL"
                />
                <Select
                  label="Urine Albumin (Protein)"
                  name="albumin"
                  value={form.albumin}
                  onChange={handleChange}
                  options={[
                    { value: '0', label: '0 (Nil / Normal)' },
                    { value: '1', label: '1 (Trace / +)' },
                    { value: '2', label: '2 (++)' },
                    { value: '3', label: '3 (+++)' },
                  ]}
                />
              </div>
            )}
          </div>
        )}

        {/* Lab Mode: Full Detailed Clinical Panels */}
        {mode === 'LAB' && (
          <>
            <Card title="3. Renal & Blood Chemistry Panel" icon={FlaskConical}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <Input
                  label="Serum Creatinine (mg/dL)"
                  type="number"
                  step="0.1"
                  name="serumCreatinine"
                  value={form.serumCreatinine}
                  onChange={handleChange}
                  helperText="Normal: 0.6 – 1.3 mg/dL"
                />
                <Input
                  label="Blood Urea (mg/dL)"
                  type="number"
                  step="0.1"
                  name="bloodUrea"
                  value={form.bloodUrea}
                  onChange={handleChange}
                  helperText="Normal: 15 – 45 mg/dL"
                />
                <Input
                  label="Hemoglobin (g/dL)"
                  type="number"
                  step="0.1"
                  name="hemoglobin"
                  value={form.hemoglobin}
                  onChange={handleChange}
                  helperText="Normal: 13.5 – 17.5 g/dL"
                />
                <Input
                  label="Random Blood Glucose (mg/dL)"
                  type="number"
                  step="1"
                  name="bloodGlucoseRandom"
                  value={form.bloodGlucoseRandom}
                  onChange={handleChange}
                  helperText="Normal: < 140 mg/dL"
                />
                <Input
                  label="Serum Sodium (mEq/L)"
                  type="number"
                  step="0.1"
                  name="sodium"
                  value={form.sodium}
                  onChange={handleChange}
                  helperText="Normal: 135 – 145 mEq/L"
                />
                <Input
                  label="Serum Potassium (mEq/L)"
                  type="number"
                  step="0.1"
                  name="potassium"
                  value={form.potassium}
                  onChange={handleChange}
                  helperText="Normal: 3.5 – 5.0 mEq/L"
                />
                <Input
                  label="Packed Cell Volume (PCV %)"
                  type="number"
                  step="1"
                  name="packedCellVolume"
                  value={form.packedCellVolume}
                  onChange={handleChange}
                  helperText="Normal: 40 – 50%"
                />
                <Input
                  label="White Blood Cell Count"
                  type="number"
                  step="100"
                  name="whiteBloodCellCount"
                  value={form.whiteBloodCellCount}
                  onChange={handleChange}
                  helperText="Normal: 4,000 – 11,000 /µL"
                />
                <Input
                  label="Red Blood Cell Count (M/µL)"
                  type="number"
                  step="0.1"
                  name="redBloodCellCount"
                  value={form.redBloodCellCount}
                  onChange={handleChange}
                  helperText="Normal: 4.5 – 5.9 M/µL"
                />
              </div>
            </Card>

            <Card title="4. Urinalysis Parameters" icon={Activity}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <Select
                  label="Specific Gravity"
                  name="specificGravity"
                  value={form.specificGravity}
                  onChange={handleChange}
                  options={[
                    { value: '1.005', label: '1.005' },
                    { value: '1.010', label: '1.010' },
                    { value: '1.015', label: '1.015' },
                    { value: '1.020', label: '1.020' },
                    { value: '1.025', label: '1.025' },
                  ]}
                />
                <Select
                  label="Albumin (Proteinuria)"
                  name="albumin"
                  value={form.albumin}
                  onChange={handleChange}
                  options={[
                    { value: '0', label: '0 (Nil)' },
                    { value: '1', label: '1 (Trace / +)' },
                    { value: '2', label: '2 (++)' },
                    { value: '3', label: '3 (+++)' },
                    { value: '4', label: '4 (++++)' },
                    { value: '5', label: '5 (Severe)' },
                  ]}
                />
                <Select
                  label="Urine Sugar (Glucosuria)"
                  name="sugar"
                  value={form.sugar}
                  onChange={handleChange}
                  options={[
                    { value: '0', label: '0 (Nil)' },
                    { value: '1', label: '1 (+)' },
                    { value: '2', label: '2 (++)' },
                    { value: '3', label: '3 (+++)' },
                    { value: '4', label: '4 (++++)' },
                  ]}
                />
                <Select
                  label="Red Blood Cells in Urine"
                  name="redBloodCells"
                  value={form.redBloodCells}
                  onChange={handleChange}
                  options={[
                    { value: 'normal', label: 'Normal' },
                    { value: 'abnormal', label: 'Abnormal' },
                  ]}
                />
                <Select
                  label="Pus Cells in Urine"
                  name="pusCell"
                  value={form.pusCell}
                  onChange={handleChange}
                  options={[
                    { value: 'normal', label: 'Normal' },
                    { value: 'abnormal', label: 'Abnormal' },
                  ]}
                />
                <Select
                  label="Pus Cell Clumps"
                  name="pusCellClumps"
                  value={form.pusCellClumps}
                  onChange={handleChange}
                  options={[
                    { value: 'notpresent', label: 'Not Present' },
                    { value: 'present', label: 'Present' },
                  ]}
                />
              </div>
            </Card>
          </>
        )}

        <div className="p-4 rounded-xl bg-slate-100 dark:bg-neutral-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            The system computes probability of Chronic Kidney Disease (CKD) risk, generates personalized clinical & lifestyle recommendations, and runs TreeSHAP attribution to reveal which factors influence your score.
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            size="lg"
            loading={loading}
            icon={ArrowRight}
            className="w-full sm:w-auto shadow-lg shadow-teal-600/20"
          >
            {mode === 'HOME' ? 'Calculate My Kidney Risk' : 'Compute Risk & SHAP Explanation'}
          </Button>
        </div>
      </form>
    </div>
  );
};
