import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin';
import { User, Doctor, AdminAnalyticsData } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  FaUsers,
  FaUserMd,
  FaCheckCircle,
  FaTimesCircle,
  FaDownload,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaStar,
} from 'react-icons/fa';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
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
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    pendingDoctors: 0,
    verifiedDoctors: 0,
    totalDoctors: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const [usersData, doctorsData, analyticsData] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getPendingDoctors(),
        adminApi.getAnalytics().catch(() => null),
      ]);
      const loadedUsers = Array.isArray(usersData) ? usersData : usersData.results || [];
      const loadedDoctors = Array.isArray(doctorsData) ? doctorsData : doctorsData.results || [];
      setUsers(loadedUsers);
      setDoctors(loadedDoctors);

      if (analyticsData) {
        setAnalytics(analyticsData);
      }

      const pendingDoctors = loadedDoctors.filter((d: Doctor) => !d.is_verified);
      const verifiedDoctors = loadedDoctors.filter((d: Doctor) => d.is_verified);

      setStats({
        totalUsers: Array.isArray(usersData) ? loadedUsers.length : usersData.count || 0,
        pendingDoctors: pendingDoctors.length,
        verifiedDoctors: verifiedDoctors.length,
        totalDoctors: Array.isArray(doctorsData) ? loadedDoctors.length : doctorsData.count || 0,
      });
    } catch {
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
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

  const handleExport = async (type: 'appointments' | 'billing' | 'patients' | 'doctors') => {
    try {
      setExporting(type);
      if (type === 'appointments') {
        await adminApi.exportAppointments();
      } else if (type === 'billing') {
        await adminApi.exportBilling();
      } else if (type === 'patients') {
        await adminApi.exportPatients();
      } else if (type === 'doctors') {
        await adminApi.exportDoctors();
      }
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} CSV exported successfully`);
    } catch {
      toast.error(`Failed to export ${type} data`);
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const summary = analytics?.summary;

  return (
    <div className="space-y-8">
      {/* Top Header & Export Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-medicare-dark">Hospital Administration & Analytics</h1>
          <p className="text-gray-600 mt-1">Clinical operations, financials, staff verification, and data exports</p>
        </div>
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Patients</p>
              <p className="text-2xl font-bold text-medicare-dark mt-1">
                {summary?.total_patients ?? stats.totalUsers}
              </p>
              <p className="text-xs text-gray-500 mt-1">Registered healthcare clients</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FaUsers className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Doctors</p>
              <p className="text-2xl font-bold text-medicare-dark mt-1">
                {summary?.verified_doctors ?? stats.verifiedDoctors}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                {summary?.pending_doctors ?? stats.pendingDoctors} pending verification
              </p>
            </div>
            <div className="p-3 bg-teal-50 text-medicare-teal rounded-xl">
              <FaUserMd className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Consultations</p>
              <p className="text-2xl font-bold text-medicare-dark mt-1">
                {summary?.total_appointments ?? 0}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {summary?.completed_appointments ?? 0} completed
              </p>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <FaCalendarAlt className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Collected Revenue</p>
              <p className="text-2xl font-bold text-medicare-dark mt-1">
                ${(summary?.total_revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                ${(summary?.pending_revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} pending
              </p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <FaFileInvoiceDollar className="text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Activity Trend */}
        <div className="bg-white rounded-xl shadow p-6 min-w-0">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-medicare-dark">Monthly Operational Activity</h2>
            <p className="text-xs text-gray-500">Consultation volume and paid revenue over the past 6 months</p>
          </div>
          {analytics?.monthly_trends && analytics.monthly_trends.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAppts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" stroke="#0d9488" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#0284c7" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any, name?: any) => [
                      name === 'revenue' ? `$${Number(value).toFixed(2)}` : value,
                      name === 'revenue' ? 'Revenue' : 'Appointments',
                    ]}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="appointments"
                    stroke="#0d9488"
                    fillOpacity={1}
                    fill="url(#colorAppts)"
                    name="Appointments"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0284c7"
                    fillOpacity={1}
                    fill="url(#colorRev)"
                    name="Revenue ($)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400">
              No trend data available
            </div>
          )}
        </div>

        {/* Clinical Specialty Distribution */}
        <div className="bg-white rounded-xl shadow p-6 min-w-0">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-medicare-dark">Clinical Specialty Breakdown</h2>
            <p className="text-xs text-gray-500">Distribution of licensed medical doctors across specialties</p>
          </div>
          {analytics?.specialty_distribution && analytics.specialty_distribution.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.specialty_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="specialty"
                    stroke="#9ca3af"
                    tick={{ fontSize: 10 }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis stroke="#9ca3af" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} name="Doctors" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400">
              No specialty data available
            </div>
          )}
        </div>
      </div>

      {/* Data Export & Reporting Center */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-medicare-dark">Executive Data Export Center</h2>
          <p className="text-xs text-gray-500">
            Export hospital datasets as structured CSV spreadsheets for audits, reporting, and operational records
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-gray-100 bg-gray-50 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Appointments</p>
              <p className="text-xs text-gray-500 mt-1">
                Consultation schedules, statuses, doctor assignments, and reminder timestamps.
              </p>
            </div>
            <button
              onClick={() => handleExport('appointments')}
              disabled={exporting !== null}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-white hover:bg-teal-50 text-medicare-teal border border-medicare-teal font-medium py-2 px-3 rounded-lg text-xs transition disabled:opacity-50"
            >
              <FaDownload />
              {exporting === 'appointments' ? 'Exporting...' : 'Export Appointments (CSV)'}
            </button>
          </div>

          <div className="border border-gray-100 bg-gray-50 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Invoices & Billing</p>
              <p className="text-xs text-gray-500 mt-1">
                Invoice numbers, total amounts, taxes, discounts, payment status, and due dates.
              </p>
            </div>
            <button
              onClick={() => handleExport('billing')}
              disabled={exporting !== null}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-white hover:bg-blue-50 text-blue-600 border border-blue-600 font-medium py-2 px-3 rounded-lg text-xs transition disabled:opacity-50"
            >
              <FaDownload />
              {exporting === 'billing' ? 'Exporting...' : 'Export Billing (CSV)'}
            </button>
          </div>

          <div className="border border-gray-100 bg-gray-50 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Patient Registry</p>
              <p className="text-xs text-gray-500 mt-1">
                Patient roster, blood groups, emergency contacts, allergy profiles, and join dates.
              </p>
            </div>
            <button
              onClick={() => handleExport('patients')}
              disabled={exporting !== null}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-600 font-medium py-2 px-3 rounded-lg text-xs transition disabled:opacity-50"
            >
              <FaDownload />
              {exporting === 'patients' ? 'Exporting...' : 'Export Patients (CSV)'}
            </button>
          </div>

          <div className="border border-gray-100 bg-gray-50 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Doctor Medical Staff</p>
              <p className="text-xs text-gray-500 mt-1">
                Practitioner specialties, licenses, consultation fees, verification, and ratings.
              </p>
            </div>
            <button
              onClick={() => handleExport('doctors')}
              disabled={exporting !== null}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-white hover:bg-purple-50 text-purple-600 border border-purple-600 font-medium py-2 px-3 rounded-lg text-xs transition disabled:opacity-50"
            >
              <FaDownload />
              {exporting === 'doctors' ? 'Exporting...' : 'Export Doctors (CSV)'}
            </button>
          </div>
        </div>
      </div>

      {/* Doctor Rating & Quality KPI Banner */}
      {summary && summary.total_reviews > 0 && (
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-white rounded-lg">
              <FaStar className="text-xl" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Average Clinical Staff Rating: {summary.average_doctor_rating.toFixed(1)} / 5.0
              </p>
              <p className="text-xs text-gray-600">
                Aggregated from {summary.total_reviews} verified patient reviews
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            System status: All health telemetry and logging active
          </div>
        </div>
      )}

      {/* Pending Doctor Verifications */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-medicare-dark mb-4">Pending Doctor Verifications</h2>
        {doctors.filter((d) => !d.is_verified).length === 0 ? (
          <p className="text-gray-500 text-center py-4">No pending verifications</p>
        ) : (
          <div className="space-y-4">
            {doctors
              .filter((d) => !d.is_verified)
              .map((doctor) => (
                <div key={doctor.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{doctor.user.full_name}</p>
                    <p className="text-sm text-gray-600">{doctor.specialty}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{doctor.license_number}</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleVerifyDoctor(doctor.id, true)}
                      className="btn-success text-sm flex items-center justify-center flex-1 sm:flex-initial"
                    >
                      <FaCheckCircle className="mr-1" /> Verify
                    </button>
                    <button
                      onClick={() => handleVerifyDoctor(doctor.id, false)}
                      className="btn-danger text-sm flex items-center justify-center flex-1 sm:flex-initial"
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
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-medicare-dark mb-4">Recent Users</h2>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="min-w-[640px] w-full divide-y divide-gray-200">
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
                    <span
                      className={`badge ${
                        user.status === 'approved'
                          ? 'badge-success'
                          : user.status === 'pending'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
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