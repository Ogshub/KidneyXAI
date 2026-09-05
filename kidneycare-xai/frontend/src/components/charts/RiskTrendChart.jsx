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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const RiskTrendChart = ({ data = [], height = 260 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <p className="text-sm font-medium">No assessment history recorded yet.</p>
        <p className="text-xs text-slate-400 mt-1">Complete your first assessment to view longitudinal risk trends.</p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
  const labels = sorted.map((d) => {
    const raw = d.date || d.createdAt;
    return new Date(raw).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });

  const scores = sorted.map((d) => {
    // Risk score can be 0.0 - 1.0 or percentage 0 - 100
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
        backgroundColor: 'rgba(13, 148, 136, 0.1)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: scores.map((s) => (s >= 70 ? '#e11d48' : s >= 40 ? '#f59e0b' : '#10b981')),
        pointBorderColor: '#ffffff',
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
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `Risk Index: ${context.parsed.y}%`,
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
        },
        grid: {
          color: '#f1f5f9',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
};
