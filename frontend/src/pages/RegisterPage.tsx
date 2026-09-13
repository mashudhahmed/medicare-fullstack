import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    password2: '',
    role: 'patient' as 'patient' | 'doctor',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.full_name.trim()) next.full_name = 'Full name is required';
    if (!formData.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) next.email = 'Enter a valid email';
    if (formData.password.length < 8) next.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.password2) next.password2 = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await register(formData);
      if (result.success) {
        toast.success('Registration successful! Please log in.');
        navigate('/login');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-teal-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white text-2xl font-bold shadow-lg shadow-teal-600/30 mb-4">
            M
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h1>
          <p className="mt-1 text-slate-500 text-sm">Join MediCare Hub to manage your health</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="form-group mb-0">
              <label htmlFor="full_name" className="label">Full name</label>
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                className={`input-field ${errors.full_name ? 'border-red-400 focus:ring-red-400' : ''}`}
                value={formData.full_name}
                onChange={set('full_name')}
                required
              />
              {errors.full_name && <p className="form-error">{errors.full_name}</p>}
            </div>

            <div className="form-group mb-0">
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`input-field ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                value={formData.email}
                onChange={set('email')}
                required
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div className="form-group mb-0">
              <label htmlFor="role" className="label">I am a</label>
              <select
                id="role"
                className="input-field"
                value={formData.role}
                onChange={set('role')}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className={`input-field ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                value={formData.password}
                onChange={set('password')}
                required
              />
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>

            <div className="form-group mb-0">
              <label htmlFor="password2" className="label">Confirm password</label>
              <input
                id="password2"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                className={`input-field ${errors.password2 ? 'border-red-400 focus:ring-red-400' : ''}`}
                value={formData.password2}
                onChange={set('password2')}
                required
              />
              {errors.password2 && <p className="form-error">{errors.password2}</p>}
            </div>

            <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center mt-6 text-xs text-slate-400">
          By registering you agree to MediCare Hub terms of service.
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
