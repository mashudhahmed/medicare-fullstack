import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth';
import { patientsApi } from '../api/patients';
import { doctorsApi } from '../api/doctors';
import { Patient, Doctor } from '../types';
import { Modal } from '../components/ui';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaShieldAlt, FaQrcode, FaKey } from 'react-icons/fa';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Patient | Doctor | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
  });
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // 2FA Management States
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [show2FADisableModal, setShow2FADisableModal] = useState(false);
  const [setup2FAData, setSetup2FAData] = useState<{ secret: string; qr_code: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [disableTotpCode, setDisableTotpCode] = useState('');
  const [processing2FA, setProcessing2FA] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (user?.role === 'patient') {
          const data = await patientsApi.getMe();
          setProfile(data);
        } else if (user?.role === 'doctor') {
          const data = await doctorsApi.getMyProfile();
          setProfile(data);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedUser = await authApi.updateProfile(formData);
      updateUser(updatedUser);
      
      if (user?.role === 'patient' && profile) {
        await patientsApi.updateMyProfile(profile as Patient);
      } else if (user?.role === 'doctor' && profile) {
        await doctorsApi.updateMyProfile(profile as Doctor);
      }

      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.new_password2) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(passwordData);
      toast.success('Password changed successfully');
      setShowPasswordForm(false);
      setPasswordData({ old_password: '', new_password: '', new_password2: '' });
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleStart2FASetup = async () => {
    setProcessing2FA(true);
    try {
      const data = await authApi.setup2FA();
      setSetup2FAData(data);
      setTotpCode('');
      setShow2FASetupModal(true);
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(message || 'Failed to initiate 2FA setup');
    } finally {
      setProcessing2FA(false);
    }
  };

  const handleConfirmEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setup2FAData || totpCode.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    setProcessing2FA(true);
    try {
      await authApi.enable2FA({ secret: setup2FAData.secret, code: totpCode.trim() });
      toast.success('Two-factor authentication enabled successfully');
      setShow2FASetupModal(false);
      setSetup2FAData(null);
      setTotpCode('');
      if (user) {
        updateUser({ ...user, two_factor_enabled: true });
      }
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(message || 'Failed to enable 2FA');
    } finally {
      setProcessing2FA(false);
    }
  };

  const handleConfirmDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disableTotpCode.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    setProcessing2FA(true);
    try {
      await authApi.disable2FA({ code: disableTotpCode.trim() });
      toast.success('Two-factor authentication disabled');
      setShow2FADisableModal(false);
      setDisableTotpCode('');
      if (user) {
        updateUser({ ...user, two_factor_enabled: false });
      }
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(message || 'Failed to disable 2FA');
    } finally {
      setProcessing2FA(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-medicare-teal to-teal-500 px-6 py-8">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-medicare-teal">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div className="ml-6 text-white">
              <h1 className="text-2xl font-bold">{user.full_name}</h1>
              <p className="text-teal-100 capitalize">{user.role}</p>
              <p className="text-teal-100 text-sm">
                Status: <span className="font-medium">{user.status}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-medicare-dark">Profile Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-primary text-sm flex items-center"
            >
              {isEditing ? (
                <><FaSave className="mr-2" /> Save</>
              ) : (
                <><FaEdit className="mr-2" /> Edit</>
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Full Name</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="input-field pl-10 bg-gray-50"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Phone</label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Role</label>
                <div className="relative">
                  <input
                    type="text"
                    value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    disabled
                    className="input-field bg-gray-50"
                  />
                </div>
              </div>

              <div className="form-group md:col-span-2">
                <label className="label">Address</label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows={2}
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>

          {/* Change Password */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-medicare-teal hover:underline"
            >
              {showPasswordForm ? 'Cancel' : 'Change Password'}
            </button>

            {showPasswordForm && (
              <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
                <div className="form-group">
                  <label className="label">Current Password</label>
                  <input
                    type="password"
                    name="old_password"
                    value={passwordData.old_password}
                    onChange={handlePasswordChange}
                    className="input-field"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    className="input-field"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    name="new_password2"
                    value={passwordData.new_password2}
                    onChange={handlePasswordChange}
                    className="input-field"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>

          {/* Two-Factor Authentication (2FA) */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <FaShieldAlt className="text-medicare-teal text-lg" />
                  <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication (2FA)</h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      user.two_factor_enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {user.two_factor_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Add an extra layer of security using standard authenticator apps like Google Authenticator or Microsoft Authenticator.
                </p>
              </div>
              <div>
                {user.two_factor_enabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDisableTotpCode('');
                      setShow2FADisableModal(true);
                    }}
                    className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition"
                  >
                    Disable 2FA
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStart2FASetup}
                    disabled={processing2FA}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    <FaQrcode />
                    {processing2FA ? 'Setting up...' : 'Enable 2FA'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      <Modal
        isOpen={show2FASetupModal}
        onClose={() => {
          if (!processing2FA) {
            setShow2FASetupModal(false);
            setSetup2FAData(null);
            setTotpCode('');
          }
        }}
        title="Set Up Two-Factor Authentication"
        size="md"
      >
        {setup2FAData && (
          <form onSubmit={handleConfirmEnable2FA} className="space-y-5">
            <p className="text-sm text-gray-600">
              Scan the QR code below using your authenticator app (Google Authenticator, Authy, Microsoft Authenticator), then enter the 6-digit code.
            </p>

            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-200">
              <img
                src={setup2FAData.qr_code}
                alt="2FA QR Code"
                className="w-48 h-48 rounded shadow-sm bg-white p-2"
              />
              <div className="mt-3 text-center">
                <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">
                  Or enter key manually:
                </span>
                <code className="text-xs font-mono bg-white px-2.5 py-1 rounded border border-gray-300 select-all font-semibold text-gray-800">
                  {setup2FAData.secret}
                </code>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <FaKey className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className="input-field pl-10 font-mono text-center tracking-widest text-lg font-bold"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShow2FASetupModal(false);
                  setSetup2FAData(null);
                  setTotpCode('');
                }}
                disabled={processing2FA}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing2FA || totpCode.trim().length !== 6}
                className="btn-primary"
              >
                {processing2FA ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 2FA Disable Modal */}
      <Modal
        isOpen={show2FADisableModal}
        onClose={() => {
          if (!processing2FA) {
            setShow2FADisableModal(false);
            setDisableTotpCode('');
          }
        }}
        title="Disable Two-Factor Authentication"
        size="sm"
      >
        <form onSubmit={handleConfirmDisable2FA} className="space-y-4">
          <p className="text-sm text-gray-600">
            Please enter the 6-digit code from your authenticator app to verify your identity and disable 2FA.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              6-Digit Code
            </label>
            <div className="relative">
              <FaKey className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                maxLength={6}
                value={disableTotpCode}
                onChange={(e) => setDisableTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                className="input-field pl-10 font-mono text-center tracking-widest text-lg font-bold"
                autoFocus
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShow2FADisableModal(false);
                setDisableTotpCode('');
              }}
              disabled={processing2FA}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing2FA || disableTotpCode.trim().length !== 6}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
            >
              {processing2FA ? 'Disabling...' : 'Confirm Disable'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProfilePage;