import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AssistantAction } from '../components/assistant/assistantContext';
import { activityApi } from '../api';
import {
  Activity,
  Droplet,
  Calendar,
  Check,
  CalendarDays,
  CalendarRange,
} from 'lucide-react';
import { Card, Button, Input, Select, Alert, Spinner, Badge } from '../components/common';
import { MonthlyTrackerView } from '../components/tracker/MonthlyTrackerView';

/** Convert ISO date string "YYYY-MM-DD" → "DD/MM/YYYY" for display */
const fmtDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const emptyEntry = (activityDate) => ({
  activityDate,
  waterIntakeLiters: '',
  exerciseMinutes: '',
  exerciseType: '',
  sleepHours: '',
  sleepQuality: '',
  saltLevel: '',
  fastFood: '',
  sugaryDrinks: '',
  smoking: '',
  alcohol: '',
  weightKg: '',
  stressLevel: '',
  systolicBp: '',
  diastolicBp: '',
  medicationStatus: 'NOT_RECORDED',
  symptoms: '',
  personalNotes: '',
  doctorRestrictions: '',
});
const fromBoolean = (value) => value == null ? '' : value ? 'yes' : 'no';
const toBoolean = (value) => value === '' ? null : value === 'yes';
const missingOption = { value: '', label: 'Not recorded' };
const numericInput = (value) => value == null ? '' : String(value);

function toForm(entry) {
  return {
    ...emptyEntry(entry.activityDate),
    waterIntakeLiters: numericInput(entry.waterIntakeLiters),
    exerciseMinutes: numericInput(entry.exerciseMinutes),
    exerciseType: entry.exerciseType ?? '',
    sleepHours: numericInput(entry.sleepHours),
    sleepQuality: entry.sleepQuality ?? '',
    saltLevel: entry.saltLevel ?? '',
    fastFood: fromBoolean(entry.fastFood),
    sugaryDrinks: numericInput(entry.sugaryDrinks),
    smoking: fromBoolean(entry.smoking),
    alcohol: fromBoolean(entry.alcohol),
    weightKg: numericInput(entry.weightKg),
    stressLevel: entry.stressLevel ?? '',
    systolicBp: numericInput(entry.systolicBp),
    diastolicBp: numericInput(entry.diastolicBp),
    medicationStatus: entry.medicationStatus ?? 'NOT_RECORDED',
    symptoms: entry.symptoms ?? '',
    personalNotes: entry.personalNotes ?? '',
    doctorRestrictions: entry.doctorRestrictions ?? '',
  };
}

export const DailyTracker = () => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // ─── View: 'daily' | 'weekly' | 'monthly' ──────────────────────────────────
  const [activeView, setActiveView] = useState('daily');
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // ─── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState(() => emptyEntry(todayStr));

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const shouldPopulateToday = useRef(true);

  const fetchRecent = useCallback(async () => {
    try {
      setHistoryLoading(true);
      setHistoryError('');
      const data = await activityApi.getActivities();
      setHistory(data || []);
      if (shouldPopulateToday.current) {
        shouldPopulateToday.current = false;
        const today = data?.find((entry) => entry.activityDate === todayStr);
        if (today) setForm(toForm(today));
      }
    } catch {
      setHistoryError('Saved journal entries could not be loaded.');
    } finally {
      setHistoryLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
    if (success) setSuccess('');
    if (error) setError('');
  };

  const adjustWater = (delta) => {
    const current = parseFloat(form.waterIntakeLiters) || 0;
    const updated = Math.max(0, parseFloat((current + delta).toFixed(2)));
    setForm({ ...form, waterIntakeLiters: updated.toString() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || historyLoading || historyError || !form.activityDate || form.activityDate > todayStr) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        activityDate: form.activityDate,
        waterIntakeLiters: form.waterIntakeLiters ? parseFloat(form.waterIntakeLiters) : null,
        exerciseMinutes: form.exerciseMinutes ? parseInt(form.exerciseMinutes, 10) : null,
        exerciseType: form.exerciseType || null,
        sleepHours: form.sleepHours ? parseFloat(form.sleepHours) : null,
        sleepQuality: form.sleepQuality || null,
        saltLevel: form.saltLevel || null,
        fastFood: toBoolean(form.fastFood),
        sugaryDrinks: form.sugaryDrinks ? parseInt(form.sugaryDrinks, 10) : null,
        smoking: toBoolean(form.smoking),
        alcohol: toBoolean(form.alcohol),
        weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
        stressLevel: form.stressLevel || null,
        systolicBp: form.systolicBp ? parseInt(form.systolicBp, 10) : null,
        diastolicBp: form.diastolicBp ? parseInt(form.diastolicBp, 10) : null,
        medicationStatus: form.medicationStatus || 'NOT_RECORDED',
        symptoms: form.symptoms ? form.symptoms.trim() : null,
        personalNotes: form.personalNotes ? form.personalNotes.trim() : null,
        doctorRestrictions: form.doctorRestrictions ? form.doctorRestrictions.trim() : null,
      };

      await activityApi.logActivity(payload);
      setSuccess(`Lifestyle activity for ${fmtDate(form.activityDate)} saved successfully!`);
      fetchRecent();
    } catch (err) {
      console.error('Failed to log activity:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to save daily lifestyle log.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = useCallback(async (period = 'weekly') => {
    try {
      setSummaryLoading(true);
      const data = await activityApi.getActivitySummary(period, form.activityDate);
      setSummaryData(data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [form.activityDate]);

  useEffect(() => {
    if (activeView === 'weekly') {
      fetchSummary('weekly');
    }
  }, [activeView, fetchSummary]);

  /**
   * Called when user clicks an entry from history or calendar.
   * Switches to Daily tab and pre-fills all recorded values for editing.
   */
  const handleSelectDateForEdit = (dateStr) => {
    if (!dateStr || dateStr > todayStr) return;
    setActiveView('daily');
    setSuccess('');
    setError('');
    const existing = history.find((h) => h.activityDate === dateStr);
    setForm(existing ? toForm(existing) : emptyEntry(dateStr));
  };

  const shiftDate = (days) => {
    const date = new Date(form.activityDate + 'T12:00:00');
    date.setDate(date.getDate() + days);
    handleSelectDateForEdit(date.toLocaleDateString('sv-SE'));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            Longitudinal Lifestyle Monitoring
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Lifestyle Tracker
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Record and review daily observations about hydration, sleep, activity and food habits.
          </p>
        </div>

        {/* ─── Daily / Weekly / Monthly Tab Toggle ─────────────────────────────── */}
        <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveView('daily')}
            className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeView === 'daily'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Daily Log
          </button>
          <button
            type="button"
            onClick={() => setActiveView('weekly')}
            className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeView === 'weekly'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Weekly Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveView('monthly')}
            className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeView === 'monthly'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            Monthly Summary
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* DAILY LOG VIEW                                                       */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {activeView === 'daily' && (
        <>
          {historyError && <Alert variant="danger">{historyError} <Button size="sm" onClick={fetchRecent}>Retry</Button></Alert>}
          {success && (
            <Alert type="success" onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {error && (
            <Alert type="danger" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <div className="tracker-two-col grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Daily entry form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <fieldset disabled={historyLoading || !!historyError} className="m-0 min-w-0 border-0 p-0">
                <Card
                  title="Log Daily Habits"
                  subtitle="Track your key daily kidney-care metrics"
                  icon={Activity}
                >
                  <div className="space-y-5">
                    {/* Date selection (DD/MM/YYYY) */}
                    <div className="space-y-2">
                      <Input label="Journal date" name="activityDate" type="date" value={form.activityDate} max={todayStr}
                        onChange={(event) => handleSelectDateForEdit(event.target.value)} required />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => shiftDate(-1)}>Previous day</Button>
                        <Button size="sm" variant="secondary" disabled={form.activityDate >= todayStr} onClick={() => shiftDate(1)}>Next day</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleSelectDateForEdit(todayStr)}>Today</Button>
                      </div>
                    </div>

                    {/* Hydration with quick-add buttons */}
                    <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900">
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="waterIntakeLiters" className="text-sm font-semibold text-sky-950 dark:text-sky-200 flex items-center gap-1.5">
                          <Droplet className="w-4 h-4 text-sky-600" />
                          Water Intake (Liters)
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          step="0.25"
                          min="0"
                          max="15"
                          name="waterIntakeLiters"
                          value={form.waterIntakeLiters}
                          onChange={handleChange}
                          className="text-lg font-bold"
                        />
                        <div className="flex gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => adjustWater(0.25)}
                            className="text-sky-700 hover:bg-sky-100 dark:hover:bg-sky-900"
                            title="Add 250 ml glass"
                          >
                            +250 ml
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => adjustWater(0.5)}
                            className="text-sky-700 hover:bg-sky-100 dark:hover:bg-sky-900"
                            title="Add 500 ml bottle"
                          >
                            +500 ml
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Exercise & Sleep */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Input
                          label="Physical Activity (Minutes)"
                          type="number"
                          name="exerciseMinutes"
                          value={form.exerciseMinutes}
                          onChange={handleChange}
                          min="0"
                          helperText="Duration in minutes"
                        />
                        <Select
                          label="Activity Type"
                          name="exerciseType"
                          value={form.exerciseType}
                          onChange={handleChange}
                          options={[
                            missingOption,
                            { value: 'Walking', label: 'Walking / Brisk Walk' },
                            { value: 'Running', label: 'Running / Jogging' },
                            { value: 'Gym', label: 'Gym / Strength' },
                            { value: 'Yoga', label: 'Yoga / Stretching' },
                            { value: 'Cycling', label: 'Cycling' },
                            { value: 'Swimming', label: 'Swimming' },
                            { value: 'Other', label: 'Other Activity' },
                          ]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Input
                          label="Sleep Duration (Hours)"
                          type="number"
                          step="0.5"
                          name="sleepHours"
                          value={form.sleepHours}
                          onChange={handleChange}
                          min="0"
                          max="24"
                        />
                        <Select
                          label="Sleep Quality"
                          name="sleepQuality"
                          value={form.sleepQuality}
                          onChange={handleChange}
                          options={[
                            missingOption,
                            { value: 'Restful', label: 'Restful / Undisturbed' },
                            { value: 'Average', label: 'Average' },
                            { value: 'Interrupted', label: 'Interrupted / Broken' },
                            { value: 'Poor', label: 'Poor / Restless' },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Optional Blood Pressure */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                      <label className="text-sm font-semibold text-slate-900 dark:text-slate-100 block mb-2">
                        Blood Pressure Observation (Optional, mmHg)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Systolic BP (top number)"
                          type="number"
                          name="systolicBp"
                          value={form.systolicBp}
                          onChange={handleChange}
                          placeholder="e.g. 120"
                          min="40"
                          max="250"
                        />
                        <Input
                          label="Diastolic BP (bottom number)"
                          type="number"
                          name="diastolicBp"
                          value={form.diastolicBp}
                          onChange={handleChange}
                          placeholder="e.g. 80"
                          min="30"
                          max="150"
                        />
                      </div>
                    </div>

                    {/* Medication Adherence Observation */}
                    <div>
                      <Select
                        label="Medication Adherence Observation (Optional)"
                        name="medicationStatus"
                        value={form.medicationStatus}
                        onChange={handleChange}
                        options={[
                          { value: 'NOT_RECORDED', label: 'Not Recorded (Leave unstated)' },
                          { value: 'TAKEN_AS_PRESCRIBED', label: 'Taken as Prescribed' },
                          { value: 'MISSED', label: 'Missed Dose' },
                          { value: 'PARTIALLY_TAKEN', label: 'Partially Taken' },
                          { value: 'NOT_APPLICABLE', label: 'Not Applicable (No prescriptions)' },
                        ]}
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Self-report observation only. Missing status is never interpreted as missed medication.
                      </p>
                    </div>

                    {/* Diet, Salt, Sugar, Weight */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Select
                        label="Dietary Salt Level"
                        name="saltLevel"
                        value={form.saltLevel}
                        onChange={handleChange}
                        options={[
                          missingOption,
                          { value: 'Low', label: 'Low' },
                          { value: 'Medium', label: 'Medium' },
                          { value: 'High', label: 'High (salty meals)' },
                        ]}
                      />
                      <Input
                        label="Sugary Drinks / Sodas"
                        type="number"
                        name="sugaryDrinks"
                        value={form.sugaryDrinks}
                        onChange={handleChange}
                        min="0"
                        helperText="Cans / glasses"
                      />
                      <Input
                        label="Body Weight (kg)"
                        type="number"
                        step="0.1"
                        name="weightKg"
                        value={form.weightKg}
                        onChange={handleChange}
                        min="10"
                      />
                    </div>

                    {/* Lifestyle checkboxes */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { name: 'fastFood', label: 'Ate fast food today' },
                        { name: 'smoking', label: 'Smoked today' },
                        { name: 'alcohol', label: 'Consumed alcohol' },
                      ].map(({ name, label }) => (
                        <Select key={name} name={name} label={label} value={form[name]} onChange={handleChange}
                          options={[missingOption, { value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
                      ))}
                    </div>

                    {/* Stress Level */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        label="Stress Level"
                        name="stressLevel"
                        value={form.stressLevel}
                        onChange={handleChange}
                        options={[
                          missingOption,
                          { value: 'Low', label: 'Low / Relaxed' },
                          { value: 'Medium', label: 'Medium / Manageable' },
                          { value: 'High', label: 'High / Stressed' },
                        ]}
                      />
                    </div>

                    {/* Symptoms, Restrictions, and Journal Notes */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          User-Reported Health Observations & Symptoms (Optional)
                        </label>
                        <input
                          type="text"
                          name="symptoms"
                          value={form.symptoms}
                          onChange={handleChange}
                          placeholder="e.g. Mild headache, ankle swelling, fatigue"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Doctor-Provided Health Restrictions (Optional)
                        </label>
                        <input
                          type="text"
                          name="doctorRestrictions"
                          value={form.doctorRestrictions}
                          onChange={handleChange}
                          placeholder="e.g. Daily fluid limit 1500 ml, low potassium diet"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Personal Journal Notes (Private)
                        </label>
                        <textarea
                          name="personalNotes"
                          rows={2}
                          value={form.personalNotes}
                          onChange={handleChange}
                          placeholder="Reflections, dietary adjustments, or wellness notes..."
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button type="submit" size="lg" loading={loading} icon={Check}>
                      Save Activity Log
                    </Button>
                  </div>
                </Card>
                </fieldset>
              </form>
            </div>

            {/* Recent logs sidebar */}
            <div className="space-y-4">
              <Card title="Recent Logs" subtitle="Last recorded lifestyle entries" icon={Calendar}>
                {historyLoading ? (
                  <div className="py-8 text-center">
                    <Spinner size="sm" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    No previous entries recorded yet. Save your first daily log today!
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[460px] overflow-y-auto space-y-2 pt-1">
                    {history.slice(0, 10).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectDateForEdit(item.activityDate)}
                        className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors text-xs text-slate-600 dark:text-slate-400 space-y-1"
                        title="Click to edit this log"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-slate-100">
                          <span>{fmtDate(item.activityDate)}</span>
                          <span className="text-sky-600 dark:text-sky-400">{item.waterIntakeLiters != null ? `${item.waterIntakeLiters} L` : '—'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{item.exerciseMinutes != null ? `${item.exerciseMinutes}m` : '—'} • {item.sleepHours != null ? `${item.sleepHours}h` : '—'}</span>
                          {item.systolicBp && item.diastolicBp && (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">{item.systolicBp}/{item.diastolicBp}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Weekly & Monthly Summary Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('weekly')}
                  className="p-3 rounded-xl border border-teal-200 dark:border-teal-800/70 bg-teal-50/80 dark:bg-teal-950/30 text-left hover:border-teal-400 transition-colors"
                >
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-200 block">Weekly Summary</span>
                  <span className="text-[10px] text-teal-700 dark:text-teal-400">Averages & completion</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('monthly')}
                  className="p-3 rounded-xl border border-sky-200 dark:border-sky-800/70 bg-sky-50/80 dark:bg-sky-950/30 text-left hover:border-sky-400 transition-colors"
                >
                  <span className="text-xs font-bold text-sky-900 dark:text-sky-200 block">Monthly View</span>
                  <span className="text-[10px] text-sky-700 dark:text-sky-400">Calendar overview</span>
                </button>
              </div>

              {/* Quick Tip */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <span className="font-bold block text-teal-700 dark:text-teal-400">Educational Guidance:</span>
                <p className="leading-relaxed">
                  Lifestyle tracking supports behavioral habit awareness. Observations are not clinical diagnoses and do not calculate an unvalidated renal function score.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* WEEKLY SUMMARY VIEW                                                  */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {activeView === 'weekly' && (
        <div className="space-y-6">
          <AssistantAction question="Summarize my lifestyle this week">Ask AI about this week’s journal</AssistantAction>
          <Card
            title="Weekly Lifestyle Summary"
            subtitle="Descriptive weekly habit observations (averages calculated only over recorded days)"
            icon={Activity}
          >
            {summaryLoading ? (
              <div className="py-12 text-center">
                <Spinner size="md" />
              </div>
            ) : !summaryData ? (
              <p className="text-xs text-slate-500 py-6 text-center">No summary data available for this week.</p>
            ) : (
              <div className="space-y-6">
                {/* Completion Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 gap-3">
                  <div>
                    <span className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider block">
                      Journal Completion Rate
                    </span>
                    <span className="text-sm text-teal-800 dark:text-teal-300">
                      Logged {summaryData.recordedDays} of {summaryData.totalDaysInPeriod} days ({summaryData.journalCompletionRate}%)
                      {summaryData.missingJournalDays > 0 && ` • ${summaryData.missingJournalDays} missing days (not counted as zero)`}
                    </span>
                  </div>
                  <Badge variant={summaryData.journalCompletionRate >= 70 ? 'success' : 'warning'} size="lg">
                    {summaryData.journalCompletionRate}% Complete
                  </Badge>
                </div>

                {/* Key Observations Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Hydration */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                    <span className="text-xs text-slate-500 font-medium block">Average Water</span>
                    <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                      {summaryData.hydration?.averageLiters != null ? `${summaryData.hydration.averageLiters} L` : 'Not recorded'}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      {summaryData.hydration?.recordedCount ? `Based on ${summaryData.hydration.recordedCount} recorded days` : 'No entries'}
                    </span>
                  </div>

                  {/* Sleep */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                    <span className="text-xs text-slate-500 font-medium block">Average Sleep</span>
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {summaryData.sleep?.averageHours != null ? `${summaryData.sleep.averageHours} h` : 'Not recorded'}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      {summaryData.sleep?.recordedCount ? `Based on ${summaryData.sleep.recordedCount} recorded days` : 'No entries'}
                    </span>
                  </div>

                  {/* Physical Activity */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                    <span className="text-xs text-slate-500 font-medium block">Total Exercise</span>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {summaryData.physicalActivity?.totalMinutes != null ? `${summaryData.physicalActivity.totalMinutes} m` : '0 m'}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      {summaryData.physicalActivity?.averageMinutes ? `Avg ${summaryData.physicalActivity.averageMinutes} m/day` : 'No exercise logged'}
                    </span>
                  </div>

                  {/* Blood Pressure */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                    <span className="text-xs text-slate-500 font-medium block">Average BP</span>
                    <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                      {summaryData.bloodPressure?.averageSystolic ? `${Math.round(summaryData.bloodPressure.averageSystolic)}/${Math.round(summaryData.bloodPressure.averageDiastolic)}` : 'No readings'}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      {summaryData.bloodPressure?.readingsCount ? `${summaryData.bloodPressure.readingsCount} resting check(s)` : 'Optional check'}
                    </span>
                  </div>
                </div>

                {/* Medication Adherence & Symptoms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">Medication Adherence Counts</span>
                    {summaryData.medicationAdherenceCounts && Object.keys(summaryData.medicationAdherenceCounts).length > 0 ? (
                      <div className="space-y-1">
                        {Object.entries(summaryData.medicationAdherenceCounts).map(([status, count]) => (
                          <div key={status} className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>{status.replace(/_/g, ' ')}</span>
                            <span className="font-semibold">{count} day(s)</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400">No medication observations recorded this week.</p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">Recorded Symptoms</span>
                    {summaryData.recentSymptoms && summaryData.recentSymptoms.length > 0 ? (
                      <div className="space-y-1">
                        {summaryData.recentSymptoms.map((s, i) => (
                          <div key={i} className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>{fmtDate(s.date)}</span>
                            <span className="italic">{s.symptom}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400">No concerning symptoms reported this week.</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button variant="outline" onClick={() => setActiveView('daily')}>
                    Back to Daily Log
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* MONTHLY VIEW                                                         */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {activeView === 'monthly' && (
        <MonthlyTrackerView onSelectDateForEdit={handleSelectDateForEdit} />
      )}
    </div>
  );
};
