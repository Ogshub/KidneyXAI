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
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FEATURE_LABELS = {
  serum_creatinine: 'Serum Creatinine',
  blood_urea: 'Blood Urea',
  hemoglobin: 'Hemoglobin',
  packed_cell_volume: 'Packed Cell Vol.',
  specific_gravity: 'Specific Gravity',
  albumin: 'Albumin (Proteinuria)',
  blood_glucose_random: 'Random Blood Glucose',
  blood_pressure: 'Blood Pressure',
  sugar: 'Urine Sugar',
  red_blood_cell_count: 'RBC Count',
  white_blood_cell_count: 'WBC Count',
  red_blood_cells: 'Red Blood Cells',
  pus_cell: 'Pus Cells',
  pus_cell_clumps: 'Pus Cell Clumps',
  bacteria: 'Bacteria',
  sodium: 'Serum Sodium',
  potassium: 'Serum Potassium',
  hypertension: 'Hypertension',
  diabetes_mellitus: 'Diabetes Mellitus',
  coronary_artery_disease: 'Coronary Artery Disease',
  appetite: 'Appetite',
  pedal_edema: 'Pedal Edema',
  anemia: 'Anemia',
  age: 'Age',
};

export const ShapBarChart = ({ features = [], height = 320 }) => {
  const { isDark } = useTheme();

  if (!features || features.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800" style={{ height }}>
        <p className="text-sm font-medium">No SHAP explanation features available.</p>
        <p className="text-xs mt-1">Complete an assessment to see feature attributions.</p>
      </div>
    );
  }

  // Sort by absolute SHAP magnitude descending, take top 10
  const sorted = [...features]
    .sort((a, b) =>
      Math.abs(b.shapValue ?? b.shap_value ?? 0) -
      Math.abs(a.shapValue ?? a.shap_value ?? 0)
    )
    .slice(0, 10);

  const labels = sorted.map((f) => {
    const rawName = f.featureName || f.feature || '';
    const cleanName =
      FEATURE_LABELS[rawName] ||
      rawName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const val =
      f.featureValue !== undefined && f.featureValue !== null && f.featureValue !== 0
        ? ` (${typeof f.featureValue === 'number' ? f.featureValue.toFixed(1) : f.featureValue})`
        : '';
    return `${cleanName}${val}`;
  });

  const values = sorted.map((f) => Number(f.shapValue ?? f.shap_value ?? 0));

  const gridColor = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(226,232,240,0.8)';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const axisTitleColor = isDark ? '#94a3b8' : '#475569';

  const backgroundColors = values.map((val) =>
    val >= 0 ? 'rgba(239, 68, 68, 0.82)' : 'rgba(16, 185, 129, 0.82)'
  );
  const borderColors = values.map((val) => (val >= 0 ? '#dc2626' : '#059669'));

  const chartData = {
    labels,
    datasets: [
      {
        label: 'SHAP Value (Impact on Risk)',
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: 5,
        borderSkipped: false,
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
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f1f5f9' : '#0f172a',
        bodyColor: isDark ? '#94a3b8' : '#475569',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (context) => {
            const val = context.raw;
            const direction =
              val >= 0 ? '↑ Increases estimated risk' : '↓ Protective / Lowers risk';
            return ` SHAP: ${val > 0 ? '+' : ''}${val.toFixed(4)}  ${direction}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        border: { color: gridColor },
        ticks: { color: tickColor, font: { size: 11 } },
        title: {
          display: true,
          text: '← Decreases Risk  |  Increases Risk →',
          color: axisTitleColor,
          font: { size: 11, weight: '500' },
        },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: tickColor,
          font: { size: 11 },
          padding: 4,
        },
      },
    },
    animation: {
      duration: 600,
      easing: 'easeOutQuart',
    },
  };

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
          Lowers Risk (Protective)
        </span>
        <span className="flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
          Increases Risk
        </span>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};
