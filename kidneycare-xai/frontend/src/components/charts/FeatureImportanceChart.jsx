import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const FeatureImportanceChart = ({ features = [], height = 300 }) => {
  // If no features provided, use the global importance rankings established in the model
  const defaultImportance = [
    { feature: 'Serum Creatinine', importance: 0.28 },
    { feature: 'Hemoglobin', importance: 0.19 },
    { feature: 'Blood Urea', importance: 0.15 },
    { feature: 'Specific Gravity', importance: 0.12 },
    { feature: 'Albumin', importance: 0.10 },
    { feature: 'Blood Glucose', importance: 0.07 },
    { feature: 'Blood Pressure', importance: 0.05 },
    { feature: 'Age', importance: 0.04 },
  ];

  const items = features.length > 0 ? features : defaultImportance;

  const chartData = {
    labels: items.map((i) => i.feature || i.featureName),
    datasets: [
      {
        label: 'Global Mean |SHAP| Value',
        data: items.map((i) => (i.importance ?? i.meanShap ?? 0) * 100),
        backgroundColor: 'rgba(13, 148, 136, 0.8)',
        borderColor: '#0d9488',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` Relative Importance: ${context.parsed.x.toFixed(1)}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#f1f5f9' },
        ticks: { callback: (v) => `${v}%` },
      },
      y: {
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};
