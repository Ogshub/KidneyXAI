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

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
        {/* Demo Account Quick-Fill Card */}
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
