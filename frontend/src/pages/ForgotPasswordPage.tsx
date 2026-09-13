import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.passwordReset(email);
      setSent(true);
      toast.success('Verification code sent to your email!');
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast.error(apiError.response?.data?.error || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaEnvelope className="text-3xl text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-medicare-dark mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            We've sent a <strong>6-digit verification code</strong> to <strong>{email}</strong>.
          </p>
          <div className="space-y-3">
            <Link
              to={`/reset-password?email=${encodeURIComponent(email)}`}
              className="btn-primary w-full py-3 inline-block font-semibold"
            >
              Enter 6-Digit Code & Reset
            </Link>
            <Link to="/login" className="btn-secondary w-full py-2.5 inline-block text-sm">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <Link to="/login" className="text-gray-500 hover:text-medicare-teal flex items-center mb-6">
          <FaArrowLeft className="mr-2" /> Back to Login
        </Link>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-medicare-dark">Reset Password</h2>
          <p className="text-gray-600 mt-2">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label className="label">Email Address</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="input-field pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-medicare-teal font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;