# Step 22: Frontend — API Client, Interceptors & JWT Auth Context

## 1. Overview & Objective
In this step, we construct the frontend network and authentication infrastructure:
1. `src/api/client.js`: Axios instance configured with base URL, a request interceptor automatically attaching the Bearer JWT token from `localStorage`, and a response interceptor handling HTTP 401 unauthorized errors.
2. `src/api/index.js`: Typed modular API resource methods (`authApi`, `profileApi`, `assessmentApi`, `activityApi`, `recommendationApi`, `dashboardApi`, `researchApi`).
3. `src/context/AuthContext.jsx`: React Context provider persisting user sessions across browser refreshes, offering `login()`, `register()`, `logout()`, `updateUser()`, and the custom hook `useAuth()`.

---

## 2. Prerequisites
- Completed `19_BACKEND_REST_CONTROLLERS_API_LAYER.md` (Spring Boot API routes)
- Completed `21_FRONTEND_VITE_SETUP_AND_TAILWIND_DESIGN_SYSTEM.md` (`axios` installed)

---

## 3. Why This Is Created Now
1. **Centralized Token Injection**: Instead of manually attaching `headers: { Authorization: ... }` in dozens of React components, Axios interceptors inject it transparently into every outgoing HTTP request.
2. **Global Auth State**: Pages like Dashboard, Assessment, and Profile need immediate access to `user`, `isAuthenticated`, and `logout`. React Context provides this state across the component tree without prop-drilling.

---

## 4. File Implementations

### 4.1 `src/api/client.js`
Path: `frontend/src/api/client.js`
```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kidneycare_token');
    if (token && !config.url?.includes('/auth/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthenticated
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('kidneycare_token');
      localStorage.removeItem('kidneycare_user');
      if (window.location.pathname !== '/login' &&
          window.location.pathname !== '/register' &&
          window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### 4.2 `src/api/index.js`
Path: `frontend/src/api/index.js`
```javascript
import apiClient from './client';

export const authApi = {
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },
  register: async (data) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },
};

export const profileApi = {
  getProfile: async () => {
    const res = await apiClient.get('/profile');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await apiClient.put('/profile', data);
    return res.data;
  },
  getHealthProfile: async () => {
    const res = await apiClient.get('/health-profile');
    return res.data;
  },
  updateHealthProfile: async (data) => {
    const res = await apiClient.put('/health-profile', data);
    return res.data;
  },
};

export const assessmentApi = {
  createAssessment: async (data) => {
    const res = await apiClient.post('/assessments', data);
    return res.data;
  },
  getAssessments: async () => {
    const res = await apiClient.get('/assessments');
    return res.data;
  },
  getAssessmentById: async (id) => {
    const res = await apiClient.get(`/assessments/${id}`);
    return res.data;
  },
};

export const activityApi = {
  logActivity: async (data) => {
    const res = await apiClient.post('/activities', data);
    return res.data;
  },
  getActivities: async (from, to) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await apiClient.get('/activities', { params });
    return res.data;
  },
};

export const recommendationApi = {
  getRecommendations: async (assessmentId) => {
    const params = assessmentId ? { assessmentId } : {};
    const res = await apiClient.get('/recommendations', { params });
    return res.data;
  },
};

export const dashboardApi = {
  getDashboard: async () => {
    const res = await apiClient.get('/dashboard');
    return res.data;
  },
};

export const researchApi = {
  submitSurvey: async (data) => {
    const res = await apiClient.post('/research/submit', data);
    return res.data;
  },
};
```

---

### 4.3 `src/context/AuthContext.jsx`
Path: `frontend/src/context/AuthContext.jsx`
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('kidneycare_token');
      const savedUser = localStorage.getItem('kidneycare_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error('Failed to restore auth session:', err);
      localStorage.removeItem('kidneycare_token');
      localStorage.removeItem('kidneycare_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    const userData = { id: data.userId || data.id, name: data.name, email: data.email };
    setToken(data.token);
    setUser(userData);
    localStorage.setItem('kidneycare_token', data.token);
    localStorage.setItem('kidneycare_user', JSON.stringify(userData));
    return data;
  };

  const register = async (formData) => {
    const data = await authApi.register(formData);
    const userData = { id: data.userId || data.id, name: data.name, email: data.email };
    setToken(data.token);
    setUser(userData);
    localStorage.setItem('kidneycare_token', data.token);
    localStorage.setItem('kidneycare_user', JSON.stringify(userData));
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kidneycare_token');
    localStorage.removeItem('kidneycare_user');
  };

  const updateUser = (userData) => {
    setUser((prev) => {
      const updated = { ...prev, ...userData };
      localStorage.setItem('kidneycare_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

---

## 5. Verification
Verify syntax via Vite build or oxlint:
```powershell
cd kidneycare-xai/frontend
npm run lint
```

---

## 6. Next Step Dependency
Proceed to **`23_FRONTEND_COMMON_UI_COMPONENTS.md`** to construct the reusable UI component atomic library (`Button`, `Input`, `Card`, `Feedback`).
