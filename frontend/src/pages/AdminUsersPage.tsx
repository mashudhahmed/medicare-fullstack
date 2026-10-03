import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin';
import type { User } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { FaUsers, FaSearch, FaUserInjured, FaUserMd, FaShieldAlt, FaTimes, FaFilter, FaSyncAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

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

  const handleStatusChange = async (userId: string, status: string) => {
    try {
      setUpdatingId(userId);
      await adminApi.updateUserStatus(userId, status);
      toast.success('User status updated');
      await fetchUsers();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
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
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Pending
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Suspended
          </span>
        );
      case 'rejected':
      default:
        return (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  if (loading && users.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaUsers className="text-teal-600" /> Users Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage user accounts, authentication access, assigned roles, and account statuses.
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

      {/* Users Table with Responsive Horizontal Scroll Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">User Details</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Contact Phone</th>
                <th className="px-6 py-3.5">Registered</th>
                <th className="px-6 py-3.5 text-right">Access Action</th>
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
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-100 relative overflow-hidden">
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
                          <p className="font-semibold text-slate-900 truncate">{u.full_name || 'Unnamed User'}</p>
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
