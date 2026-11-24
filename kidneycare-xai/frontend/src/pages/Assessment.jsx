import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AssistantAction } from '../components/assistant/assistantContext';
import { assessmentApi } from '../api';
import { labApi } from '../api/medicalRecords';
import { 
  HeartPulse, 
  Sparkles, 
  Info, 
  FlaskConical, 
  ArrowRight,
  Home,
} from 'lucide-react';
import { Button, Input, Select, Card, Alert } from '../components/common';

export const Assessment = () => {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const sourceReportId = search.get('fromReport');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState(sourceReportId ? 'LAB' : 'HOME');

  const initialForm = {
    age: '',
    bloodPressure: '',
    specificGravity: '',
    albumin: '',
    sugar: '',
    redBloodCells: '',
    pusCell: '',
    pusCellClumps: '',
    bacteria: '',
    bloodGlucoseRandom: '',
    bloodUrea: '',
    serumCreatinine: '',
    sodium: '',
    potassium: '',
    hemoglobin: '',
    packedCellVolume: '',
    whiteBloodCellCount: '',
    redBloodCellCount: '',
    hypertension: '',
    diabetesMellitus: '',
    coronaryArteryDisease: '',
    appetite: '',
    pedalEdema: '',
    anemia: '',
  };

  const [form, setForm] = useState(initialForm);
  const [prefill, setPrefill] = useState(null);
  const [reviewedReport, setReviewedReport] = useState('');
  const [loadingPrefill, setLoadingPrefill] = useState(false);
  const [prefillNotice, setPrefillNotice] = useState('');

  const reviewLaboratoryValues = async () => {
    setPrefillNotice('');
    setLoadingPrefill(true);
    try {
      const eligible = await labApi.assessmentInputs();
      const filtered = Object.fromEntries(Object.entries(eligible).filter(([, item]) =>
        !sourceReportId || String(item.reportId) === sourceReportId));
      setPrefill(filtered);
      const reports = new Set(Object.values(filtered).map((item) => String(item.reportId)));
      setReviewedReport(reports.size === 1 ? [...reports][0] : '');
    } catch {
      setPrefillNotice('Confirmed laboratory values could not be loaded.');
    } finally {
      setLoadingPrefill(false);
    }
  };

  const applyLaboratoryValues = () => {
    setForm((current) => ({
      ...current,
      ...Object.fromEntries(Object.entries(prefill).filter(([, item]) => String(item.reportId) === reviewedReport)
        .map(([field, result]) => [field, String(result.normalizedValue)])),
    }));
    setMode('LAB');
    setPrefill(null);
    setPrefillNotice('Values copied. Review the date, units and all remaining inputs before submitting.');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || mode !== 'LAB') return;
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
        redBloodCells: form.redBloodCells || null,
        pusCell: form.pusCell || null,
        pusCellClumps: form.pusCellClumps || null,
        bacteria: form.bacteria || null,
        bloodGlucoseRandom: form.bloodGlucoseRandom ? parseFloat(form.bloodGlucoseRandom) : null,
        bloodUrea: form.bloodUrea ? parseFloat(form.bloodUrea) : null,
        serumCreatinine: form.serumCreatinine ? parseFloat(form.serumCreatinine) : null,
        sodium: form.sodium ? parseFloat(form.sodium) : null,
        potassium: form.potassium ? parseFloat(form.potassium) : null,
        hemoglobin: form.hemoglobin ? parseFloat(form.hemoglobin) : null,
        packedCellVolume: form.packedCellVolume ? parseFloat(form.packedCellVolume) : null,
        whiteBloodCellCount: form.whiteBloodCellCount ? parseFloat(form.whiteBloodCellCount) : null,
        redBloodCellCount: form.redBloodCellCount ? parseFloat(form.redBloodCellCount) : null,
        hypertension: form.hypertension || null,
        diabetesMellitus: form.diabetesMellitus || null,
        coronaryArteryDisease: form.coronaryArteryDisease || null,
        appetite: form.appetite || null,
        pedalEdema: form.pedalEdema || null,
        anemia: form.anemia || null,
      };

      const result = await assessmentApi.createAssessment(payload);
      // Navigate to results screen with the returned assessment
      navigate(`/assessment/result/${result.id}`, { state: { assessment: result } });
    } catch (err) {
      const status = err.response?.status;
      const msg = status === 401 ? 'Your session expired. Sign in to continue.'
        : status === 400 || status === 422 ? 'Review the recorded inputs, units and accepted values.'
        : 'The research model is currently unavailable. Try again shortly.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">Kidney Assessment</h1>
        <p>Review daily observations or enter laboratory records for a research assessment.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link className="underline" to="/history">Assessment history</Link>
          <AssistantAction question="What information is used in a laboratory-based assessment?">Ask about the assessment</AssistantAction>
        </div>
      </header>

      <div className="grid gap-2 sm:grid-cols-2" aria-label="Assessment mode">
        <Button variant={mode === 'HOME' ? 'primary' : 'secondary'} aria-pressed={mode === 'HOME'} icon={Home}
          onClick={() => setMode('HOME')}>Lifestyle &amp; Health Review</Button>
        <Button variant={mode === 'LAB' ? 'primary' : 'secondary'} aria-pressed={mode === 'LAB'} icon={FlaskConical}
          onClick={() => setMode('LAB')}>Laboratory-Based Research Assessment</Button>
      </div>

      {mode === 'HOME' ? <Card title="Review your daily observations">
        <p>Use your journal to record symptoms, sleep, activity and medication routines. The journal can help you organize what to discuss with a clinician.</p>
        <p className="mt-3 text-sm">Before an appointment, consider noting when symptoms started, what has changed and any instructions from your care team.</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link className="underline" to="/tracker">Open daily journal</Link>
          <Link className="underline" to="/recommendations">View educational guidance</Link>
        </div>
      </Card> : <>
      <Alert variant="info">This assessment uses a model trained on a research dataset. Age and diastolic pressure are required. Leave unavailable observations blank. The model applies preprocessing learned during training to missing inputs.</Alert>
      {error && <Alert variant="danger" onClose={() => setError('')}>{error}</Alert>}
      {/* Form */}
      <Card className="space-y-3">
        <Button variant="secondary" onClick={reviewLaboratoryValues} disabled={loadingPrefill}>
          {loadingPrefill ? 'Loading saved results…' : 'Review saved laboratory values'}
        </Button>
        {prefillNotice && <p role="status">{prefillNotice}</p>}
        {prefill && (Object.keys(prefill).length ? <>
          <p>Only compatible values you confirmed are eligible. Choose one source report and review the dates and units.</p>
          <Select name="assessment-source-report" label="Source report to copy" value={reviewedReport}
            onChange={(event) => setReviewedReport(event.target.value)} options={[
              { value: '', label: 'Choose a source report' },
              ...[...new Map(Object.values(prefill).map((item) => [String(item.reportId), item])).entries()].map(([id, item]) =>
                ({ value: id, label: `Report #${id} · ${item.source}` })),
            ]} />
          <ul className="list-disc pl-5">
            {Object.values(prefill).map((item) => <li key={item.id}>
              {item.parameterName.replaceAll('_', ' ')} · {item.normalizedValue} {item.normalizedUnit} · {item.recordedAt} · {item.source} · Confirmed by user · <Link className="underline" to={"/reports/" + item.reportId}>Source report</Link>
            </li>)}
          </ul>
          <Button onClick={applyLaboratoryValues} disabled={!reviewedReport}>Confirm and copy values</Button>
          <Button variant="secondary" onClick={() => setPrefill(null)}>Cancel</Button>
        </> : <p role="status">No eligible confirmed measurements are available.</p>)}
      </Card>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Vitals & Demographics */}
        <Card title="Demographics & Blood Pressure" icon={HeartPulse}>
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
              label="Diastolic Blood Pressure (mmHg)"
              type="number"
              name="bloodPressure"
              value={form.bloodPressure}
              onChange={handleChange}
              helperText="Enter the lower blood pressure reading."
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
                { value: '', label: 'Not recorded' },
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
          </div>
        </Card>

        {/* Section 2: Symptoms & Medical History */}
        <Card title="Recorded Observations & Health History" icon={Sparkles}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <Select
              label="Swollen Feet / Ankles (Edema)"
              name="pedalEdema"
              value={form.pedalEdema}
              onChange={handleChange}
              options={[
                { value: '', label: 'Not recorded' },
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
                { value: '', label: 'Not recorded' },
                { value: 'good', label: 'Good / Normal' },
                { value: 'poor', label: 'Poor (Loss of appetite)' },
              ]}
            />
            <Select
              label="Recorded Anemia"
              name="anemia"
              value={form.anemia}
              onChange={handleChange}
              options={[
                { value: '', label: 'Not recorded' },
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
            <Select
              label="Diabetes History"
              name="diabetesMellitus"
              value={form.diabetesMellitus}
              onChange={handleChange}
              options={[
                { value: '', label: 'Not recorded' },
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
                { value: '', label: 'Not recorded' },
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Yes' },
              ]}
            />
          </div>
        </Card>

        {mode === 'LAB' && (
          <>
            <Card title="Blood Chemistry & Blood Counts" icon={FlaskConical}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <Input
                  label="Serum Creatinine (mg/dL)"
                  type="number"
                  step="0.1"
                  name="serumCreatinine"
                  value={form.serumCreatinine}
                  onChange={handleChange}
                />
                <Input
                  label="Blood Urea (mg/dL)"
                  type="number"
                  step="0.1"
                  name="bloodUrea"
                  value={form.bloodUrea}
                  onChange={handleChange}
                />
                <Input
                  label="Hemoglobin (g/dL)"
                  type="number"
                  step="0.1"
                  name="hemoglobin"
                  value={form.hemoglobin}
                  onChange={handleChange}
                />
                <Input
                  label="Random Blood Glucose (mg/dL)"
                  type="number"
                  step="1"
                  name="bloodGlucoseRandom"
                  value={form.bloodGlucoseRandom}
                  onChange={handleChange}
                />
                <Input
                  label="Serum Sodium (mEq/L)"
                  type="number"
                  step="0.1"
                  name="sodium"
                  value={form.sodium}
                  onChange={handleChange}
                />
                <Input
                  label="Serum Potassium (mEq/L)"
                  type="number"
                  step="0.1"
                  name="potassium"
                  value={form.potassium}
                  onChange={handleChange}
                />
                <Input
                  label="Packed Cell Volume (PCV %)"
                  type="number"
                  step="1"
                  name="packedCellVolume"
                  value={form.packedCellVolume}
                  onChange={handleChange}
                />
                <Input
                  label="White Blood Cell Count"
                  type="number"
                  step="100"
                  name="whiteBloodCellCount"
                  value={form.whiteBloodCellCount}
                  onChange={handleChange}
                />
                <Input
                  label="Red Blood Cell Count (M/µL)"
                  type="number"
                  step="0.1"
                  name="redBloodCellCount"
                  value={form.redBloodCellCount}
                  onChange={handleChange}
                />
              </div>
            </Card>

            <Card title="Urinalysis" icon={FlaskConical}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <Select
                  label="Specific Gravity"
                  name="specificGravity"
                  value={form.specificGravity}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Not recorded' },
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
                    { value: '', label: 'Not recorded' },
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
                    { value: '', label: 'Not recorded' },
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
                    { value: '', label: 'Not recorded' },
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
                    { value: '', label: 'Not recorded' },
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
                    { value: '', label: 'Not recorded' },
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
            The model estimates a benchmark classification from recorded inputs. TreeSHAP explains how each input contributed to the model output. Discuss medical questions with a qualified clinician.
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
            {loading ? 'Running research assessment…' : 'Run research assessment'}
          </Button>
        </div>
      </form>
      </>}
    </div>
  );
};
