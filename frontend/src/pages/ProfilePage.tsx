import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth';
import { patientsApi } from '../api/patients';
import { doctorsApi } from '../api/doctors';
import { Patient, Doctor } from '../types';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave } from 'react-icons/fa';

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
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;