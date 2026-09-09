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
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export const RiskTrendChart = ({ data = [], height = 260 }) => {
  const { isDark } = useTheme();

  const gridColor = isDark ? 'rgba(51,65,85,0.35)' : 'rgba(226,232,240,0.8)';
  const tickColor = isDark ? '#94a3b8' : '#64748b';

  if (!data || data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800"
        style={{ height }}
      >
        <p className="text-sm font-medium">No assessment history recorded yet.</p>
        <p className="text-xs mt-1">Complete your first assessment to view longitudinal risk trends.</p>
      </div>
    );
  }

  const sorted = [...data].sort(
    (a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)
  );

  const labels = sorted.map((d) => {
    const raw = d.date || d.createdAt;
    return new Date(raw).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });

  const scores = sorted.map((d) => {
    const raw = d.riskScore ?? d.risk_score ?? 0;
    return raw > 1 ? raw : Math.round(raw * 100);
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Kidney Risk Index (%)',
        data: scores,
        borderColor: '#0d9488',
        backgroundColor: isDark ? 'rgba(13, 148, 136, 0.15)' : 'rgba(13, 148, 136, 0.08)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: scores.map((s) =>
          s >= 70 ? '#e11d48' : s >= 40 ? '#f59e0b' : '#10b981'
        ),
        pointBorderColor: isDark ? '#1e293b' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f1f5f9' : '#0f172a',
        bodyColor: isDark ? '#94a3b8' : '#475569',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (context) => ` Risk Index: ${context.parsed.y}%`,
          afterLabel: (context) => {
            const v = context.parsed.y;
            return v >= 70 ? ' ⚠ HIGH RISK' : v >= 40 ? ' ● MODERATE' : ' ✓ LOW RISK';
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          callback: (value) => `${value}%`,
          color: tickColor,
          font: { size: 11 },
        },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: tickColor,
          font: { size: 11 },
        },
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
