import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../api/admin';
import type { User, AdminUserDetail } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  FaUsers,
  FaSearch,
  FaUserInjured,
  FaUserMd,
  FaShieldAlt,
  FaTimes,
  FaFilter,
  FaSyncAlt,
  FaEye,
  FaCalendarAlt,
  FaClock,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaHeartbeat,
  FaNotesMedical,
  FaCheckCircle,
  FaStar,
  FaTint,
  FaCopy,
  FaHistory,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminUsersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Profile Modal State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get('view') || null);
  const [activeUserDetail, setActiveUserDetail] = useState<AdminUserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [modalTab, setModalTab] = useState<'overview' | 'demographics' | 'activity'>('overview');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      const data = await adminApi.getUsers(params);
      const list = Array.isArray(data) ? data : (data as { results?: User[] }).results || [];
      setUsers(list);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch full user profile details when modal is triggered
  const fetchUserDetail = useCallback(async (userId: string) => {
    try {
      setLoadingDetail(true);
      const detail = await adminApi.getUser(userId);
      setActiveUserDetail(detail);
    } catch {
      toast.error('Failed to load comprehensive profile details');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserDetail(selectedUserId);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('view', selectedUserId);
        return next;
      });
    } else {
      setActiveUserDetail(null);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('view');
        return next;
      });
    }
  }, [selectedUserId, fetchUserDetail, setSearchParams]);

  // Keyboard navigation listener (Escape key to close modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedUserId(null);
      }
    };
    if (selectedUserId) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedUserId]);

  const handleStatusChange = async (userId: string, status: string) => {
    try {
      setUpdatingId(userId);
      await adminApi.updateUserStatus(userId, status);
      toast.success('User status updated');

      // Update local state if active in modal
      if (activeUserDetail && activeUserDetail.id === userId) {
        setActiveUserDetail({
          ...activeUserDetail,
          status: status as User['status'],
        });
      }

      await fetchUsers();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = !roleFilter || u.role === roleFilter;
    const query = search.toLowerCase().trim();
    if (!query) return matchesRole;
    return (
      matchesRole &&
      (u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        (u.phone && u.phone.toLowerCase().includes(query)))
    );
  });

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('');
  };

  const hasActiveFilters = search.trim() !== '' || roleFilter !== '';

  const totalPatients = users.filter((u) => u.role === 'patient').length;
  const totalDoctors = users.filter((u) => u.role === 'doctor').length;
  const totalAdmins = users.filter((u) => u.role === 'admin').length;

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <FaShieldAlt className="text-[10px]" /> Admin
          </span>
        );
      case 'doctor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <FaUserMd className="text-[10px]" /> Doctor
          </span>
        );
      case 'patient':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <FaUserInjured className="text-[10px]" /> Patient
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FaCheckCircle className="text-[10px]" /> Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <FaClock className="text-[10px]" /> Pending
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Suspended
          </span>
        );
      case 'rejected':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const calculateAge = (dobString?: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  if (loading && users.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaUsers className="text-teal-600" /> Users Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage user accounts, inspect clinical profiles, verify credentials, and regulate platform access.
          </p>
        </div>

        {/* Quick Stats Counter */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs text-center min-w-[70px]">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total</span>
            <span className="text-sm font-bold text-slate-800">{users.length}</span>
          </div>
          <div className="bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl shadow-xs text-center min-w-[70px]">
            <span className="text-[10px] text-sky-600 uppercase font-bold block">Patients</span>
            <span className="text-sm font-bold text-sky-800">{totalPatients}</span>
          </div>
          <div className="bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl shadow-xs text-center min-w-[70px]">
            <span className="text-[10px] text-teal-600 uppercase font-bold block">Doctors</span>
            <span className="text-sm font-bold text-teal-800">{totalDoctors}</span>
          </div>
          <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl shadow-xs text-center min-w-[70px]">
            <span className="text-[10px] text-purple-600 uppercase font-bold block">Admins</span>
            <span className="text-sm font-bold text-purple-800">{totalAdmins}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search by full name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition min-h-[44px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-44 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition min-h-[44px]"
          >
            <option value="">All Roles</option>
            <option value="patient">Patients</option>
            <option value="doctor">Doctors</option>
            <option value="admin">Administrators</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition shrink-0 min-h-[44px]"
              title="Reset Filters"
            >
              <FaTimes /> Clear
            </button>
          )}

          <button
            onClick={() => fetchUsers()}
            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Refresh Users"
          >
            <FaSyncAlt />
          </button>
        </div>
      </div>

      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
        </span>
        {hasActiveFilters && (
          <span className="flex items-center gap-1 text-teal-600 font-medium">
            <FaFilter className="text-[10px]" /> Filtered results
          </span>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden w-full max-w-full min-w-0">
        <div className="overflow-x-auto w-full max-w-full table-scrollbar overscroll-x-contain">
          <table className="w-full min-w-[760px] divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">User Details</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Contact Phone</th>
                <th className="px-6 py-3.5">Registered</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-slate-400">
                    <FaUsers className="text-4xl mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No users found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search criteria or clearing filters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div
                        onClick={() => setSelectedUserId(u.id)}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-100 relative overflow-hidden group-hover:border-teal-400 transition">
                          <span>{u.full_name?.charAt(0) || 'U'}</span>
                          {u.profile_picture && (
                            <img
                              src={u.profile_picture}
                              alt={u.full_name}
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 group-hover:text-teal-700 transition truncate">
                            {u.full_name || 'Unnamed User'}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(u.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                      {u.phone || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUserId(u.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition shadow-2xs"
                          title="View Comprehensive Profile"
                        >
                          <FaEye className="text-xs text-teal-600" /> View Profile
                        </button>
                        <select
                          value={u.status}
                          disabled={updatingId === u.id}
                          onChange={(e) => handleStatusChange(u.id, e.target.value)}
                          className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 hover:border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none transition disabled:opacity-50"
                        >
                          <option value="pending">Set Pending</option>
                          <option value="approved">Set Approved</option>
                          <option value="suspended">Set Suspended</option>
                          <option value="rejected">Set Rejected</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Executive Clinical Profile Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/60">
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center text-xl font-bold shrink-0 relative overflow-hidden shadow-xs">
                  <span>{activeUserDetail?.full_name?.charAt(0) || 'U'}</span>
                  {activeUserDetail?.profile_picture && (
                    <img
                      src={activeUserDetail.profile_picture}
                      alt={activeUserDetail.full_name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                      {activeUserDetail?.full_name || 'User Profile'}
                    </h2>
                    {activeUserDetail && getRoleBadge(activeUserDetail.role)}
                    {activeUserDetail && getStatusBadge(activeUserDetail.status)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <FaEnvelope className="text-slate-400 text-[10px]" /> {activeUserDetail?.email}
                    </span>
                    {activeUserDetail?.phone && (
                      <span className="flex items-center gap-1.5">
                        <FaPhone className="text-slate-400 text-[10px]" /> {activeUserDetail.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeUserDetail && (
                  <select
                    value={activeUserDetail.status}
                    disabled={updatingId === activeUserDetail.id}
                    onChange={(e) => handleStatusChange(activeUserDetail.id, e.target.value)}
                    className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 hover:border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none transition disabled:opacity-50"
                  >
                    <option value="pending">Status: Pending</option>
                    <option value="approved">Status: Approved</option>
                    <option value="suspended">Status: Suspended</option>
                    <option value="rejected">Status: Rejected</option>
                  </select>
                )}
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  title="Close Profile (Esc)"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>
            </div>

            {/* Modal Tabs Bar */}
            <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 border-b border-slate-200 bg-white shrink-0 overflow-x-auto">
              <button
                onClick={() => setModalTab('overview')}
                className={`pb-3 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                  modalTab === 'overview'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FaIdCard className="text-xs" /> General & Identity
              </button>
              <button
                onClick={() => setModalTab('demographics')}
                className={`pb-3 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                  modalTab === 'demographics'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FaNotesMedical className="text-xs" /> Clinical Demographics
              </button>
              <button
                onClick={() => setModalTab('activity')}
                className={`pb-3 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                  modalTab === 'activity'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FaHistory className="text-xs" /> Activity & Consultations
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto overflow-x-hidden space-y-6 text-sm flex-1">
              {loadingDetail || !activeUserDetail ? (
                <div className="py-16 text-center">
                  <LoadingSpinner />
                  <p className="text-xs text-slate-500 mt-2 font-medium">Retrieving comprehensive clinical records...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: General & Identity */}
                  {modalTab === 'overview' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Full Legal Name
                          </span>
                          <span className="font-semibold text-slate-800 mt-0.5 block">
                            {activeUserDetail.full_name || 'Not provided'}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Account Email
                          </span>
                          <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                            {activeUserDetail.email}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Contact Phone
                          </span>
                          <span className="font-semibold text-slate-800 mt-0.5 block">
                            {activeUserDetail.phone || 'Not provided'}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Residential Address
                          </span>
                          <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                            {activeUserDetail.address || 'No address registered'}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 sm:col-span-2 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Platform User Identifier (UUID)
                            </span>
                            <span className="font-mono text-xs text-slate-700 mt-0.5 block truncate">
                              {activeUserDetail.id}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopy(activeUserDetail.id, 'User ID')}
                            className="p-2 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 transition shrink-0"
                            title="Copy UUID"
                          >
                            <FaCopy className="text-xs" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <FaShieldAlt className="text-teal-600" /> Security & Account Credentials
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 block font-medium">Two-Factor Authentication</span>
                            <span
                              className={`font-semibold inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md ${
                                activeUserDetail.two_factor_enabled
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {activeUserDetail.two_factor_enabled ? 'Active (TOTP)' : 'Disabled'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Registered Date</span>
                            <span className="font-semibold text-slate-800 mt-1 block">
                              {activeUserDetail.created_at
                                ? new Date(activeUserDetail.created_at).toLocaleDateString()
                                : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Last Login</span>
                            <span className="font-semibold text-slate-800 mt-1 block">
                              {activeUserDetail.last_login
                                ? new Date(activeUserDetail.last_login).toLocaleString()
                                : 'Never logged in'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Clinical / Professional Demographics */}
                  {modalTab === 'demographics' && (
                    <div className="space-y-5">
                      {activeUserDetail.role === 'patient' && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Date of Birth
                              </span>
                              <span className="font-semibold text-slate-800 mt-0.5 block">
                                {activeUserDetail.patient_profile?.date_of_birth || 'Not recorded'}
                              </span>
                              {activeUserDetail.patient_profile?.date_of_birth && (
                                <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                                  {calculateAge(activeUserDetail.patient_profile.date_of_birth)} years old
                                </span>
                              )}
                            </div>

                            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Gender
                              </span>
                              <span className="font-semibold text-slate-800 mt-0.5 block capitalize">
                                {activeUserDetail.patient_profile?.gender || 'Not specified'}
                              </span>
                            </div>

                            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Blood Group
                              </span>
                              {activeUserDetail.patient_profile?.blood_group ? (
                                <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200">
                                  <FaTint className="text-[10px]" /> {activeUserDetail.patient_profile.blood_group}
                                </span>
                              ) : (
                                <span className="font-semibold text-slate-500 mt-0.5 block">Not recorded</span>
                              )}
                            </div>
                          </div>

                          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <FaPhone className="text-teal-600 text-xs" /> Emergency Contact
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-2">
                              <div>
                                <span className="text-slate-400 block font-medium">Contact Person</span>
                                <span className="font-semibold text-slate-800 mt-0.5 block">
                                  {activeUserDetail.patient_profile?.emergency_contact_name || 'Not provided'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium">Emergency Phone</span>
                                <span className="font-semibold text-slate-800 mt-0.5 block">
                                  {activeUserDetail.patient_profile?.emergency_contact || 'Not provided'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-slate-200 bg-white">
                              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                <FaHeartbeat className="text-rose-500 text-xs" /> Documented Allergies
                              </h4>
                              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 min-h-[60px] leading-relaxed">
                                {activeUserDetail.patient_profile?.allergies || 'No allergies recorded in medical profile.'}
                              </p>
                            </div>

                            <div className="p-4 rounded-xl border border-slate-200 bg-white">
                              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                <FaNotesMedical className="text-amber-500 text-xs" /> Chronic Conditions
                              </h4>
                              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 min-h-[60px] leading-relaxed">
                                {activeUserDetail.patient_profile?.chronic_conditions || 'No chronic conditions reported.'}
                              </p>
                            </div>
                          </div>
                        </>
                      )}

                      {activeUserDetail.role === 'doctor' && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Clinical Specialty
                              </span>
                              <span className="font-semibold text-slate-800 mt-0.5 block capitalize">
                                {activeUserDetail.doctor_profile?.specialty || 'General Medicine'}
                              </span>
                            </div>

                            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Medical License
                              </span>
                              <span className="font-mono text-xs font-semibold text-slate-800 mt-0.5 block">
                                {activeUserDetail.doctor_profile?.license_number || 'Pending'}
                              </span>
                              <span
                                className={`text-[10px] font-semibold mt-1 inline-flex px-1.5 py-0.5 rounded ${
                                  activeUserDetail.doctor_profile?.is_verified
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {activeUserDetail.doctor_profile?.is_verified ? 'Verified Practitioner' : 'Pending Verification'}
                              </span>
                            </div>

                            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Consultation Fee
                              </span>
                              <span className="font-semibold text-slate-800 mt-0.5 block">
                                ${activeUserDetail.doctor_profile?.consultation_fee || '0.00'}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Credentials & Qualifications
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-slate-400 block font-medium">Academic Qualifications</span>
                                <span className="font-semibold text-slate-800 mt-0.5 block">
                                  {activeUserDetail.doctor_profile?.qualification || 'Not provided'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium">Clinical Experience</span>
                                <span className="font-semibold text-slate-800 mt-0.5 block">
                                  {activeUserDetail.doctor_profile?.experience_years || 0} years in practice
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Available Consultation Hours
                              </span>
                              <span className="font-semibold text-slate-800 mt-0.5 block text-xs">
                                {activeUserDetail.doctor_profile?.available_time_start || '09:00'} -{' '}
                                {activeUserDetail.doctor_profile?.available_time_end || '17:00'}
                              </span>
                            </div>

                            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Patient Satisfaction Rating
                              </span>
                              <span className="font-semibold text-slate-800 mt-0.5 inline-flex items-center gap-1 text-xs">
                                <FaStar className="text-amber-500 text-xs" />{' '}
                                {activeUserDetail.doctor_profile?.average_rating || 0} / 5.0 (
                                {activeUserDetail.doctor_profile?.total_reviews || 0} reviews)
                              </span>
                            </div>
                          </div>
                        </>
                      )}

                      {activeUserDetail.role === 'admin' && (
                        <div className="p-6 rounded-xl border border-purple-200 bg-purple-50/30 text-center space-y-2">
                          <FaShieldAlt className="text-3xl text-purple-600 mx-auto" />
                          <h4 className="text-sm font-bold text-slate-800">Executive Administrator</h4>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            This user possesses full executive administrative privileges, including practitioner licensing approvals, audit log access, database management, and system telemetry controls.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: Activity & Consultations */}
                  {modalTab === 'activity' && (
                    <div className="space-y-5">
                      {/* Metric summary counters */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Visits</span>
                          <span className="text-base font-bold text-slate-800">
                            {activeUserDetail.activity_summary?.total_appointments || 0}
                          </span>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-emerald-600 uppercase font-bold block">Completed</span>
                          <span className="text-base font-bold text-emerald-800">
                            {activeUserDetail.activity_summary?.completed_appointments || 0}
                          </span>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-amber-600 uppercase font-bold block">Pending</span>
                          <span className="text-base font-bold text-amber-800">
                            {activeUserDetail.activity_summary?.pending_appointments || 0}
                          </span>
                        </div>
                        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-rose-600 uppercase font-bold block">Cancelled</span>
                          <span className="text-base font-bold text-rose-800">
                            {activeUserDetail.activity_summary?.cancelled_appointments || 0}
                          </span>
                        </div>
                      </div>

                      {/* Additional counters for patients */}
                      {activeUserDetail.role === 'patient' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Medical Records on File:</span>
                            <span className="font-bold text-slate-800">
                              {activeUserDetail.activity_summary?.total_medical_records || 0} records
                            </span>
                          </div>
                          <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Invoices & Billings:</span>
                            <span className="font-bold text-slate-800">
                              {activeUserDetail.activity_summary?.total_invoices || 0} invoices
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Recent consultations timeline */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <FaCalendarAlt className="text-teal-600" /> Recent Consultation Logs
                        </h4>

                        {!activeUserDetail.activity_summary?.recent_appointments ||
                        activeUserDetail.activity_summary.recent_appointments.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
                            <FaCalendarAlt className="text-2xl mx-auto mb-2 text-slate-300" />
                            No clinical appointment history recorded for this user account.
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                            {activeUserDetail.activity_summary.recent_appointments.map((appt) => (
                              <div
                                key={appt.id}
                                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/50 transition text-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-800">{appt.partner_name}</span>
                                    {appt.specialty && (
                                      <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded capitalize">
                                        {appt.specialty}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-500 mt-0.5 text-[11px]">{appt.reason || 'No visit reason specified'}</p>
                                </div>
                                <div className="flex items-center gap-2 sm:text-right shrink-0">
                                  <span className="text-slate-400 text-[11px]">
                                    {appt.appointment_date ? new Date(appt.appointment_date).toLocaleDateString() : '—'}
                                  </span>
                                  {getStatusBadge(appt.status)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-400">
                Medicare Administrative Registry Console
              </span>
              <button
                onClick={() => setSelectedUserId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
