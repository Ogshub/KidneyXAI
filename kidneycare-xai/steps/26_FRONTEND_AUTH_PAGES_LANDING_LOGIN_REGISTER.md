# Step 26: Frontend — Authentication Pages (Landing, Login & Register)

## 1. Overview & Objective
In this step, we implement the public entry pages in `frontend/src/pages/`:
1. `Landing.jsx`: Modern healthcare portal landing page explaining the 4-step clinical AI pipeline (Predict $\rightarrow$ Explain $\rightarrow$ Recommend $\rightarrow$ Track), featuring global feature importance preview, direct assessment calls-to-action, and medical disclaimer cards.
2. `Login.jsx`: Clean sign-in card with email and password fields, loading spinner state, error alert banners, and redirect preservation (`location.state.from`).
3. `Register.jsx`: Account creation card with client-side password matching validation ($\ge 6\text{ characters}$), full name, and email fields.

---

## 2. Prerequisites
- Completed `22_FRONTEND_API_CLIENT_AND_AUTH_CONTEXT.md` (`useAuth`)
- Completed `23_FRONTEND_COMMON_UI_COMPONENTS.md` (`Button`, `Input`, `Card`, `Alert`)
- Completed `25_FRONTEND_CHART_VISUALIZATION_SUITE.md` (`FeatureImportanceChart`)

---

## 3. Why This Is Created Now
1. **User Onboarding Gateway**: Before patients can view risk dashboards or log daily habits, they must register an identity and receive a JWT token.
2. **Intent Preservation**: When an unauthenticated patient attempts to open a direct link (e.g. `/assessment`), `Login.jsx` remembers `from = location.state?.from?.pathname || '/dashboard'`, seamlessly redirecting them back to their requested page after login.

---

## 4. Page Implementations

### 4.1 `Landing.jsx`
Path: `frontend/src/pages/Landing.jsx`
- Features hero section with dual CTAs ("Start Risk Assessment", "Take College Lifestyle Survey"), architecture pipeline breakdown, global SHAP feature importance chart, and medical decision support notices.

---

### 4.2 `Login.jsx`
Path: `frontend/src/pages/Login.jsx`
```jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, Alert } from '../components/common';
import { HeartPulse, LogIn } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setFormData({
      email: 'alice@kidneycare.org',
      password: 'SecurePassword123!',
    });
    setError('');
  };

  return (
    <div className="max-w-md mx-auto pt-8 pb-16">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-teal-600/20">
          <HeartPulse className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Sign in to KidneyCare-XAI</h1>
        <p className="text-sm text-slate-500 mt-1">
          Access your risk evaluations, SHAP charts, and lifestyle logs
        </p>
      </div>

      <Card className="shadow-sm">
        {/* Pre-Configured Clinician Demo Account */}
        <div className="mb-5 p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold text-teal-900">Pre-Configured Clinician</p>
            <p className="text-teal-700 font-mono mt-0.5">alice@kidneycare.org</p>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition shadow-sm cursor-pointer"
          >
            Auto-fill
          </button>
        </div>

        {error && (
          <Alert type="danger" className="mb-5" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            size="lg"
            loading={loading}
            icon={LogIn}
            className="w-full mt-2"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-teal-600 hover:text-teal-700">
            Create an account
          </Link>
        </div>
      </Card>
    </div>
  );
};
```

---

### 4.3 `Register.jsx`
Path: `frontend/src/pages/Register.jsx`
```jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, Alert } from '../components/common';
import { HeartPulse, UserPlus } from 'lucide-react';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please check your information.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-8 pb-16">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-teal-600/20">
          <HeartPulse className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="text-sm text-slate-500 mt-1">
          Join KidneyCare-XAI for personalized risk awareness
        </p>
      </div>

      <Card className="shadow-sm">
        {error && (
          <Alert type="danger" className="mb-5" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            placeholder="e.g. Alex Morgan"
            value={formData.name}
            onChange={handleChange}
            required
            autoComplete="name"
          />

          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="alex@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="At least 6 characters"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            size="lg"
            loading={loading}
            icon={UserPlus}
            className="w-full mt-2"
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
};
```

---

## 5. Verification
Verify syntax:
```powershell
cd kidneycare-xai/frontend
npm run lint
```

---

## 6. Next Step Dependency
Proceed to **`27_FRONTEND_DASHBOARD_AND_ASSESSMENT_WORKFLOW.md`** to implement the primary clinical workflows: `Dashboard.jsx`, `Assessment.jsx`, and `AssessmentResult.jsx`.
