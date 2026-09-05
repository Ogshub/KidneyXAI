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
        name: formData.name.trim(),
        email: formData.email.trim(),
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

          <div className="text-xs text-slate-500 leading-relaxed pt-1">
            By signing up, you acknowledge that KidneyCare-XAI is an educational decision-support tool, not a clinical diagnostic provider.
          </div>

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
