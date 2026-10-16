import React, { useState, useEffect, useMemo } from 'react';
import { activityApi } from '../../api';
import { useTheme } from '../../context/ThemeContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Moon,
  Activity,
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Utensils,
  Cigarette,
  Wine,
  Sparkles,
  RefreshCw,
  Edit3,
  CalendarDays,
  Flame
} from 'lucide-react';
import { Card, Button, Badge, Spinner, Alert } from '../common';
import { MonthlyActivityChart } from '../charts/MonthlyActivityChart';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Convert ISO date string "YYYY-MM-DD" → "DD/MM/YYYY" for display */
const fmtDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export const MonthlyTrackerView = ({ onSelectDateForEdit }) => {
  const { isDark, isBrutalist } = useTheme();

  // Selected Month & Year (defaults to current date)
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-indexed (1..12)

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  // Compute days in the selected month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Compute first day of the week (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayOfWeek = useMemo(() => {
    return new Date(selectedYear, selectedMonth - 1, 1).getDay();
  }, [selectedYear, selectedMonth]);

  // Fetch activities for selected month
  const fetchMonthActivities = async () => {
    try {
      setLoading(true);
      setError('');

      const monthStr = String(selectedMonth).padStart(2, '0');
      const fromDate = `${selectedYear}-${monthStr}-01`;
      const toDate = `${selectedYear}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

      const data = await activityApi.getActivities(fromDate, toDate);
      const list = Array.isArray(data) ? data : [];
      setActivities(list);

      // Reset or maintain selected day detail
      if (selectedDayDetail) {
        const stillPresent = list.find((a) => a.activityDate === selectedDayDetail.activityDate);
        setSelectedDayDetail(stillPresent || null);
      }
    } catch (err) {
      console.error('Failed to fetch monthly activities:', err);
      setError('Unable to load lifestyle records for the selected month. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthActivities();
  }, [selectedYear, selectedMonth, daysInMonth]);

  // Map activities by day of month (1 .. daysInMonth) and date string
  const { recordsByDay, recordsByDate } = useMemo(() => {
    const byDay = {};
    const byDate = {};

    activities.forEach((item) => {
      if (!item.activityDate) return;
      byDate[item.activityDate] = item;
      const parts = item.activityDate.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        byDay[d] = item;
      }
    });

    return { recordsByDay: byDay, recordsByDate: byDate };
  }, [activities]);

  // --- KPI & Summary Calculations (Ignoring missing days, NEVER treating missing values as 0) ---
  const stats = useMemo(() => {
    const totalRecordedDays = activities.length;
    const adherenceRate = Math.round((totalRecordedDays / daysInMonth) * 100);

    // 1. Water Intake
    const waterItems = activities.filter(
      (a) => a.waterIntakeLiters != null && !isNaN(a.waterIntakeLiters) && Number(a.waterIntakeLiters) >= 0
    );
    const avgWater =
      waterItems.length > 0
        ? (waterItems.reduce((acc, a) => acc + Number(a.waterIntakeLiters), 0) / waterItems.length).toFixed(2)
        : null;

    // 2. Physical Activity (Exercise)
    const exerciseItems = activities.filter(
      (a) => a.exerciseMinutes != null && !isNaN(a.exerciseMinutes) && Number(a.exerciseMinutes) >= 0
    );
    const avgExercise =
      exerciseItems.length > 0
        ? Math.round(exerciseItems.reduce((acc, a) => acc + Number(a.exerciseMinutes), 0) / exerciseItems.length)
        : null;

    // 3. Sleep Duration
    const sleepItems = activities.filter(
      (a) => a.sleepHours != null && !isNaN(a.sleepHours) && Number(a.sleepHours) >= 0
    );
    const avgSleep =
      sleepItems.length > 0
        ? (sleepItems.reduce((acc, a) => acc + Number(a.sleepHours), 0) / sleepItems.length).toFixed(1)
        : null;

    // 4. Weight Trend (requires at least 2 records for trend calculation)
    const weightItems = activities
      .filter((a) => a.weightKg != null && !isNaN(a.weightKg) && Number(a.weightKg) > 0)
      .sort((a, b) => a.activityDate.localeCompare(b.activityDate));

    let weightTrend = null;
    let avgWeight = null;
    if (weightItems.length >= 2) {
      const startW = Number(weightItems[0].weightKg);
      const endW = Number(weightItems[weightItems.length - 1].weightKg);
      const diff = endW - startW;
      const sum = weightItems.reduce((acc, a) => acc + Number(a.weightKg), 0);
      avgWeight = (sum / weightItems.length).toFixed(1);
      weightTrend = {
        start: startW.toFixed(1),
        end: endW.toFixed(1),
        diff: diff.toFixed(1),
        direction: diff > 0 ? 'gain' : diff < 0 ? 'loss' : 'neutral',
        isRapidGain: diff >= 2.0, // Clinical note for CKD fluid retention
      };
    } else if (weightItems.length === 1) {
      const singleW = Number(weightItems[0].weightKg).toFixed(1);
      avgWeight = singleW;
      weightTrend = {
        start: singleW,
        end: singleW,
        diff: '0.0',
        direction: 'single',
        isRapidGain: false,
      };
    }

    // 5. Habits
    const fastFoodCount = activities.filter((a) => a.fastFood === true).length;
    const smokingCount = activities.filter((a) => a.smoking === true).length;
    const alcoholCount = activities.filter((a) => a.alcohol === true).length;

    const sugaryDrinksTotal = activities.reduce(
      (acc, a) => acc + (a.sugaryDrinks != null ? Number(a.sugaryDrinks) : 0),
      0
    );
    const avgSugaryDrinks =
      totalRecordedDays > 0 ? (sugaryDrinksTotal / totalRecordedDays).toFixed(1) : '0';

    // Salt distribution
    const saltCounts = { Low: 0, Medium: 0, High: 0 };
    activities.forEach((a) => {
      const s = a.saltLevel || 'Medium';
      if (saltCounts[s] !== undefined) saltCounts[s]++;
    });

    // Stress distribution
    const stressCounts = { Low: 0, Medium: 0, High: 0 };
    activities.forEach((a) => {
      const st = a.stressLevel || 'Low';
      if (stressCounts[st] !== undefined) stressCounts[st]++;
    });

    return {
      totalRecordedDays,
      adherenceRate,
      avgWater,
      avgExercise,
      avgSleep,
      weightTrend,
      avgWeight,
      fastFoodCount,
      smokingCount,
      alcoholCount,
      sugaryDrinksTotal,
      avgSugaryDrinks,
      saltCounts,
      stressCounts,
    };
  }, [activities, daysInMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  };

  const yearsRange = useMemo(() => {
    const cur = new Date().getFullYear();
    const arr = [];
    for (let y = cur - 3; y <= cur + 1; y++) {
      arr.push(y);
    }
    return arr;
  }, []);

  const currentMonthName = MONTH_NAMES[selectedMonth - 1];

  return (
    <div className="space-y-6">
      {/* Month & Year Navigation Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Month selection controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-teal-600 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-teal-600 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Month selector dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          {/* Year selector dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {yearsRange.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Current Month Quick Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleCurrentMonth}
            className="text-xs font-semibold"
          >
            Current Month
          </Button>
        </div>

        {/* Right: Active range status & refresh */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              {currentMonthName} {selectedYear}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {stats.totalRecordedDays} of {daysInMonth} days logged ({stats.adherenceRate}%)
            </span>
          </div>

          <button
            type="button"
            onClick={fetchMonthActivities}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-teal-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <Alert type="danger" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Monthly Key Metrics Cards (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Recorded Activity / Adherence */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Days Logged
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {stats.totalRecordedDays} <span className="text-sm font-semibold text-slate-400">/ {daysInMonth}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-teal-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, stats.adherenceRate)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              {stats.adherenceRate}% monthly logging adherence
            </p>
          </div>
        </div>

        {/* 2. Water Intake Average */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Daily Hydration
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-sky-700 dark:text-sky-400">
              {stats.avgWater !== null ? `${stats.avgWater} L` : '—'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Target: 2.0 – 2.5 L/day
            </p>
            <div className="mt-1">
              {stats.avgWater !== null ? (
                Number(stats.avgWater) >= 2.0 ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    Optimal Hydration
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                    Below Target
                  </span>
                )
              ) : (
                <span className="text-[10px] text-slate-400">No logs recorded</span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Physical Activity Average */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Daily Activity
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {stats.avgExercise !== null ? `${stats.avgExercise} min` : '—'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Target: ≥ 30 min/day
            </p>
            <div className="mt-1">
              {stats.avgExercise !== null ? (
                Number(stats.avgExercise) >= 30 ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    Active Lifestyle
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                    Light Activity
                  </span>
                )
              ) : (
                <span className="text-[10px] text-slate-400">No logs recorded</span>
              )}
            </div>
          </div>
        </div>

        {/* 4. Sleep Duration Average */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Sleep Duration
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-violet-700 dark:text-violet-400">
              {stats.avgSleep !== null ? `${stats.avgSleep} hrs` : '—'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Optimal: 7 – 9 hrs/night
            </p>
            <div className="mt-1">
              {stats.avgSleep !== null ? (
                Number(stats.avgSleep) >= 7.0 && Number(stats.avgSleep) <= 9.0 ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    Healthy Rest
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                    Irregular Rest
                  </span>
                )
              ) : (
                <span className="text-[10px] text-slate-400">No logs recorded</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Weight & Lifestyle Habits Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weight Trend Card */}
        <Card
          title="Monthly Weight Dynamics"
          subtitle="Monitors dry weight & fluid retention balance"
          icon={Scale}
        >
          {stats.weightTrend ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Initial vs Latest
                  </span>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {stats.weightTrend.start} kg → {stats.weightTrend.end} kg
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Net Variation
                  </span>
                  <div
                    className={`inline-flex items-center gap-1 text-sm font-extrabold ${
                      stats.weightTrend.isRapidGain
                        ? 'text-rose-600 dark:text-rose-400'
                        : stats.weightTrend.direction === 'gain'
                        ? 'text-amber-600 dark:text-amber-400'
                        : stats.weightTrend.direction === 'loss'
                        ? 'text-sky-600 dark:text-sky-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {stats.weightTrend.direction === 'gain' && <TrendingUp className="w-4 h-4" />}
                    {stats.weightTrend.direction === 'loss' && <TrendingDown className="w-4 h-4" />}
                    {stats.weightTrend.direction === 'neutral' && <Minus className="w-4 h-4" />}
                    {stats.weightTrend.direction === 'gain' ? `+${stats.weightTrend.diff}` : stats.weightTrend.diff} kg
                  </div>
                </div>
              </div>

              {stats.weightTrend.direction === 'single' ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Only 1 weight entry logged for {currentMonthName}. Record at least 2 entries across the month to unlock automated trend analytics.
                </p>
              ) : (
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p>
                    <strong className="text-slate-700 dark:text-slate-200">Average Weight:</strong>{' '}
                    {stats.avgWeight} kg
                  </p>
                  {stats.weightTrend.isRapidGain && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <span>
                        <strong>Fluid Alert:</strong> A rapid gain exceeding 2 kg within a month may indicate fluid accumulation. Consider monitoring edema and consulting your nephrologist.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
              <Scale className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No weight logs recorded for {currentMonthName} {selectedYear}.</p>
              <p className="text-[11px] mt-1 text-slate-400">
                Log body weight in daily entries to track fluid stability.
              </p>
            </div>
          )}
        </Card>

        {/* Habit Summaries Card (Dietary salt, Sugary drinks, Smoking, Alcohol) */}
        <div className="lg:col-span-2">
          <Card
            title="Monthly Habit Aggregations"
            subtitle="Accumulated lifestyle impact factors for the month"
            icon={Sparkles}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Habits breakdown pills */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Risk Factors Frequency
                </span>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Utensils className="w-3.5 h-3.5 text-amber-500" />
                      Fast Food Meals
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {stats.fastFoodCount} days{' '}
                      <span className="text-slate-400 text-[10px]">
                        ({stats.totalRecordedDays ? Math.round((stats.fastFoodCount / stats.totalRecordedDays) * 100) : 0}%)
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      Sugary Drinks / Sodas
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {stats.sugaryDrinksTotal} total{' '}
                      <span className="text-slate-400 text-[10px]">
                        (~{stats.avgSugaryDrinks}/day)
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Cigarette className="w-3.5 h-3.5 text-slate-500" />
                      Smoking Reported
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {stats.smokingCount} days
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Wine className="w-3.5 h-3.5 text-purple-500" />
                      Alcohol Consumed
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {stats.alcoholCount} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Salt & Stress Distributions */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Dietary Salt & Stress Levels
                </span>

                {/* Salt distribution bar */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-medium">
                    <span>Salt Intake Distribution</span>
                    <span className="text-[10px] text-slate-400">
                      {stats.totalRecordedDays} logged days
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
                      <span className="font-bold block">{stats.saltCounts.Low}</span>
                      <span className="text-[10px]">Low (&lt;2g)</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-900 text-sky-800 dark:text-sky-300">
                      <span className="font-bold block">{stats.saltCounts.Medium}</span>
                      <span className="text-[10px]">Medium</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300">
                      <span className="font-bold block">{stats.saltCounts.High}</span>
                      <span className="text-[10px]">High</span>
                    </div>
                  </div>
                </div>

                {/* Stress distribution bar */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-medium">
                    <span>Stress Level Distribution</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-300">
                      <span className="font-bold block">{stats.stressCounts.Low}</span>
                      <span className="text-[10px]">Relaxed</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
                      <span className="font-bold block">{stats.stressCounts.Medium}</span>
                      <span className="text-[10px]">Manageable</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900 text-purple-800 dark:text-purple-300">
                      <span className="font-bold block">{stats.stressCounts.High}</span>
                      <span className="text-[10px]">Elevated</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Monthly Interactive Chart */}
      <Card
        title={`Longitudinal Trends — ${currentMonthName} ${selectedYear}`}
        subtitle="Visual progression across days of the calendar month"
        icon={TrendingUp}
      >
        {loading ? (
          <div className="py-16 text-center">
            <Spinner size="md" />
            <p className="text-xs text-slate-400 mt-2">Loading monthly lifestyle data...</p>
          </div>
        ) : (
          <MonthlyActivityChart
            daysInMonth={daysInMonth}
            recordsByDay={recordsByDay}
            monthName={currentMonthName}
            year={selectedYear}
            height={320}
          />
        )}
      </Card>

      {/* Day-by-Day Interactive Calendar Overview */}
      <Card
        title={`Monthly Calendar Overview — ${currentMonthName} ${selectedYear}`}
        subtitle="Click any date to inspect details or edit that day's log"
        icon={CalendarIcon}
      >
        {loading ? (
          <div className="py-12 text-center">
            <Spinner size="sm" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800">
              {DAYS_OF_WEEK.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Empty offset days before firstDayOfWeek */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[64px] sm:min-h-[82px] rounded-xl bg-slate-50/40 dark:bg-slate-900/40 border border-transparent"
                />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const entry = recordsByDay[dayNum];
                const isToday =
                  today.getFullYear() === selectedYear &&
                  today.getMonth() + 1 === selectedMonth &&
                  today.getDate() === dayNum;
                const isSelected = selectedDayDetail?.activityDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      if (entry) {
                        setSelectedDayDetail(entry);
                      } else {
                        setSelectedDayDetail({
                          activityDate: dateStr,
                          isUnlogged: true,
                        });
                      }
                    }}
                    className={`min-h-[64px] sm:min-h-[82px] p-1.5 sm:p-2 rounded-xl text-left border transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? 'ring-2 ring-teal-500 border-teal-500 bg-teal-50/60 dark:bg-teal-950/50'
                        : entry
                        ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-teal-400 hover:shadow-xs'
                        : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-100 dark:border-slate-850 hover:bg-slate-100/60 text-slate-400'
                    }`}
                  >
                    {/* Top row: day number and indicator */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? 'w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[11px]'
                            : entry
                            ? 'text-slate-900 dark:text-slate-100'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {entry ? (
                        <span className="w-2 h-2 rounded-full bg-teal-500" title="Activity Logged" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                      )}
                    </div>

                    {/* Content snippet */}
                    {entry ? (
                      <div className="mt-1 space-y-0.5 text-[10px] sm:text-[11px]">
                        <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold truncate">
                          <Droplet className="w-3 h-3 shrink-0" />
                          <span>{entry.waterIntakeLiters || 0}L</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium truncate">
                          <Activity className="w-3 h-3 shrink-0" />
                          <span>{entry.exerciseMinutes || 0}m</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300 dark:text-slate-600 italic hidden sm:block">
                        No log
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Day Inspector / Drilldown */}
        {selectedDayDetail && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-teal-900 dark:text-teal-200">
                    Day Log Details: {fmtDate(selectedDayDetail.activityDate)}
                  </span>
                  {selectedDayDetail.isUnlogged ? (
                    <Badge variant="secondary">No Entry</Badge>
                  ) : (
                    <Badge variant="low">Recorded</Badge>
                  )}
                </div>

                {selectedDayDetail.isUnlogged ? (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    No activity was recorded on this date. Click the button to add a new daily log for {fmtDate(selectedDayDetail.activityDate)}.
                  </p>
                ) : (
                  <div className="flex items-center gap-4 flex-wrap text-xs text-slate-700 dark:text-slate-300 pt-1">
                    <span>
                      💧 <strong>Water:</strong> {selectedDayDetail.waterIntakeLiters || 0} L
                    </span>
                    <span>
                      🏃 <strong>Exercise:</strong> {selectedDayDetail.exerciseMinutes || 0} min
                    </span>
                    <span>
                      🌙 <strong>Sleep:</strong> {selectedDayDetail.sleepHours || 0} hrs
                    </span>
                    <span>
                      🧂 <strong>Salt:</strong> {selectedDayDetail.saltLevel || 'Medium'}
                    </span>
                    {selectedDayDetail.weightKg && (
                      <span>
                        ⚖️ <strong>Weight:</strong> {selectedDayDetail.weightKg} kg
                      </span>
                    )}
                    <span>
                      😌 <strong>Stress:</strong> {selectedDayDetail.stressLevel || 'Low'}
                    </span>
                  </div>
                )}
              </div>

              {/* Action: Switch to Daily Logging tab with this date preloaded */}
              <Button
                size="sm"
                icon={Edit3}
                onClick={() => onSelectDateForEdit?.(selectedDayDetail.activityDate)}
                className="shrink-0"
              >
                {selectedDayDetail.isUnlogged ? 'Log Activity for This Date' : 'Edit This Day\'s Log'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
