import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin';
import type { Doctor } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { FaUserMd, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminDoctorsPage: React.FC = () => {
  const [pending, setPending] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getPendingDoctors();
      const list = Array.isArray(data) ? data : (data as { results?: Doctor[] }).results || [];
      setPending(list);
    } catch {
      toast.error('Failed to load pending doctors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (doctorId: string) => {
    try {
      setActionId(doctorId);
      await adminApi.approveDoctor(doctorId, true);
      toast.success('Doctor approved successfully');
      await fetchPending();
    } catch {
      toast.error('Failed to approve doctor');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (doctorId: string) => {
    try {
      setActionId(doctorId);
      await adminApi.verifyDoctor(doctorId, false);
      toast.success('Doctor verification revoked');
      await fetchPending();
    } catch {
      toast.error('Failed to update doctor');
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-medicare-dark">Pending Doctors</h1>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
          <FaClock /> {pending.length} pending
        </span>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center text-gray-500">
          <FaUserMd className="mx-auto text-5xl mb-4 text-gray-300" />
          <p className="text-lg">No doctors waiting for verification.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Experience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pending.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {doc.user?.full_name ?? '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.user?.email ?? '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {doc.specialty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.license_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.experience_years} yrs
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      type="button"
                      disabled={actionId === doc.id}
                      onClick={() => handleApprove(doc.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      <FaCheckCircle /> Approve
                    </button>
                    <button
                      type="button"
                      disabled={actionId === doc.id}
                      onClick={() => handleReject(doc.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 disabled:opacity-50"
                    >
                      <FaTimesCircle /> Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDoctorsPage;
