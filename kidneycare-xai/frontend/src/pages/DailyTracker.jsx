import React, { useState, useEffect, useCallback } from 'react';
import { activityApi } from '../api';
import {
  Activity,
  Droplet,
  Moon,
  Scale,
  Calendar,
  Check,
  CalendarDays,
  CalendarRange,
} from 'lucide-react';
import { Card, Button, Input, Select, Alert, Spinner, Badge, DatePickerInput } from '../components/common';
import { MonthlyTrackerView } from '../components/tracker/MonthlyTrackerView';

/** Convert ISO date string "YYYY-MM-DD" → "DD/MM/YYYY" for display */
const fmtDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export const DailyTracker = () => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // ─── View: 'daily' | 'monthly' ─────────────────────────────────────────────
  const [activeView, setActiveView] = useState('daily');

  // ─── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    activityDate: todayStr,
    waterIntakeLiters: '2.0',
    exerciseMinutes: '30',
    sleepHours: '7.5',
    saltLevel: 'Medium',
    fastFood: false,
    sugaryDrinks: '0',
    smoking: false,
    alcohol: false,
    weightKg: '68.0',
    stressLevel: 'Low',
  });

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchRecent = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const data = await activityApi.getActivities();
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load activity history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

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
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        activityDate: form.activityDate,
        waterIntakeLiters: parseFloat(form.waterIntakeLiters) || 0,
        exerciseMinutes: parseInt(form.exerciseMinutes, 10) || 0,
        sleepHours: parseFloat(form.sleepHours) || 0,
        saltLevel: form.saltLevel,
        fastFood: Boolean(form.fastFood),
        sugaryDrinks: parseInt(form.sugaryDrinks, 10) || 0,
        smoking: Boolean(form.smoking),
        alcohol: Boolean(form.alcohol),
        weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
        stressLevel: form.stressLevel,
      };

      await activityApi.logActivity(payload);
      setSuccess(`Lifestyle activity for ${fmtDate(form.activityDate)} recorded successfully!`);
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

  /**
   * Called from MonthlyTrackerView calendar when user clicks a day.
   * Switches to Daily tab and pre-fills the date in the form.
   */
  const handleSelectDateForEdit = (dateStr) => {
    setActiveView('daily');
    setForm((prev) => ({ ...prev, activityDate: dateStr }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            Record and review your hydration, sleep, exercise, and diet habits to maintain renal wellness.
          </p>
        </div>

        {/* ─── Daily / Monthly Tab Toggle ─────────────────────────────── */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveView('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
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
            onClick={() => setActiveView('monthly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Daily entry form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Card
                  title="Log Daily Habits"
                  subtitle="Track your key daily kidney-care metrics"
                  icon={Activity}
                >
                  <div className="space-y-5">
                    {/* Date selection (DD/MM/YYYY) */}
                    <div>
                      <DatePickerInput
                        label="Log Date"
                        name="activityDate"
                        value={form.activityDate}
                        onChange={handleChange}
                        required
                        helperText="Format: Day (DD) / Month (MM) / Year (YYYY)"
                      />
                    </div>

                    {/* Hydration with quick-add buttons */}
                    <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-sky-950 dark:text-sky-200 flex items-center gap-1.5">
                          <Droplet className="w-4 h-4 text-sky-600" />
                          Water Intake (Liters)
                        </label>
                        <span className="text-xs text-sky-700 dark:text-sky-400 font-medium">Daily Target: 2.5 L</span>
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
                          required
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
                      <Input
                        label="Physical Activity (Minutes)"
                        type="number"
                        name="exerciseMinutes"
                        value={form.exerciseMinutes}
                        onChange={handleChange}
                        min="0"
                        helperText="Brisk walk, cardio, gym"
                      />
                      <Input
                        label="Sleep Duration (Hours)"
                        type="number"
                        step="0.5"
                        name="sleepHours"
                        value={form.sleepHours}
                        onChange={handleChange}
                        min="0"
                        max="24"
                        helperText="Optimal: 7 – 9 hours"
                      />
                    </div>

                    {/* Diet, Salt, Sugar, Weight */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Select
                        label="Dietary Salt Level"
                        name="saltLevel"
                        value={form.saltLevel}
                        onChange={handleChange}
                        options={[
                          { value: 'Low', label: 'Low (< 2g/day)' },
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
                        helperText="For fluid balance"
                      />
                    </div>

                    {/* Lifestyle checkboxes */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { name: 'fastFood', label: 'Ate fast food today' },
                        { name: 'smoking', label: 'Smoked today' },
                        { name: 'alcohol', label: 'Consumed alcohol' },
                      ].map(({ name, label }) => (
                        <label
                          key={name}
                          className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            name={name}
                            checked={form[name]}
                            onChange={handleChange}
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
                        </label>
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
                          { value: 'Low', label: 'Low / Relaxed' },
                          { value: 'Medium', label: 'Medium / Manageable' },
                          { value: 'High', label: 'High / Stressed' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button type="submit" size="lg" loading={loading} icon={Check}>
                      Save Activity Log
                    </Button>
                  </div>
                </Card>
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
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[460px] overflow-y-auto space-y-3 pt-1">
                    {history.slice(0, 7).map((item) => (
                      <div key={item.id} className="pt-2 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-slate-100">
                          <span>{fmtDate(item.activityDate)}</span>
                          <span className="text-sky-600 dark:text-sky-400">{item.waterIntakeLiters || 0} L</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{item.exerciseMinutes || 0}m exercise • {item.sleepHours || 0}h sleep</span>
                          <span>{item.weightKg ? `${item.weightKg} kg` : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Monthly Summary Quick Link */}
              <button
                type="button"
                onClick={() => setActiveView('monthly')}
                className="w-full p-4 rounded-2xl border border-teal-200 dark:border-teal-800/70 bg-teal-50/80 dark:bg-teal-950/30 text-left group hover:border-teal-400 dark:hover:border-teal-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <CalendarRange className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-teal-900 dark:text-teal-200 block">
                      View Monthly Summary
                    </span>
                    <span className="text-xs text-teal-700 dark:text-teal-400">
                      Trends, averages & calendar overview
                    </span>
                  </div>
                </div>
              </button>

              {/* Quick Tip */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <span className="font-bold block text-teal-700 dark:text-teal-400">Renal Hydration Rule:</span>
                <p className="leading-relaxed">
                  Consistently reaching 2.0–2.5 L of water per day supports optimal glomerular filtration and reduces kidney stone recurrence risk.
                </p>
              </div>
            </div>
          </div>
        </>
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
