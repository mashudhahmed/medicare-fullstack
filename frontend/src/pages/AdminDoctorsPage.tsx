import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin';
import type { Doctor } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { FaUserMd, FaCheckCircle, FaTimesCircle, FaClock, FaIdCard, FaSyncAlt } from 'react-icons/fa';
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
      toast.success('Doctor credentials verified and approved');
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
      toast.success('Doctor verification status updated');
      await fetchPending();
    } catch {
      toast.error('Failed to update doctor verification');
    } finally {
      setActionId(null);
    }
  };

  if (loading && pending.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaUserMd className="text-teal-600" /> Pending Doctor Approvals
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review submitted clinical credentials, medical board licenses, and approve practitioners for patient consultations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <FaClock className="text-amber-600" /> {pending.length} Pending Verification
          </span>
          <button
            onClick={() => fetchPending()}
            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Refresh List"
          >
            <FaSyncAlt />
          </button>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-12 text-center text-slate-500">
          <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-2xl mx-auto mb-3 border border-teal-100">
            <FaCheckCircle />
          </div>
          <h3 className="text-base font-semibold text-slate-800">All Doctors Verified</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            There are currently no physician accounts awaiting clinical approval or credentials verification.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden w-full max-w-full min-w-0">
          <div className="overflow-x-auto w-full max-w-full table-scrollbar overscroll-x-contain">
            <table className="w-full min-w-[760px] divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Doctor Candidate</th>
                  <th className="px-6 py-3.5">Specialty</th>
                  <th className="px-6 py-3.5">License & Qualifications</th>
                  <th className="px-6 py-3.5">Experience</th>
                  <th className="px-6 py-3.5">Fee Rate</th>
                  <th className="px-6 py-3.5 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pending.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0 border border-teal-100 relative overflow-hidden">
                          <span>{doc.user?.full_name?.charAt(0) || 'D'}</span>
                          {doc.user?.profile_picture && (
                            <img
                              src={doc.user.profile_picture}
                              alt={doc.user.full_name}
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">Dr. {doc.user?.full_name ?? 'Physician'}</p>
                          <p className="text-xs text-slate-500 truncate">{doc.user?.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 capitalize">
                        {doc.specialty || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800 text-xs flex items-center gap-1.5">
                        <FaIdCard className="text-slate-400" /> {doc.license_number || 'Pending Submission'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {doc.qualification || 'Medical Graduate'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                      {doc.experience_years ? `${doc.experience_years} years` : 'New practitioner'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-900">
                      ${Number(doc.consultation_fee || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        type="button"
                        disabled={actionId === doc.id}
                        onClick={() => handleApprove(doc.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 disabled:opacity-50 transition shadow-xs"
                      >
                        <FaCheckCircle /> Approve
                      </button>
                      <button
                        type="button"
                        disabled={actionId === doc.id}
                        onClick={() => handleReject(doc.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 disabled:opacity-50 transition"
                      >
                        <FaTimesCircle /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDoctorsPage;
