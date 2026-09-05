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

export const ShapBarChart = ({ features = [], height = 320 }) => {
  if (!features || features.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <p className="text-sm font-medium">No SHAP explanation features available.</p>
      </div>
    );
  }

  // Sort features by absolute SHAP magnitude descending, take top 10
  const sorted = [...features]
    .sort((a, b) => Math.abs(b.shapValue ?? b.shap_value ?? 0) - Math.abs(a.shapValue ?? a.shap_value ?? 0))
    .slice(0, 10);

  const featureLabels = {
    serum_creatinine: 'Serum Creatinine',
    blood_urea: 'Blood Urea',
    hemoglobin: 'Hemoglobin',
    packed_cell_volume: 'Packed Cell Volume',
    specific_gravity: 'Specific Gravity',
    albumin: 'Albumin',
    blood_glucose_random: 'Random Blood Glucose',
    blood_pressure: 'Blood Pressure',
    sugar: 'Urine Sugar',
    red_blood_cell_count: 'RBC Count',
    white_blood_cell_count: 'WBC Count',
    hypertension: 'Hypertension',
    diabetes_mellitus: 'Diabetes Mellitus',
    age: 'Age',
  };

  const labels = sorted.map((f) => {
    const rawName = f.featureName || f.feature || '';
    const cleanName = featureLabels[rawName] || rawName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const val = f.featureValue !== undefined && f.featureValue !== null ? ` (${f.featureValue})` : '';
    return `${cleanName}${val}`;
  });

  const values = sorted.map((f) => Number(f.shapValue ?? f.shap_value ?? 0));

  const backgroundColors = values.map((val) =>
    val >= 0 ? 'rgba(239, 68, 68, 0.85)' : 'rgba(16, 185, 129, 0.85)'
  );
  const borderColors = values.map((val) =>
    val >= 0 ? '#dc2626' : '#059669'
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: 'SHAP Value (Impact on Risk)',
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
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
          label: (context) => {
            const val = context.raw;
            const direction = val >= 0 ? 'Increases estimated risk' : 'Protective / Lowers estimated risk';
            return ` SHAP: ${val > 0 ? '+' : ''}${val.toFixed(4)} (${direction})`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#f1f5f9' },
        title: {
          display: true,
          text: '← Decreases Risk  |  Increases Risk →',
          color: '#64748b',
          font: { size: 11, weight: '500' },
        },
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
    },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span className="flex items-center gap-1.5 font-medium text-emerald-700">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
          Green: Lowers Risk Contribution
        </span>
        <span className="flex items-center gap-1.5 font-medium text-rose-700">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
          Red: Increases Risk Contribution
        </span>
      </div>
      <div style={{ height }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};
