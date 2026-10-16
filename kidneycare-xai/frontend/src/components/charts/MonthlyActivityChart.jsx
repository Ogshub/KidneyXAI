import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';
import { Droplet, Moon, Activity, Scale, Eye } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const MonthlyActivityChart = ({
  daysInMonth = 31,
  recordsByDay = {},
  monthName = 'Month',
  year = 2026,
  height = 300,
}) => {
  const { isDark, isBrutalist } = useTheme();
  const [metricTab, setMetricTab] = useState('lifestyle'); // 'lifestyle' | 'weight'

  const gridColor = isDark ? 'rgba(51,65,85,0.35)' : 'rgba(226,232,240,0.8)';
  const tickColor = isDark ? '#94a3b8' : '#64748b';

  // Construct continuous labels for all days of the month (1 .. daysInMonth)
  const labels = [];
  const waterData = [];
  const sleepData = [];
  const exerciseData = [];
  const weightData = [];

  let hasWeightLogs = false;
  let hasAnyLogs = false;

  for (let day = 1; day <= daysInMonth; day++) {
    labels.push(`${day}`);
    const rec = recordsByDay[day];
    if (rec) {
      hasAnyLogs = true;
      waterData.push(rec.waterIntakeLiters != null ? Number(rec.waterIntakeLiters) : null);
      sleepData.push(rec.sleepHours != null ? Number(rec.sleepHours) : null);
      exerciseData.push(rec.exerciseMinutes != null ? Number(rec.exerciseMinutes) : null);
      if (rec.weightKg != null && Number(rec.weightKg) > 0) {
        weightData.push(Number(rec.weightKg));
        hasWeightLogs = true;
      } else {
        weightData.push(null);
      }
    } else {
      waterData.push(null);
      sleepData.push(null);
      exerciseData.push(null);
      weightData.push(null);
    }
  }

  if (!hasAnyLogs) {
    return (
      <div
        className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center"
        style={{ minHeight: height }}
      >
        <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          No daily records found for {monthName} {year}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
          Log hydration, sleep, exercise, or weight in the Daily Log to view your longitudinal monthly trends.
        </p>
      </div>
    );
  }

  // --- Lifestyle chart data ---
  const lifestyleChartData = {
    labels,
    datasets: [
      {
        label: 'Water Intake (L)',
        data: waterData,
        borderColor: '#0284c7', // Sky blue
        backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : 'rgba(2, 132, 199, 0.08)',
        fill: true,
        yAxisID: 'yWater',
        tension: 0.35,
        spanGaps: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: 'Sleep (Hours)',
        data: sleepData,
        borderColor: '#8b5cf6', // Violet
        backgroundColor: '#8b5cf6',
        yAxisID: 'ySleep',
        tension: 0.35,
        spanGaps: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: 'Exercise (Minutes)',
        data: exerciseData,
        borderColor: '#10b981', // Emerald
        backgroundColor: '#10b981',
        yAxisID: 'yExercise',
        borderDash: [5, 5],
        tension: 0.35,
        spanGaps: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };

  const lifestyleOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          color: tickColor,
          font: { size: 11, weight: '600' },
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        callbacks: {
          title: (items) => `${monthName} ${items[0].label}, ${year}`,
          label: (context) => {
            if (context.raw === null || context.raw === undefined) return null;
            if (context.dataset.label.includes('Water')) return ` Water: ${context.raw} L`;
            if (context.dataset.label.includes('Sleep')) return ` Sleep: ${context.raw} hrs`;
            if (context.dataset.label.includes('Exercise')) return ` Exercise: ${context.raw} mins`;
            return ` ${context.dataset.label}: ${context.raw}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          font: { size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 16,
        },
        title: {
          display: true,
          text: `Day of Month (${monthName})`,
          color: tickColor,
          font: { size: 10, weight: '600' },
        },
      },
      yWater: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: gridColor },
        ticks: { color: '#0284c7', font: { size: 10 } },
        min: 0,
        title: {
          display: true,
          text: 'Water (L) / Sleep (h)',
          color: tickColor,
          font: { size: 10 },
        },
      },
      ySleep: {
        type: 'linear',
        display: false,
        position: 'left',
        min: 0,
        max: 16,
      },
      yExercise: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: '#10b981', font: { size: 10 } },
        min: 0,
        title: {
          display: true,
          text: 'Exercise (mins)',
          color: tickColor,
          font: { size: 10 },
        },
      },
    },
  };

  // --- Weight chart data ---
  const validWeights = weightData.filter((w) => w !== null);
  const minW = validWeights.length ? Math.floor(Math.min(...validWeights) - 2) : 50;
  const maxW = validWeights.length ? Math.ceil(Math.max(...validWeights) + 2) : 80;

  const weightChartData = {
    labels,
    datasets: [
      {
        label: 'Weight (kg)',
        data: weightData,
        borderColor: '#f59e0b', // Amber
        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)',
        fill: true,
        tension: 0.3,
        spanGaps: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2.5,
      },
    ],
  };

  const weightOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          color: tickColor,
          font: { size: 11, weight: '600' },
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: (items) => `${monthName} ${items[0].label}, ${year}`,
          label: (context) => (context.raw !== null ? ` Weight: ${context.raw} kg` : null),
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { size: 10 } },
        title: {
          display: true,
          text: `Day of Month (${monthName})`,
          color: tickColor,
          font: { size: 10, weight: '600' },
        },
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { size: 10 } },
        min: minW > 0 ? minW : 0,
        max: maxW,
        title: {
          display: true,
          text: 'Body Weight (kg)',
          color: tickColor,
          font: { size: 10 },
        },
      },
    },
  };

  return (
    <div className="space-y-3">
      {/* Chart View Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Chronological Monthly View • {monthName} {year}
        </span>
        <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setMetricTab('lifestyle')}
            className={`px-3 py-1 font-semibold rounded-md transition-colors ${
              metricTab === 'lifestyle'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Hydration, Sleep & Activity
          </button>
          <button
            type="button"
            onClick={() => setMetricTab('weight')}
            className={`px-3 py-1 font-semibold rounded-md transition-colors ${
              metricTab === 'weight'
                ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Weight Progression {hasWeightLogs && '•'}
          </button>
        </div>
      </div>

      <div style={{ height }}>
        {metricTab === 'lifestyle' ? (
          <Line data={lifestyleChartData} options={lifestyleOptions} />
        ) : hasWeightLogs ? (
          <Line data={weightChartData} options={weightOptions} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Scale className="w-8 h-8 text-amber-400 mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No weight data logged in {monthName} {year}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Record your body weight in the Daily Tracker to track fluid retention and dry weight changes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
