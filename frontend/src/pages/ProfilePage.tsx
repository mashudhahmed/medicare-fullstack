import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth';
import { patientsApi } from '../api/patients';
import { doctorsApi } from '../api/doctors';
import { appointmentsApi } from '../api/appointments';
import { prescriptionsApi } from '../api/prescriptions';
import { uploadApi } from '../api/upload';
import { Patient, Doctor } from '../types';
import { Modal } from '../components/ui';
import toast from 'react-hot-toast';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaEdit,
  FaSave,
  FaShieldAlt,
  FaQrcode,
  FaKey,
  FaCamera,
  FaTrash,
  FaSpinner,
  FaUserMd,
  FaHeartbeat,
  FaNotesMedical,
  FaStar,
  FaCheckCircle,
  FaExclamationCircle,
  FaLock,
  FaClock,
  FaIdCard,
  FaTimes,
  FaCalendarAlt,
  FaPills,
  FaHistory,
  FaCopy,
} from 'react-icons/fa';

type ProfileTab = 'general' | 'clinical' | 'security' | 'activity';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SPECIALTIES = [
  'general',
  'cardiology',
  'dermatology',
  'pediatrics',
  'neurology',
  'orthopedics',
  'psychiatry',
  'oncology',
  'gynecology',
  'ophthalmology',
  'other',
];

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('general');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<Patient | Doctor | null>(null);

  // Edit states for sections
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [isEditingClinical, setIsEditingClinical] = useState(false);

  // General user form state
  const [userFormData, setUserFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
  });

  // Patient clinical form state
  const [patientFormData, setPatientFormData] = useState({
    date_of_birth: '',
    gender: 'other' as 'male' | 'female' | 'other',
    blood_group: '',
    emergency_contact_name: '',
    emergency_contact: '',
    allergies: '',
    chronic_conditions: '',
  });

  // Doctor professional form state
  const [doctorFormData, setDoctorFormData] = useState({
    specialty: '',
    qualification: '',
    experience_years: 0,
    license_number: '',
    consultation_fee: '0.00',
    available_time_start: '09:00:00',
    available_time_end: '17:00:00',
  });

  // Security password state
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // 2FA Management states
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [show2FADisableModal, setShow2FADisableModal] = useState(false);
  const [setup2FAData, setSetup2FAData] = useState<{ secret: string; qr_code: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [disableTotpCode, setDisableTotpCode] = useState('');
  const [processing2FA, setProcessing2FA] = useState(false);

  // Avatar state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Dynamic activity statistics
  const [activityStats, setActivityStats] = useState<{
    appointmentsCount: number;
    prescriptionsCount: number;
  }>({
    appointmentsCount: 0,
    prescriptionsCount: 0,
  });

  // Sync avatar error reset
  useEffect(() => {
    setAvatarImgError(false);
  }, [user?.profile_picture]);

  // Sync general user form data when user loads
  useEffect(() => {
    if (user) {
      setUserFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  // Fetch role-specific profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      setProfileLoading(true);
      try {
        if (user?.role === 'patient') {
          const data = await patientsApi.getMe();
          setProfile(data);
          setPatientFormData({
            date_of_birth: data.date_of_birth || '',
            gender: data.gender || 'other',
            blood_group: data.blood_group || '',
            emergency_contact_name: data.emergency_contact_name || '',
            emergency_contact: data.emergency_contact || '',
            allergies: data.allergies || '',
            chronic_conditions: data.chronic_conditions || '',
          });
        } else if (user?.role === 'doctor') {
          const data = await doctorsApi.getMyProfile();
          setProfile(data);
          setDoctorFormData({
            specialty: data.specialty || '',
            qualification: data.qualification || '',
            experience_years: data.experience_years ?? 0,
            license_number: data.license_number || '',
            consultation_fee: data.consultation_fee ? String(data.consultation_fee) : '0.00',
            available_time_start: data.available_time_start || '09:00:00',
            available_time_end: data.available_time_end || '17:00:00',
          });
        }
      } catch (error) {
        console.error('Failed to fetch clinical profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user]);

  // Fetch dynamic activity statistics
  useEffect(() => {
    const fetchActivity = async () => {
      if (!user) return;
      try {
        const [apptsRes, rxRes] = await Promise.allSettled([
          appointmentsApi.getMyAppointments(),
          prescriptionsApi.getMy(),
        ]);

        const apptsCount =
          apptsRes.status === 'fulfilled'
            ? Array.isArray(apptsRes.value)
              ? apptsRes.value.length
              : apptsRes.value.results?.length || 0
            : 0;

        const rxCount =
          rxRes.status === 'fulfilled'
            ? Array.isArray(rxRes.value)
              ? rxRes.value.length
              : rxRes.value.results?.length || 0
            : 0;

        setActivityStats({
          appointmentsCount: apptsCount,
          prescriptionsCount: rxCount,
        });
      } catch {
        // Silently preserve defaults
      }
    };

    fetchActivity();
  }, [user]);

  // Profile Completeness Calculation
  const completeness = useMemo(() => {
    let totalFields = 4;
    let filledFields = 0;
    const missing: string[] = [];

    if (user?.full_name?.trim()) filledFields++;
    else missing.push('Full Name');

    if (user?.email?.trim()) filledFields++;
    else missing.push('Email');

    if (user?.phone?.trim()) filledFields++;
    else missing.push('Phone');

    if (user?.address?.trim()) filledFields++;
    else missing.push('Address');

    if (user?.role === 'patient') {
      totalFields += 5;
      const p = profile as Patient | null;
      if (p?.blood_group) filledFields++;
      else missing.push('Blood Group');

      if (p?.date_of_birth) filledFields++;
      else missing.push('Date of Birth');

      if (p?.emergency_contact || p?.emergency_contact_name) filledFields++;
      else missing.push('Emergency Contact');

      if (p?.allergies) filledFields++;
      else missing.push('Allergies');

      if (user?.profile_picture) filledFields++;
      else missing.push('Profile Picture');
      totalFields += 1;
    } else if (user?.role === 'doctor') {
      totalFields += 5;
      const d = profile as Doctor | null;
      if (d?.specialty) filledFields++;
      else missing.push('Specialty');

      if (d?.qualification) filledFields++;
      else missing.push('Qualification');

      if (d?.license_number) filledFields++;
      else missing.push('License Number');

      if (d?.consultation_fee) filledFields++;
      else missing.push('Consultation Fee');

      if (user?.profile_picture) filledFields++;
      else missing.push('Profile Picture');
      totalFields += 1;
    }

    const percentage = Math.round((filledFields / totalFields) * 100);
    return { percentage, missing };
  }, [user, profile]);

  // Age Calculator from DOB
  const calculateAge = (dobString?: string): string => {
    if (!dobString) return 'Not recorded';
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return 'Not recorded';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} years old`;
  };

  // Password Strength Meter
  const passwordStrength = useMemo(() => {
    const pwd = passwordData.new_password;
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };

    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Moderate', color: 'bg-amber-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  }, [passwordData.new_password]);

  // General Info Save Handler
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedUser = await authApi.updateProfile(userFormData);
      updateUser(updatedUser);
      setIsEditingGeneral(false);
      toast.success('Identity and contact details updated');
    } catch (error: unknown) {
      const msg =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Failed to update personal information');
    } finally {
      setLoading(false);
    }
  };

  // Clinical Profile Save Handler (Patient)
  const handleSavePatientClinical = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await patientsApi.updateMyProfile(patientFormData);
      setProfile(updated);
      setIsEditingClinical(false);
      toast.success('Clinical demographics and emergency contacts saved');
    } catch (error: unknown) {
      const msg =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Failed to update clinical profile');
    } finally {
      setLoading(false);
    }
  };

  // Clinical Profile Save Handler (Doctor)
  const handleSaveDoctorClinical = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await doctorsApi.updateMyProfile({
        specialty: doctorFormData.specialty,
        qualification: doctorFormData.qualification,
        experience_years: Number(doctorFormData.experience_years),
        license_number: doctorFormData.license_number,
        consultation_fee: doctorFormData.consultation_fee,
        available_time_start: doctorFormData.available_time_start,
        available_time_end: doctorFormData.available_time_end,
      });
      setProfile(updated);
      setIsEditingClinical(false);
      toast.success('Doctor credentials and practice settings saved');
    } catch (error: unknown) {
      const msg =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Failed to update doctor profile');
    } finally {
      setLoading(false);
    }
  };

  // Password Change Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.new_password2) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.new_password2,
      });
      toast.success('Password changed successfully');
      setShowPasswordForm(false);
      setPasswordData({ old_password: '', new_password: '', new_password2: '' });
    } catch (error: unknown) {
      const msg =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string; old_password?: string[] } } }).response?.data
          : undefined;
      const errorText = msg?.error || msg?.old_password?.[0] || 'Failed to change password';
      toast.error(errorText);
    } finally {
      setLoading(false);
    }
  };

  // 2FA Handlers
  const handleStart2FASetup = async () => {
    setProcessing2FA(true);
    try {
      const data = await authApi.setup2FA();
      setSetup2FAData(data);
      setTotpCode('');
      setShow2FASetupModal(true);
    } catch (error: unknown) {
      const msg =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Failed to initiate 2FA setup');
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
      const msg =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Failed to verify 2FA code');
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
      const msg =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Failed to disable 2FA');
    } finally {
      setProcessing2FA(false);
    }
  };

  // Avatar Handlers
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPEG, PNG, WebP)');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      e.target.value = '';
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await uploadApi.uploadAvatar(file);
      updateUser(res.user);
      toast.success('Profile picture updated successfully');
    } catch (error: unknown) {
      const msg =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const res = await uploadApi.deleteAvatar();
      updateUser(res.user);
      toast.success('Profile picture removed');
    } catch (error: unknown) {
      const msg =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(msg || 'Failed to remove profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) return null;

  const doctorProfile = user.role === 'doctor' ? (profile as Doctor | null) : null;
  const patientProfile = user.role === 'patient' ? (profile as Patient | null) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Executive Identity Banner */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 sm:p-8 text-white relative">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar Studio */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl bg-teal-800 flex items-center justify-center relative">
                <span className="text-4xl font-black text-white select-none">
                  {user.full_name?.charAt(0) || 'U'}
                </span>
                {user.profile_picture && !avatarImgError && (
                  <img
                    src={user.profile_picture}
                    alt={user.full_name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() => setAvatarImgError(true)}
                  />
                )}
              </div>

              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-2xl bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-semibold">
                  <FaSpinner className="animate-spin text-xl mb-1" />
                  <span>Saving...</span>
                </div>
              )}

              {!uploadingAvatar && (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  title="Upload profile picture"
                  className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-medium cursor-pointer"
                >
                  <FaCamera className="text-xl mb-1" />
                  <span>Change</span>
                </button>
              )}

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </div>

            {/* Profile Overview & Badges */}
            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
                  {user.full_name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  {user.role}
                </span>
                {doctorProfile?.is_verified && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <FaCheckCircle className="text-xs" /> Verified Practitioner
                  </span>
                )}
                {user.two_factor_enabled && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    <FaShieldAlt className="text-xs" /> 2FA Secured
                  </span>
                )}
              </div>

              <p className="text-slate-300 text-sm flex items-center justify-center md:justify-start gap-2 mb-4">
                <FaEnvelope className="text-teal-400 text-xs shrink-0" />
                <span className="truncate">{user.email}</span>
                {user.phone && (
                  <>
                    <span className="text-slate-500">•</span>
                    <FaPhone className="text-teal-400 text-xs shrink-0" />
                    <span>{user.phone}</span>
                  </>
                )}
              </p>

              {/* Avatar Action Buttons */}
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur transition disabled:opacity-50"
                >
                  <FaCamera className="text-xs" />
                  {user.profile_picture ? 'Change Photo' : 'Upload Photo'}
                </button>
                {user.profile_picture && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/30 backdrop-blur transition disabled:opacity-50"
                  >
                    <FaTrash className="text-xs" />
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Profile Completeness Score Card */}
            <div className="w-full md:w-60 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Profile Health</span>
                <span className="text-sm font-black text-teal-400">{completeness.percentage}%</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completeness.percentage}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {completeness.missing.length === 0
                  ? 'All core attributes completed'
                  : `Next: complete ${completeness.missing[0]}`}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center border-b border-slate-200 px-4 sm:px-8 bg-slate-50/70 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-4 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'general'
                ? 'border-teal-600 text-teal-700 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaUser className="text-sm" />
            <span>General & Identity</span>
          </button>

          <button
            onClick={() => setActiveTab('clinical')}
            className={`py-4 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'clinical'
                ? 'border-teal-600 text-teal-700 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {user.role === 'doctor' ? <FaUserMd className="text-sm" /> : <FaHeartbeat className="text-sm" />}
            <span>{user.role === 'doctor' ? 'Clinical Credentials' : 'Health Demographics'}</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-4 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'security'
                ? 'border-teal-600 text-teal-700 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaShieldAlt className="text-sm" />
            <span>Security & Access</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`py-4 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
              activeTab === 'activity'
                ? 'border-teal-600 text-teal-700 bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaHistory className="text-sm" />
            <span>Activity & Records</span>
          </button>
        </div>
      </div>

      {/* 2. Tab Contents */}

      {/* TAB 1: General & Identity */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Personal & Contact Information</h2>
              <p className="text-xs text-slate-500">Your core profile attributes used across hospital records</p>
            </div>
            {!isEditingGeneral ? (
              <button
                type="button"
                onClick={() => setIsEditingGeneral(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <FaEdit /> Edit Details
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsEditingGeneral(false);
                  setUserFormData({
                    full_name: user.full_name || '',
                    phone: user.phone || '',
                    address: user.address || '',
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                <FaTimes /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSaveGeneral} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <FaUser className="absolute left-3.5 top-3 text-slate-400 text-sm" />
                  <input
                    type="text"
                    disabled={!isEditingGeneral}
                    value={userFormData.full_name}
                    onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                    required
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition disabled:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Primary Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3.5 top-3 text-slate-400 text-sm" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Account login email cannot be changed</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <FaPhone className="absolute left-3.5 top-3 text-slate-400 text-sm" />
                  <input
                    type="tel"
                    disabled={!isEditingGeneral}
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition disabled:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">System Access Role</label>
                <div className="relative">
                  <FaIdCard className="absolute left-3.5 top-3 text-slate-400 text-sm" />
                  <input
                    type="text"
                    disabled
                    value={`${user.role.toUpperCase()} PORTAL`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-500 font-bold cursor-not-allowed uppercase"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mailing / Clinic Address</label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3.5 top-3 text-slate-400 text-sm" />
                  <textarea
                    rows={2}
                    disabled={!isEditingGeneral}
                    value={userFormData.address}
                    onChange={(e) => setUserFormData({ ...userFormData, address: e.target.value })}
                    placeholder="Enter your street address, city, state, postal code"
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition disabled:text-slate-600"
                  />
                </div>
              </div>
            </div>

            {isEditingGeneral && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingGeneral(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  <FaSave /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 2: Clinical / Credentials Profile */}
      {activeTab === 'clinical' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {user.role === 'doctor' ? 'Medical Practice & Credentials' : 'Clinical Health Demographics'}
              </h2>
              <p className="text-xs text-slate-500">
                {user.role === 'doctor'
                  ? 'Verify clinical credentials, consultation settings, and practice availability'
                  : 'Critical clinical attributes shared with attending physicians during consultations'}
              </p>
            </div>
            {!isEditingClinical ? (
              <button
                type="button"
                onClick={() => setIsEditingClinical(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <FaEdit /> Edit {user.role === 'doctor' ? 'Credentials' : 'Demographics'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingClinical(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                <FaTimes /> Cancel
              </button>
            )}
          </div>

          {profileLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <FaSpinner className="animate-spin text-2xl text-teal-600" />
              <p className="text-xs">Loading clinical records...</p>
            </div>
          ) : user.role === 'patient' ? (
            /* Patient View & Edit Form */
            <form onSubmit={handleSavePatientClinical} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Blood Group</label>
                  <select
                    disabled={!isEditingClinical}
                    value={patientFormData.blood_group}
                    onChange={(e) => setPatientFormData({ ...patientFormData, blood_group: e.target.value })}
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                  >
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Biological Gender</label>
                  <select
                    disabled={!isEditingClinical}
                    value={patientFormData.gender}
                    onChange={(e) =>
                      setPatientFormData({
                        ...patientFormData,
                        gender: e.target.value as 'male' | 'female' | 'other',
                      })
                    }
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none transition capitalize"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other / Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Date of Birth ({calculateAge(patientFormData.date_of_birth)})
                  </label>
                  <input
                    type="date"
                    disabled={!isEditingClinical}
                    value={patientFormData.date_of_birth}
                    onChange={(e) => setPatientFormData({ ...patientFormData, date_of_birth: e.target.value })}
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Emergency Contact Name</label>
                  <input
                    type="text"
                    disabled={!isEditingClinical}
                    value={patientFormData.emergency_contact_name}
                    onChange={(e) => setPatientFormData({ ...patientFormData, emergency_contact_name: e.target.value })}
                    placeholder="e.g. Jane Doe (Spouse)"
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    disabled={!isEditingClinical}
                    value={patientFormData.emergency_contact}
                    onChange={(e) => setPatientFormData({ ...patientFormData, emergency_contact: e.target.value })}
                    placeholder="+1 (555) 999-8888"
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Known Drug & Environmental Allergies
                  </label>
                  <textarea
                    rows={3}
                    disabled={!isEditingClinical}
                    value={patientFormData.allergies}
                    onChange={(e) => setPatientFormData({ ...patientFormData, allergies: e.target.value })}
                    placeholder="e.g. Penicillin, Peanuts, Latex, Sulfa drugs"
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pre-Existing Chronic Conditions
                  </label>
                  <textarea
                    rows={3}
                    disabled={!isEditingClinical}
                    value={patientFormData.chronic_conditions}
                    onChange={(e) => setPatientFormData({ ...patientFormData, chronic_conditions: e.target.value })}
                    placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma"
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {isEditingClinical && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingClinical(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    <FaSave /> {loading ? 'Saving...' : 'Save Health Profile'}
                  </button>
                </div>
              )}
            </form>
          ) : user.role === 'doctor' ? (
            /* Doctor View & Edit Form */
            <form onSubmit={handleSaveDoctorClinical} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Medical Specialty</label>
                  <select
                    disabled={!isEditingClinical}
                    value={doctorFormData.specialty}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, specialty: e.target.value })}
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none transition capitalize"
                  >
                    {SPECIALTIES.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Qualifications & Degrees</label>
                  <input
                    type="text"
                    disabled={!isEditingClinical}
                    value={doctorFormData.qualification}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, qualification: e.target.value })}
                    placeholder="e.g. MD, FACC, MBBS"
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Medical License Number</label>
                  <input
                    type="text"
                    disabled={!isEditingClinical}
                    value={doctorFormData.license_number}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, license_number: e.target.value })}
                    placeholder="e.g. MD-992144"
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Years of Clinical Experience</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    disabled={!isEditingClinical}
                    value={doctorFormData.experience_years}
                    onChange={(e) =>
                      setDoctorFormData({ ...doctorFormData, experience_years: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Consultation Fee ($ USD)</label>
                  <input
                    type="text"
                    disabled={!isEditingClinical}
                    value={doctorFormData.consultation_fee}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, consultation_fee: e.target.value })}
                    placeholder="120.00"
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Verification Status</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs flex items-center gap-2">
                    {doctorProfile?.is_verified ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                        <FaCheckCircle /> Verified Medical Doctor
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold flex items-center gap-1.5">
                        <FaExclamationCircle /> Pending Medical Board Verification
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Practice Hours Start</label>
                  <input
                    type="time"
                    disabled={!isEditingClinical}
                    value={doctorFormData.available_time_start.slice(0, 5)}
                    onChange={(e) =>
                      setDoctorFormData({ ...doctorFormData, available_time_start: `${e.target.value}:00` })
                    }
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Practice Hours End</label>
                  <input
                    type="time"
                    disabled={!isEditingClinical}
                    value={doctorFormData.available_time_end.slice(0, 5)}
                    onChange={(e) =>
                      setDoctorFormData({ ...doctorFormData, available_time_end: `${e.target.value}:00` })
                    }
                    className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {isEditingClinical && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingClinical(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    <FaSave /> {loading ? 'Saving...' : 'Save Credentials'}
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* Admin System Information */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center gap-3">
                <FaShieldAlt className="text-teal-700 text-xl" />
                <div>
                  <p className="text-sm font-bold text-teal-900">Hospital System Administration Level</p>
                  <p className="text-xs text-teal-700">
                    Full superuser clearance for hospital roster management, compliance, and clinical auditing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Security & Access Control */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Two-Factor Authentication Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <FaShieldAlt className="text-teal-600 text-xl" />
                  <h3 className="text-lg font-bold text-slate-900">Two-Factor Authentication (2FA)</h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      user.two_factor_enabled
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {user.two_factor_enabled ? 'Active & Enforced' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Require a dynamic 6-digit TOTP code during login using authenticator apps like Google Authenticator,
                  Microsoft Authenticator, or Authy.
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
                    className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xl transition"
                  >
                    Disable 2FA
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStart2FASetup}
                    disabled={processing2FA}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                  >
                    <FaQrcode />
                    {processing2FA ? 'Initializing...' : 'Enable 2FA'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Password Management Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Account Password</h3>
                <p className="text-xs text-slate-500">Ensure your password uses a high-entropy passphrase</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="text-xs font-semibold text-teal-600 hover:underline"
              >
                {showPasswordForm ? 'Close Form' : 'Change Password'}
              </button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4 border-t border-slate-100 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Password</label>
                  <div className="relative">
                    <FaLock className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                    <input
                      type="password"
                      value={passwordData.old_password}
                      onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                      required
                      placeholder="Enter current password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <FaKey className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      required
                      placeholder="Minimum 8 characters"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                    />
                  </div>

                  {passwordData.new_password && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Strength:</span>
                        <span className="font-bold text-slate-700">{passwordStrength.label}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <FaKey className="absolute left-3.5 top-3 text-slate-400 text-xs" />
                    <input
                      type="password"
                      value={passwordData.new_password2}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password2: e.target.value })}
                      required
                      placeholder="Repeat new password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Account Audit & Session Info */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Session & Account Metadata</h3>
            <p className="text-xs text-slate-500 mb-4">Security timestamps recorded for HIPAA / regulatory compliance</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Member Since
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Last Login
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {user.last_login ? new Date(user.last_login).toLocaleString() : 'Active session'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Account Status
                </span>
                <span className="text-xs font-bold text-emerald-700 uppercase">{user.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Activity & Consultation Statistics */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Clinical Activity & History</h2>
            <p className="text-xs text-slate-500">Live operational snapshot for your registered account</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-teal-800">Consultations</span>
                <FaCalendarAlt className="text-teal-600 text-lg" />
              </div>
              <p className="text-2xl font-black text-teal-950">{activityStats.appointmentsCount}</p>
              <p className="text-[11px] text-teal-700 mt-1">Total appointments on record</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-blue-800">Prescriptions</span>
                <FaPills className="text-blue-600 text-lg" />
              </div>
              <p className="text-2xl font-black text-blue-950">{activityStats.prescriptionsCount}</p>
              <p className="text-[11px] text-blue-700 mt-1">Clinical prescriptions issued / received</p>
            </div>

            {user.role === 'doctor' && (
              <>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-amber-800">Practice Rating</span>
                    <FaStar className="text-amber-500 text-lg" />
                  </div>
                  <p className="text-2xl font-black text-amber-950">
                    {doctorProfile?.average_rating ? doctorProfile.average_rating.toFixed(1) : '5.0'} / 5.0
                  </p>
                  <p className="text-[11px] text-amber-700 mt-1">
                    {doctorProfile?.total_reviews || 0} verified patient reviews
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-emerald-800">Consultation Rate</span>
                    <FaClock className="text-emerald-600 text-lg" />
                  </div>
                  <p className="text-2xl font-black text-emerald-950">${doctorProfile?.consultation_fee || '0.00'}</p>
                  <p className="text-[11px] text-emerald-700 mt-1">Per clinical session</p>
                </div>
              </>
            )}

            {user.role === 'patient' && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-purple-800">Blood Category</span>
                  <FaNotesMedical className="text-purple-600 text-lg" />
                </div>
                <p className="text-2xl font-black text-purple-950">{patientProfile?.blood_group || 'Unset'}</p>
                <p className="text-[11px] text-purple-700 mt-1">Documented in emergency card</p>
              </div>
            )}
          </div>
        </div>
      )}

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
            <p className="text-xs text-slate-600">
              Scan the QR code below using your authenticator application (Google Authenticator, Microsoft
              Authenticator, or Authy), then enter the 6-digit confirmation code.
            </p>

            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <img
                src={setup2FAData.qr_code}
                alt="2FA QR Code"
                className="w-44 h-44 rounded-xl shadow-xs bg-white p-2 border border-slate-100"
              />
              <div className="mt-3 text-center">
                <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider block mb-1">
                  Or enter manual secret key:
                </span>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-xs font-mono bg-white px-3 py-1 rounded-lg border border-slate-200 font-bold text-slate-800 select-all">
                    {setup2FAData.secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(setup2FAData.secret);
                      toast.success('Secret key copied');
                    }}
                    className="p-1.5 text-slate-500 hover:text-teal-600 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition"
                    title="Copy Secret"
                  >
                    <FaCopy className="text-xs" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">6-Digit Verification Code</label>
              <div className="relative">
                <FaKey className="absolute left-3 top-3 text-slate-400 text-xs" />
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-mono text-center tracking-widest font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
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
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing2FA || totpCode.trim().length !== 6}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
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
          <p className="text-xs text-slate-600">
            Enter the 6-digit verification code from your authenticator app to authorize disabling 2FA.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">6-Digit Code</label>
            <div className="relative">
              <FaKey className="absolute left-3 top-3 text-slate-400 text-xs" />
              <input
                type="text"
                maxLength={6}
                value={disableTotpCode}
                onChange={(e) => setDisableTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-mono text-center tracking-widest font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
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
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing2FA || disableTotpCode.trim().length !== 6}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
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