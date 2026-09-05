# Step 25: Frontend — Data Visualizations & Chart.js Explainability Suite

## 1. Overview & Objective
In this step, we implement the interactive data visualizations in `frontend/src/components/charts/`:
1. `ShapBarChart.jsx`: Horizontal divergence bar chart plotting local SHAP attribution scores ($\phi_i$). Red bars ($\phi_i > 0$) denote risk-increasing biomarkers (e.g. elevated Creatinine), and Green bars ($\phi_i < 0$) denote protective biomarkers (e.g. high Hemoglobin).
2. `FeatureImportanceChart.jsx`: Global feature ranking chart displaying the overall population-level impact of clinical indicators.
3. `RiskTrendChart.jsx`: Smooth spline area chart tracking a patient's longitudinal risk score trajectory over time with color-coded high, moderate, and low points.
4. `LifestyleTrendChart.jsx`: Multi-axis 7-day progression chart overlaying water consumption (liters) and daily exercise (minutes).
5. `index.js`: Re-export barrel.

---

## 2. Prerequisites
- Completed `21_FRONTEND_VITE_SETUP_AND_TAILWIND_DESIGN_SYSTEM.md` (`chart.js` and `react-chartjs-2` installed)

---

## 3. Why This Is Created Now
1. **Explainable AI (XAI) Comprehensibility**: Raw SHAP numbers (e.g. `+0.2148`) are confusing to patients. Transforming them into a clear horizontal diverging bar chart where red extends right (increases risk) and green extends left (protective) makes complex mathematical explanations immediately understandable.
2. **Longitudinal Progress Tracking**: Chronic kidney diseases develop over years. Visualizing the trajectory of risk scores and lifestyle habits empowers users to see whether lifestyle modifications are driving positive clinical trends.

---

## 4. Key Chart Implementations

### 4.1 `ShapBarChart.jsx`
Path: `frontend/src/components/charts/ShapBarChart.jsx`
```jsx
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
            return val >= 0
              ? `+${val.toFixed(4)} (Increases Risk)`
              : `${val.toFixed(4)} (Protective / Decreases Risk)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#f1f5f9' },
        title: {
          display: true,
          text: '← Decreases Risk (Protective) | Increases Risk →',
          color: '#64748b',
          font: { size: 11, weight: 'bold' },
        },
      },
      y: { grid: { display: false } },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};
```

---

### 4.2 `RiskTrendChart.jsx`
Path: `frontend/src/components/charts/RiskTrendChart.jsx`
```jsx
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

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
        pointBackgroundColor: scores.map((s) => (s >= 60 ? '#e11d48' : s >= 30 ? '#f59e0b' : '#10b981')),
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
      legend: { display: false },
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
        ticks: { stepSize: 20, callback: (v) => `${v}%` },
        grid: { color: '#f1f5f9' },
      },
      x: { grid: { display: false } },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
};
```

---

## 5. Verification
Verify chart component syntax:
```powershell
cd kidneycare-xai/frontend
npm run lint
```

---

## 6. Next Step Dependency
Proceed to **`26_FRONTEND_AUTH_PAGES_LANDING_LOGIN_REGISTER.md`** to implement the public user acquisition and onboarding pages: `Landing.jsx`, `Login.jsx`, and `Register.jsx`.
