import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';
import { FaLock, FaCheckCircle, FaKey, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface FormData {
  email: string;
  code: string;
  new_password: string;
  new_password2: string;
}

interface ApiError {
  response?: {
    data?: Record<string, string | string[]>;
  };
}

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    email: searchParams.get('email') || '',
    code: searchParams.get('code') || '',
    new_password: '',
    new_password2: '',
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (formData.new_password !== formData.new_password2) {
      toast.error('Passwords do not match');
      return;
    }

    if (!uid && !formData.code) {
      toast.error('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      await authApi.passwordResetConfirm({
        email: formData.email ? formData.email.trim() : undefined,
        code: formData.code ? formData.code.trim() : undefined,
        uid: uid || undefined,
        token: token || undefined,
        new_password: formData.new_password,
        new_password2: formData.new_password2,
      });

      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2500);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorData = apiError.response?.data;
      let errorMsg = 'Failed to reset password';

      if (errorData) {
        if (typeof errorData.code === 'string') errorMsg = errorData.code;
        else if (Array.isArray(errorData.code)) errorMsg = errorData.code[0];
        else if (typeof errorData.token === 'string') errorMsg = errorData.token;
        else if (typeof errorData.error === 'string') errorMsg = errorData.error;
        else if (typeof errorData.detail === 'string') errorMsg = errorData.detail;
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheckCircle className="text-3xl text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Complete!</h2>
          <p className="text-gray-600 mb-6">
            Your password has been successfully updated. Redirecting to login...
          </p>
          <Link to="/login" className="btn-primary inline-block w-full py-3">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md w-full">
        <Link to="/login" className="text-gray-500 hover:text-teal-600 flex items-center mb-6 text-sm">
          <FaArrowLeft className="mr-2" /> Back to Login
        </Link>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-teal-600">
            <FaKey className="text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Choose New Password</h2>
          <p className="text-gray-600 text-sm mt-1">
            {uid ? 'Create your new password below.' : 'Enter the 6-digit code sent to your email.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!uid && (
            <>
              <div>
                <label className="label">Registered Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="input-field pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="label">6-Digit Verification Code</label>
                <div className="relative">
                  <FaKey className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    placeholder="123456"
                    maxLength={6}
                    className="input-field pl-10 text-center tracking-widest font-mono text-lg font-bold"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Check your inbox for the 6-digit code (valid for 15 minutes).
                </p>
              </div>
            </>
          )}

          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="password"
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                placeholder="At least 8 characters"
                className="input-field pl-10"
                required
                disabled={loading}
                minLength={8}
              />
            </div>
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="password"
                value={formData.new_password2}
                onChange={(e) => setFormData({ ...formData, new_password2: e.target.value })}
                placeholder="Re-enter your new password"
                className="input-field pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base font-semibold disabled:opacity-50 mt-2"
          >
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>

          <div className="text-center pt-2">
            <Link to="/forgot-password" className="text-xs text-teal-600 hover:underline">
              Didn't receive a code? Send again
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;