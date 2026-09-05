# Step 29: Frontend — Research Survey & Application Router Integration

## 1. Overview & Objective
In this step, we finalize the user interface and client routing:
1. `ResearchSurvey.jsx`: A public, IRB-compliant survey instrument (Dataset B) allowing students and faculty members to submit anonymized lifestyle data without needing an account.
2. `src/pages/index.js`: Re-export barrel consolidating all 11 pages.
3. `src/App.jsx`: Master client-side routing hierarchy configuring public routes (`/`, `/login`, `/register`, `/research-survey`), protected authenticated routes (`/dashboard`, `/assessment`, `/assessment/result/:id`, `/recommendations`, `/tracker`, `/history`, `/profile`), and catch-all 404 redirects.
4. `src/main.jsx`: Application bootstrap mounting React 19 root into the DOM under `StrictMode`.

---

## 2. Prerequisites
- Completed Steps 21 through 28 (all components, contexts, and pages built)

---

## 3. Why This Is Created Now
1. **Public Survey Independence**: The research survey must be globally accessible without logging in, matching the database design where `research_responses` is decoupled from `users`.
2. **Deterministic Route Mapping**: Consolidating all pages into a centralized route table wrapped by `AuthProvider` and `Layout` guarantees consistent navigation bars, footers, and authentication guards.

---

## 4. File Implementations

### 4.1 `src/pages/ResearchSurvey.jsx` Highlights
Path: `frontend/src/pages/ResearchSurvey.jsx`
- Participant demographics: Role (`Student` / `Faculty`), Age Group (`18–22`, `23–30`, `31–50`, `50+`), Gender.
- Health history: Diabetes, Hypertension, Family History of Kidney Disease, OTC Painkiller Frequency.
- Lifestyle questions: Daily Water Intake, Weekly Exercise, Sleep Hours, Fast Food, Salty Snacks, Sugary Beverages.
- Kidney Health Awareness questions: Early symptom awareness, Blood pressure monitoring habit, Prior educational materials received.
- Submits via `researchApi.submitSurvey(payload)` and presents an anonymized Participant ID (`P001`, `P002`, ...).

---

### 4.2 `src/pages/index.js`
Path: `frontend/src/pages/index.js`
```javascript
export { Landing } from './Landing';
export { Login } from './Login';
export { Register } from './Register';
export { Dashboard } from './Dashboard';
export { Profile } from './Profile';
export { Assessment } from './Assessment';
export { AssessmentResult } from './AssessmentResult';
export { Recommendations } from './Recommendations';
export { DailyTracker } from './DailyTracker';
export { History } from './History';
export { ResearchSurvey } from './ResearchSurvey';
```

---

### 4.3 `src/App.jsx`
Path: `frontend/src/App.jsx`
```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import {
  Landing,
  Login,
  Register,
  Dashboard,
  Profile,
  Assessment,
  AssessmentResult,
  Recommendations,
  DailyTracker,
  History,
  ResearchSurvey,
} from './pages';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes wrapped in Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/research-survey" element={<ResearchSurvey />} />

            {/* Protected authenticated routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment"
              element={
                <ProtectedRoute>
                  <Assessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment/result/:id"
              element={
                <ProtectedRoute>
                  <AssessmentResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommendations"
              element={
                <ProtectedRoute>
                  <Recommendations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracker"
              element={
                <ProtectedRoute>
                  <DailyTracker />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

---

### 4.4 `src/main.jsx`
Path: `frontend/src/main.jsx`
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

## 5. Verification
Test full production compilation of the React 19 application:
```powershell
cd kidneycare-xai/frontend
npm run build
```
Verify that Vite outputs `dist/index.html` and bundled JavaScript/CSS chunks with 0 errors!

---

## 6. Next Step Dependency
Phase 4 (Frontend) is complete! Proceed to the final phase: **`30_CONTAINERIZATION_END_TO_END_PIPELINE_AND_DEPLOYMENT.md`** to configure Docker Compose, Nginx, and execute the full-stack end-to-end verification checklist.
