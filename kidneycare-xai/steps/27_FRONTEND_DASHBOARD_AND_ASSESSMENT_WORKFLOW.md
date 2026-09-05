# Step 27: Frontend — Core Clinical Workflow (Dashboard, Assessment & SHAP Results)

## 1. Overview & Objective
In this step, we implement the primary clinical decision support screens in `frontend/src/pages/`:
1. `Dashboard.jsx`: Central patient cockpit displaying current risk score indicator, 7-day lifestyle progress score ($0–100$), today's habit quick tracker, top 5 local SHAP contributors, longitudinal risk chart, and expandable recommendation drawers with clinical trigger rationales.
2. `Assessment.jsx`: Interactive clinical intake form accepting all 24 laboratory and physiological parameters grouped into Demographic/Vitals, Blood Chemistry, Urinalysis, and Clinical History tabs, equipped with "Load Healthy Sample" and "Load High-Risk Sample" one-click test presets.
3. `AssessmentResult.jsx`: Comprehensive Explainable AI result screen rendering the final risk gauge, binary classification (`ckd` vs `notckd`), model version badge, horizontal diverging `ShapBarChart`, and priority-sorted actionable recommendation cards.

---

## 2. Prerequisites
- Completed `22_FRONTEND_API_CLIENT_AND_AUTH_CONTEXT.md` (`assessmentApi`, `dashboardApi`)
- Completed `23_FRONTEND_COMMON_UI_COMPONENTS.md` (`Card`, `Button`, `Badge`, `Alert`, `Input`, `Select`)
- Completed `25_FRONTEND_CHART_VISUALIZATION_SUITE.md` (`ShapBarChart`, `RiskTrendChart`, `LifestyleTrendChart`)

---

## 3. Why This Is Created Now
1. **End-to-End Value Delivery**: This workflow connects every previous step:
   `React Form` $\rightarrow$ `Spring Boot Orchestrator` $\rightarrow$ `FastAPI Model & TreeSHAP` $\rightarrow$ `Clinical Rule Engine` $\rightarrow$ `PostgreSQL Persistence` $\rightarrow$ `Interactive Explainability UI`.
2. **Interactive Clinical Presets**: Clinical lab forms with 24 inputs can be tedious to test manually. Adding sample loader buttons ("Load Healthy Profile", "Load High-Risk Profile") allows instant demonstration of SHAP divergences and rule triggers.

---

## 4. Key Page Architectures & Logic

### 4.1 `Dashboard.jsx` Highlights
Path: `frontend/src/pages/Dashboard.jsx`
- Fetches all data via `dashboardApi.getDashboard()`.
- Renders:
  - Top Hero card with personalized greeting and latest evaluation timestamp.
  - Current Risk Index card with colored risk badge (`Low`, `Moderate`, `High`).
  - Lifestyle Progress score card ($0–100$).
  - Quick Daily Habit log snapshot.
  - Interactive `RiskTrendChart` and `LifestyleTrendChart`.
  - Top Model Risk Contributors previewing local SHAP values.
  - Expandable recommendation cards with "Why was this recommended?" trigger inspection drawers.

---

### 4.2 `Assessment.jsx` Highlights
Path: `frontend/src/pages/Assessment.jsx`
- Form state initialized with standard clinical defaults.
- One-click presets:
  - `loadSampleHealthy()`: Sets BP 75, Creatinine 0.8, Hemoglobin 15.8, Albumin 0.
  - `loadSampleHighRisk()`: Sets BP 145, Creatinine 3.2, Hemoglobin 9.4, Albumin 3, Diabetes 'yes'.
- On submit:
  ```javascript
  const payload = {
    age: parseFloat(form.age),
    bloodPressure: parseFloat(form.bloodPressure),
    serumCreatinine: parseFloat(form.serumCreatinine),
    // ... all 24 features
  };
  const res = await assessmentApi.createAssessment(payload);
  navigate(`/assessment/result/${res.id}`, { state: { assessment: res } });
  ```

---

### 4.3 `AssessmentResult.jsx` Highlights
Path: `frontend/src/pages/AssessmentResult.jsx`
- Retrieves assessment either from `location.state.assessment` (immediate navigate) or via `assessmentApi.getAssessmentById(id)` (direct URL / bookmark).
- Renders:
  - Risk classification badge and model confidence probability.
  - `ShapBarChart` visually breaking down positive and negative feature attributions.
  - Feature value inspection table comparing patient biomarker values against model contributions.
  - Actionable recommendation cards with citation sources (e.g. WHO, NKF).

---

## 5. Verification
Verify syntax:
```powershell
cd kidneycare-xai/frontend
npm run lint
```

---

## 6. Next Step Dependency
Proceed to **`28_FRONTEND_RECOMMENDATIONS_DAILY_TRACKER_HISTORY_PROFILE.md`** to implement the remaining patient management pages: `Recommendations.jsx`, `DailyTracker.jsx`, `History.jsx`, and `Profile.jsx`.
