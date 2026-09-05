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
  ArrowRight
} from 'lucide-react';
import { Button, Input, Select, Card, Alert } from '../components/common';

export const Assessment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Kidney Disease Risk Assessment
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Enter your clinical measurements to run the XGBoost/SHAP decision-support engine.
          </p>
        </div>

        {/* Preset Sample Fillers */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={loadSampleHealthy}>
            Load Normal Sample
          </Button>
          <Button size="sm" variant="secondary" onClick={loadSampleElevatedRisk}>
            Load Elevated Sample
          </Button>
        </div>
      </div>

      {error && (
        <Alert type="danger" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Vitals & Demographics */}
        <Card title="1. Demographics & Vitals" icon={HeartPulse}>
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
              label="Blood Pressure (mm/Hg)"
              type="number"
              name="bloodPressure"
              value={form.bloodPressure}
              onChange={handleChange}
              helperText="Diastolic / resting (e.g., 80)"
              min="40"
              max="200"
              required
            />
            <Select
              label="Hypertension History"
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

        {/* Section 2: Blood Chemistry & Renal Biomarkers */}
        <Card title="2. Renal & Blood Chemistry Panel" icon={FlaskConical}>
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

        {/* Section 3: Urinalysis */}
        <Card title="3. Urinalysis Parameters" icon={Activity}>
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

        {/* Section 4: Clinical History & Symptoms */}
        <Card title="4. Clinical Conditions & Symptoms" icon={Sparkles}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <Select
              label="Diabetes Mellitus"
              name="diabetesMellitus"
              value={form.diabetesMellitus}
              onChange={handleChange}
              options={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
            <Select
              label="Coronary Artery Disease"
              name="coronaryArteryDisease"
              value={form.coronaryArteryDisease}
              onChange={handleChange}
              options={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
            <Select
              label="Appetite"
              name="appetite"
              value={form.appetite}
              onChange={handleChange}
              options={[
                { value: 'good', label: 'Good' },
                { value: 'poor', label: 'Poor' },
              ]}
            />
            <Select
              label="Pedal Edema (Swollen Ankles/Feet)"
              name="pedalEdema"
              value={form.pedalEdema}
              onChange={handleChange}
              options={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
            <Select
              label="Anemia"
              name="anemia"
              value={form.anemia}
              onChange={handleChange}
              options={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
          </div>
        </Card>

        <div className="p-4 rounded-xl bg-slate-100 text-xs text-slate-600 flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            The model computes probability of Chronic Kidney Disease (CKD) risk and automatically runs local TreeSHAP attribution to identify which markers push risk higher or lower.
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
            Compute Risk & SHAP Explanation
          </Button>
        </div>
      </form>
    </div>
  );
};
