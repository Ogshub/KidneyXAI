# Step 24: Frontend — Application Layout & Protected Route Guards

## 1. Overview & Objective
In this step, we implement the application skeleton in `frontend/src/components/layout/`:
1. `Navbar.jsx`: Sticky responsive top navigation with gradient logo, navigation links adapting dynamically to authentication state, mobile hamburger drawer, user profile badge, and logout action.
2. `Footer.jsx`: Clean footer with medical disclaimer ("KidneyCare-XAI is an investigational clinical decision support tool and does not provide formal medical diagnoses"), links to research surveys, and copyright.
3. `ProtectedRoute.jsx`: Client-side route guard preventing unauthenticated access to protected routes (Dashboard, Assessment, Tracker, Recommendations, History, Profile). Redirects unauthenticated users to `/login` while storing the intended destination in `location.state`.
4. `Layout.jsx`: Master layout wrapper rendering `Navbar`, the active page via React Router's `<Outlet />`, and `Footer`.

---

## 2. Prerequisites
- Completed `22_FRONTEND_API_CLIENT_AND_AUTH_CONTEXT.md` (`useAuth`)
- Completed `23_FRONTEND_COMMON_UI_COMPONENTS.md` (`Button`, `Spinner`)

---

## 3. Why This Is Created Now
1. **Client-Side Authorization**: Without `ProtectedRoute`, typing `/dashboard` in the browser address bar would render broken pages that attempt to fetch protected data with no JWT token.
2. **Medical Disclaimer Enforcement**: Regulatory and ethical standards for clinical AI require persistent visibility of medical decision support disclaimers across all patient interactions.

---

## 4. Component Implementations

### 4.1 `ProtectedRoute.jsx`
Path: `frontend/src/components/layout/ProtectedRoute.jsx`
```jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../common';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500 font-medium">Verifying authentication session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
```

---

### 4.2 `Layout.jsx`
Path: `frontend/src/components/layout/Layout.jsx`
```jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
```

---

### 4.3 `Navbar.jsx`
Path: `frontend/src/components/layout/Navbar.jsx`
- Features desktop navigation links (`Dashboard`, `Risk Assessment`, `Daily Tracker`, `Recommendations`, `History`), dynamic user badge, and mobile drawer toggle.

---

### 4.4 `Footer.jsx`
Path: `frontend/src/components/layout/Footer.jsx`
- Features investigational clinical decision support disclaimer, institutional links, and navigation mirrors.

---

## 5. Verification
Verify lint checks:
```powershell
cd kidneycare-xai/frontend
npm run lint
```

---

## 6. Next Step Dependency
Proceed to **`25_FRONTEND_CHART_VISUALIZATION_SUITE.md`** to implement the Chart.js visual explainability suite (`ShapBarChart`, `FeatureImportanceChart`, `RiskTrendChart`, `LifestyleTrendChart`).
