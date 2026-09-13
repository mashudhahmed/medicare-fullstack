import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaShieldAlt, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, verify2FA } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 2FA Challenge State
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.email.trim()) next.email = 'Email is required';
    if (!formData.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await login(formData);
      if (result.success) {
        if (result.requires_2fa && result.temp_token) {
          setRequires2FA(true);
          setTempToken(result.temp_token);
          toast.success('Please enter your 6-digit 2FA code.');
        } else {
          toast.success('Welcome back!');
          navigate('/');
        }
      } else {
        toast.error(result.error || 'Invalid email or password');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode.trim() || totpCode.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit verification code.');
      return;
    }

    setVerifying2FA(true);
    try {
      const result = await verify2FA(tempToken, totpCode.trim());
      if (result.success) {
        toast.success('Two-factor verification successful!');
        navigate('/');
      } else {
        toast.error(result.error || 'Invalid 2FA verification code.');
      }
    } catch {
      toast.error('Failed to verify code. Please try again.');
    } finally {
      setVerifying2FA(false);
    }
  };

  const set = (key: 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {requires2FA ? 'Two-Factor Verification' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-slate-500 text-sm">
            {requires2FA
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Sign in to MediCare Hub'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
          {requires2FA ? (
            <form onSubmit={handleVerify2FA} className="space-y-6">
              <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mx-auto">
                <FaShieldAlt className="text-xl" />
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium">Account</p>
                <p className="text-sm font-semibold text-slate-800">{formData.email}</p>
              </div>

              <div>
                <label htmlFor="totp" className="label text-center">
                  Authentication Code
                </label>
                <input
                  id="totp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="input-field text-center font-mono text-2xl tracking-[0.4em] font-bold py-3"
                  autoFocus
                  required
                />
                <p className="text-xs text-slate-400 text-center mt-2">
                  Open Google Authenticator, Authy, or your configured 2FA app.
                </p>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
                disabled={verifying2FA || totpCode.length !== 6}
              >
                {verifying2FA ? (
                  <>
                    <FaSpinner className="animate-spin" /> Verifying...
                  </>
                ) : (
                  'Verify & Log in'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setTotpCode('');
                  setTempToken('');
                }}
                className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center justify-center gap-2 pt-2"
              >
                <FaArrowLeft className="text-xs" /> Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="form-group mb-0">
                <label htmlFor="email" className="label">
                  Email
                </label>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="label mb-0">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Your password"
                  className={`input-field ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  value={formData.password}
                  onChange={set('password')}
                  required
                />
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-base"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>

              <p className="text-center mt-6 text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                >
                  Create one
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
