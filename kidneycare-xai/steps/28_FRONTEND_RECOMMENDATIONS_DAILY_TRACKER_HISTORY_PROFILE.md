# Step 28: Frontend — Patient Empowerment Suite (Recommendations, Tracker, History & Profile)

## 1. Overview & Objective
In this step, we implement the four patient management and lifestyle tracking pages in `frontend/src/pages/`:
1. `Recommendations.jsx`: Categorized clinical guidance screen with tab filtering (`ALL`, `HYDRATION`, `DIET`, `EXERCISE`, `MEDICAL`, `LIFESTYLE`) and click-to-expand justification drawers showing the exact trigger reason and authoritative clinical citation source.
2. `DailyTracker.jsx`: Longitudinal daily habit logging interface with quick increment/decrement buttons for hydration and exercise, salt level selectors, smoking/alcohol toggles, and instant submission feedback.
3. `History.jsx`: Complete audit log of past risk evaluations and lifestyle tracking records with date filtering, risk index trends, and historical detail modals.
4. `Profile.jsx`: User identity settings and baseline physical parameters (height, weight, age, gender) with automated real-time BMI gauge computation.

---

## 2. Prerequisites
- Completed `22_FRONTEND_API_CLIENT_AND_AUTH_CONTEXT.md` (`activityApi`, `recommendationApi`, `profileApi`, `assessmentApi`)
- Completed `23_FRONTEND_COMMON_UI_COMPONENTS.md`
- Completed `25_FRONTEND_CHART_VISUALIZATION_SUITE.md` (`RiskTrendChart`, `LifestyleTrendChart`)

---

## 3. Why This Is Created Now
1. **Actionable Patient Agency**: AI predictions alone can trigger anxiety in patients. Providing explicit lifestyle tracking and explainable guidance gives patients concrete daily actions to improve their kidney health.
2. **Transparent Audit Trail**: Clinicians reviewing a patient's record can consult `History.jsx` to trace historical risk trajectory alongside daily logged behaviors over months.

---

## 4. Key Page Implementations

### 4.1 `Recommendations.jsx` Highlights
Path: `frontend/src/pages/Recommendations.jsx`
- Fetches all recommendations via `recommendationApi.getRecommendations()`.
- Category tabs: `ALL`, `HYDRATION`, `DIET`, `EXERCISE`, `MEDICAL`, `LIFESTYLE`.
- Each recommendation card renders:
  - Category icon and priority badge (`High Priority`, `Medium`, `Routine`).
  - Clear actionable guidance text.
  - Expandable drawer: "Why was this recommended?" showing the exact trigger biomarker and guideline citation.

---

### 4.2 `DailyTracker.jsx` Highlights
Path: `frontend/src/pages/DailyTracker.jsx`
- Quick logging form for `activityDate` (defaults to today `YYYY-MM-DD`).
- Stepper controls:
  - Hydration (liters, $+0.25\text{L}$ steps).
  - Exercise (minutes, $+15\text{ min}$ steps).
  - Sleep (hours, $+0.5\text{ hr}$ steps).
- Selectors for dietary salt (`Low`, `Medium`, `High`), fast food, sugary drinks, tobacco, alcohol, and stress.
- Submits via `activityApi.logActivity(payload)` and immediately refetches recent logs.

---

### 4.3 `History.jsx` Highlights
Path: `frontend/src/pages/History.jsx`
- Displays historical risk assessments in chronological order.
- Features `RiskTrendChart` spanning the user's complete history.
- Clickable rows to re-examine full SHAP breakdown and recommendations from any previous date.

---

### 4.4 `Profile.jsx` Highlights
Path: `frontend/src/pages/Profile.jsx`
- Loads current user identity and physical attributes via `profileApi.getProfile()`.
- Client-side BMI calculation preview:
  $$\text{BMI} = \frac{\text{weight (kg)}}{(\text{height (m)})^2}$$
- Allows updating clinical comorbidities (diabetes, hypertension, family history, painkiller usage) and saves via `profileApi.updateProfile()`.

---

## 5. Verification
Verify syntax:
```powershell
cd kidneycare-xai/frontend
npm run lint
```

---

## 6. Next Step Dependency
Proceed to **`29_FRONTEND_RESEARCH_SURVEY_AND_ROUTER_INTEGRATION.md`** to implement the standalone Research Survey page (Dataset B) and connect all pages in `App.jsx` with React Router.
