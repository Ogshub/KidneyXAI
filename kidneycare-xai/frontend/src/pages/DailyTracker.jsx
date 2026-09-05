import React, { useState, useEffect } from 'react';
import { activityApi } from '../api';
import { 
  Activity, 
  Droplet, 
  Moon, 
  Flame, 
  Scale, 
  Sparkles, 
  Calendar, 
  Check, 
  Plus, 
  Minus,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import { Card, Button, Input, Select, Alert, Spinner, Badge } from '../components/common';

export const DailyTracker = () => {
  const todayStr = new Date().toISOString().split('T')[0];

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

  const fetchRecent = async () => {
    try {
      setHistoryLoading(true);
      const data = await activityApi.getActivities();
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load activity history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

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
      setSuccess(`Lifestyle activity for ${form.activityDate} recorded successfully!`);
      fetchRecent();
    } catch (err) {
      console.error('Failed to log activity:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save daily lifestyle log.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">
          <Activity className="w-4 h-4" />
          Longitudinal Lifestyle Monitoring
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Daily Lifestyle Tracker
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Record your hydration, sleep, exercise, and diet habits to maintain high renal wellness.
        </p>
      </div>

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
        {/* Tracker Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card title="Log Today's Habits" subtitle="Track your key daily kidney-care metrics" icon={Activity}>
              <div className="space-y-5">
                {/* Date selection */}
                <div>
                  <Input
                    label="Log Date"
                    type="date"
                    name="activityDate"
                    value={form.activityDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Hydration with Quick Buttons */}
                <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-sky-950 flex items-center gap-1.5">
                      <Droplet className="w-4 h-4 text-sky-600" />
                      Water Intake (Liters)
                    </label>
                    <span className="text-xs text-sky-700 font-medium">Daily Target: 2.5 L</span>
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
                        className="text-sky-700 hover:bg-sky-100"
                        title="Add 250ml glass"
                      >
                        +250 ml
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustWater(0.5)}
                        className="text-sky-700 hover:bg-sky-100"
                        title="Add 500ml bottle"
                      >
                        +500 ml
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Exercise and Sleep */}
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

                {/* Diet and Salt */}
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

                {/* Checkbox lifestyle factors */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="fastFood"
                      checked={form.fastFood}
                      onChange={handleChange}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs font-medium text-slate-700">Ate fast food today</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="smoking"
                      checked={form.smoking}
                      onChange={handleChange}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs font-medium text-slate-700">Smoked today</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="alcohol"
                      checked={form.alcohol}
                      onChange={handleChange}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs font-medium text-slate-700">Consumed alcohol</span>
                  </label>
                </div>

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

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
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
              <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto space-y-3 pt-1">
                {history.slice(0, 7).map((item) => (
                  <div key={item.id} className="pt-2 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{item.activityDate}</span>
                      <span className="text-sky-600">{item.waterIntakeLiters || 0} L</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{item.exerciseMinutes || 0}m exercise • {item.sleepHours || 0}h sleep</span>
                      <span>{item.weightKg ? `${item.weightKg} kg` : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Tip */}
          <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200/70 text-xs text-teal-900 space-y-1">
            <span className="font-bold block">Renal Hydration Rule:</span>
            <p className="leading-relaxed">
              Consistently reaching 2.0–2.5 L of water per day supports optimal glomerular filtration and reduces kidney stone recurrence risk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
