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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const LifestyleTrendChart = ({ data = [], height = 280 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <p className="text-sm font-medium">No lifestyle logs found for this timeframe.</p>
        <p className="text-xs text-slate-400 mt-1">Record your daily hydration, exercise, and sleep in the Daily Tracker.</p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => new Date(a.activityDate || a.date) - new Date(b.activityDate || b.date));
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
        label: 'Water Intake (L)',
        data: waterData,
        borderColor: '#0284c7', // Sky blue
        backgroundColor: '#0284c7',
        yAxisID: 'y',
        tension: 0.3,
      },
      {
        label: 'Sleep (Hours)',
        data: sleepData,
        borderColor: '#8b5cf6', // Violet
        backgroundColor: '#8b5cf6',
        yAxisID: 'y',
        tension: 0.3,
      },
      {
        label: 'Exercise (Minutes)',
        data: exerciseData,
        borderColor: '#10b981', // Emerald
        backgroundColor: '#10b981',
        yAxisID: 'y1',
        borderDash: [5, 5],
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          font: { size: 12 },
        },
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
          color: '#64748b',
          font: { size: 11 },
        },
        min: 0,
        grid: { color: '#f1f5f9' },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Exercise (Mins)',
          color: '#64748b',
          font: { size: 11 },
        },
        min: 0,
        grid: { drawOnChartArea: false },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
};
