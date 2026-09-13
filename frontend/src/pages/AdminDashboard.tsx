import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin';
import { User, Doctor } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { FaUsers, FaUserMd, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Stats {
  totalUsers: number;
  pendingDoctors: number;
  verifiedDoctors: number;
  totalDoctors: number;
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    pendingDoctors: 0,
    verifiedDoctors: 0,
    totalDoctors: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const [usersData, doctorsData] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getPendingDoctors(),
      ]);
      const users = Array.isArray(usersData) ? usersData : usersData.results || [];
      const doctors = Array.isArray(doctorsData) ? doctorsData : doctorsData.results || [];
      setUsers(users);
      setDoctors(doctors);
      
      const pendingDoctors = doctors.filter((d: Doctor) => !d.is_verified);
      const verifiedDoctors = doctors.filter((d: Doctor) => d.is_verified);
      
      setStats({
        totalUsers: Array.isArray(usersData) ? users.length : usersData.count || 0,
        pendingDoctors: pendingDoctors.length,
        verifiedDoctors: verifiedDoctors.length,
        totalDoctors: Array.isArray(doctorsData) ? doctors.length : doctorsData.count || 0,
      });
    } catch {
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };
    loadData();
  }, [fetchData]);

  const handleVerifyDoctor = async (doctorId: string, isVerified: boolean) => {
    try {
      if (!isVerified) {
        toast.error('Doctor rejection is not supported by the admin API');
        return;
      }
      await adminApi.approveDoctor(doctorId);
      toast.success(`Doctor ${isVerified ? 'verified' : 'unverified'} successfully`);
      await fetchData();
    } catch {
      toast.error('Failed to update doctor status');
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: string) => {
    try {
      await adminApi.updateUserStatus(userId, status);
      toast.success('User status updated');
      await fetchData();
    } catch {
      toast.error('Failed to update user status');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-medicare-dark mb-8">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-medicare-dark">{stats.totalUsers}</p>
            </div>
            <FaUsers className="text-3xl text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Doctors</p>
              <p className="text-2xl font-bold text-medicare-dark">{stats.totalDoctors}</p>
            </div>
            <FaUserMd className="text-3xl text-medicare-teal" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Verification</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingDoctors}</p>
            </div>
            <FaClock className="text-3xl text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified Doctors</p>
              <p className="text-2xl font-bold text-green-600">{stats.verifiedDoctors}</p>
            </div>
            <FaCheckCircle className="text-3xl text-green-500" />
          </div>
        </div>
      </div>

      {/* Pending Doctors */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-medicare-dark mb-4">Pending Doctor Verifications</h2>
        {doctors.filter(d => !d.is_verified).length === 0 ? (
          <p className="text-gray-500 text-center py-4">No pending verifications</p>
        ) : (
          <div className="space-y-4">
            {doctors.filter(d => !d.is_verified).map((doctor) => (
              <div key={doctor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{doctor.user.full_name}</p>
                  <p className="text-sm text-gray-600">{doctor.specialty}</p>
                  <p className="text-sm text-gray-500">{doctor.license_number}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerifyDoctor(doctor.id, true)}
                    className="btn-success text-sm flex items-center"
                  >
                    <FaCheckCircle className="mr-1" /> Verify
                  </button>
                  <button
                    onClick={() => handleVerifyDoctor(doctor.id, false)}
                    className="btn-danger text-sm flex items-center"
                  >
                    <FaTimesCircle className="mr-1" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-medicare-dark mb-4">Recent Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.slice(0, 10).map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {user.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${
                      user.status === 'approved' ? 'badge-success' :
                      user.status === 'pending' ? 'badge-warning' :
                      'badge-danger'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={user.status}
                      onChange={(e) => handleUpdateUserStatus(user.id, e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approve</option>
                      <option value="suspended">Suspend</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;