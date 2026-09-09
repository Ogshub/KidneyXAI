import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const LifestyleTrendChart = ({ data = [], height = 280 }) => {
  const { isDark } = useTheme();

  const gridColor = isDark ? 'rgba(51,65,85,0.35)' : 'rgba(226,232,240,0.8)';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const axisTitleColor = isDark ? '#94a3b8' : '#475569';

  if (!data || data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800"
        style={{ height }}
      >
        <p className="text-sm font-medium">No lifestyle logs found for this timeframe.</p>
        <p className="text-xs mt-1">
          Record your daily hydration, exercise, and sleep in the Daily Tracker.
        </p>
      </div>
    );
  }

  const sorted = [...data].sort(
    (a, b) => new Date(a.activityDate || a.date) - new Date(b.activityDate || b.date)
  );

  const labels = sorted.map((d) => {
    const raw = d.activityDate || d.date;
    return new Date(raw).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });

  const waterData = sorted.map((d) => d.waterIntakeLiters ?? d.waterIntakeGlasses ?? 0);
  const sleepData = sorted.map((d) => d.sleepHours ?? 0);
  const exerciseData = sorted.map((d) => d.exerciseMinutes ?? 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Water (L)',
        data: waterData,
        borderColor: '#0284c7',
        backgroundColor: '#0284c7',
        yAxisID: 'y',
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: 'Sleep (Hrs)',
        data: sleepData,
        borderColor: '#8b5cf6',
        backgroundColor: '#8b5cf6',
        yAxisID: 'y',
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: 'Exercise (Mins)',
        data: exerciseData,
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        yAxisID: 'y1',
        borderDash: [5, 5],
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11 },
          color: tickColor,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f1f5f9' : '#0f172a',
        bodyColor: isDark ? '#94a3b8' : '#475569',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Liters / Hours',
          color: axisTitleColor,
          font: { size: 11 },
        },
        min: 0,
        grid: { color: gridColor },
        border: { color: gridColor },
        ticks: { color: tickColor, font: { size: 11 } },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Exercise (Mins)',
          color: axisTitleColor,
          font: { size: 11 },
        },
        min: 0,
        grid: { drawOnChartArea: false },
        border: { display: false },
        ticks: { color: tickColor, font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: tickColor, font: { size: 11 } },
      },
    },
    animation: { duration: 600, easing: 'easeOutQuart' },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
};
