import React, { useState, useEffect, useCallback } from 'react';
import { prescriptionsApi } from '../api/prescriptions';
import { patientsApi } from '../api/patients';
import { Prescription, Patient, CreatePrescriptionData, DrugSafetyEvaluation } from '../types';
import { useAuth } from '../hooks/useAuth';
import {
  FaPills,
  FaPlus,
  FaSearch,
  FaSyncAlt,
  FaUserMd,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaTrash,
  FaInfoCircle,
  FaFilePdf,
  FaExclamationTriangle,
  FaCheckCircle,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Modal, ConfirmModal, SearchableSelect } from '../components/ui';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-12" role="status" aria-label="Loading">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-medicare-primary border-t-transparent" />
  </div>
);

const PrescriptionsPage: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [refillPrescriptionId, setRefillPrescriptionId] = useState<string | null>(null);
  const [deletingPrescriptionId, setDeletingPrescriptionId] = useState<string | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  // Form state for issuing prescription
  const [formData, setFormData] = useState<CreatePrescriptionData>({
    patient: '',
    medication_name: '',
    dosage: '',
    frequency: '',
    duration_days: 7,
    instructions: '',
    refills_allowed: 0,
    acknowledge_warnings: false,
    override_reason: '',
  });

  // Real-time Drug Safety Check States
  const [safetyEvaluation, setSafetyEvaluation] = useState<DrugSafetyEvaluation | null>(null);
  const [checkingSafety, setCheckingSafety] = useState(false);
  const [acknowledgeWarnings, setAcknowledgeWarnings] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await prescriptionsApi.getAll();
      setPrescriptions(Array.isArray(data) ? data : data.results || []);
    } catch {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const data = await patientsApi.getAll();
      setPatients(Array.isArray(data) ? data : data.results || []);
    } catch {
      console.error('Failed to load patients');
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
    if (user?.role === 'doctor' || user?.role === 'admin') {
      fetchPatients();
    }
  }, [fetchPrescriptions, fetchPatients, user?.role]);

  // Real-time Drug Safety Check Effect
  useEffect(() => {
    if (!formData.patient || !formData.medication_name || formData.medication_name.trim().length < 3) {
      setSafetyEvaluation(null);
      setAcknowledgeWarnings(false);
      setOverrideReason('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingSafety(true);
        const res = await prescriptionsApi.checkSafety(formData.patient, formData.medication_name);
        setSafetyEvaluation(res);
      } catch (err) {
        console.error('Safety check failed', err);
      } finally {
        setCheckingSafety(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [formData.patient, formData.medication_name]);

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient || !formData.medication_name || !formData.dosage || !formData.frequency) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Safety check constraint
    if (safetyEvaluation && !safetyEvaluation.is_safe && !acknowledgeWarnings) {
      toast.error('Critical drug hazard detected. Review warnings and confirm clinical override.');
      return;
    }

    if (safetyEvaluation && !safetyEvaluation.is_safe && !overrideReason.trim()) {
      toast.error('Please enter a clinical override justification to proceed.');
      return;
    }

    setSubmitting(true);
    try {
      await prescriptionsApi.create({
        ...formData,
        duration_days: Number(formData.duration_days) || 7,
        refills_allowed: Number(formData.refills_allowed) || 0,
        acknowledge_warnings: acknowledgeWarnings,
        override_reason: overrideReason.trim(),
      });
      toast.success('Prescription issued successfully');
      setShowIssueModal(false);
      setFormData({
        patient: '',
        medication_name: '',
        dosage: '',
        frequency: '',
        duration_days: 7,
        instructions: '',
        refills_allowed: 0,
        acknowledge_warnings: false,
        override_reason: '',
      });
      setSafetyEvaluation(null);
      setAcknowledgeWarnings(false);
      setOverrideReason('');
      fetchPrescriptions();
    } catch (error: unknown) {
      const responseData =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: any } }).response?.data
          : undefined;
      const message =
        responseData?.safety_warning ||
        responseData?.error ||
        responseData?.message ||
        'Failed to issue prescription';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRefill = async () => {
    if (!refillPrescriptionId) return;
    try {
      await prescriptionsApi.refill(refillPrescriptionId);
      toast.success('Refill request submitted successfully');
      setRefillPrescriptionId(null);
      fetchPrescriptions();
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(message || 'Failed to request refill');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPrescriptionId) return;
    try {
      await prescriptionsApi.delete(deletingPrescriptionId);
      toast.success('Prescription deleted');
      setDeletingPrescriptionId(null);
      fetchPrescriptions();
    } catch {
      toast.error('Failed to delete prescription');
    }
  };

  const handleDownloadPdf = async (prescription: Prescription) => {
    try {
      toast.loading('Generating official PDF...', { id: 'pdf-toast' });
      const filename = `Prescription_${prescription.medication_name.replace(/\s+/g, '_')}_${prescription.id.slice(0, 8)}.pdf`;
      await prescriptionsApi.downloadPdf(prescription.id, filename);
      toast.success('Prescription downloaded successfully', { id: 'pdf-toast' });
    } catch {
      toast.error('Failed to download prescription PDF', { id: 'pdf-toast' });
    }
  };

  const filteredPrescriptions = prescriptions.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      p.medication_name.toLowerCase().includes(query) ||
      (p.doctor_name && p.doctor_name.toLowerCase().includes(query)) ||
      (p.patient_name && p.patient_name.toLowerCase().includes(query)) ||
      (p.instructions && p.instructions.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Active</span>;
      case 'completed':
        return <span className="badge badge-info">Completed</span>;
      case 'cancelled':
        return <span className="badge badge-danger">Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-sm text-gray-500">
            {user?.role === 'patient'
              ? 'View and manage your prescribed medications and refills'
              : user?.role === 'doctor'
              ? 'Manage and issue medical prescriptions to your patients'
              : 'System-wide prescription directory and refill tracker'}
          </p>
        </div>
        {user?.role === 'doctor' && (
          <button
            onClick={() => setShowIssueModal(true)}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto"
          >
            <FaPlus />
            Issue Prescription
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by medication, patient, doctor, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-40"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={() => fetchPrescriptions()}
            className="p-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 transition"
            title="Refresh"
          >
            <FaSyncAlt />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredPrescriptions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-teal-50 text-medicare-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <FaPills />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">No Prescriptions Found</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'No prescriptions match your current search and filter criteria.'
              : 'There are no prescriptions recorded in the system yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPrescriptions.map((p) => {
            const canRefill =
              p.status === 'active' &&
              p.can_refill !== false &&
              p.refills_used < p.refills_allowed;

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 text-medicare-primary flex items-center justify-center text-xl shrink-0">
                        <FaPills />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 leading-tight">
                          {p.medication_name}
                        </h3>
                        <p className="text-xs text-gray-500">{p.dosage}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(p.status)}
                      {p.has_safety_warning && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <FaExclamationTriangle className="text-[9px]" /> Safety Override
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 my-3">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-gray-400 text-xs shrink-0" />
                      <span className="text-xs">Frequency: <strong>{p.frequency}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-400 text-xs shrink-0" />
                      <span className="text-xs">
                        Duration: <strong>{p.duration_days || p.duration || 7} days</strong>
                      </span>
                    </div>
                    {(user?.role === 'doctor' || user?.role === 'admin') && p.patient_name && (
                      <div className="flex items-center gap-2">
                        <FaUser className="text-gray-400 text-xs shrink-0" />
                        <span className="text-xs">
                          Patient: <strong>{p.patient_name}</strong>
                        </span>
                      </div>
                    )}
                    {user?.role === 'patient' && p.doctor_name && (
                      <div className="flex items-center gap-2">
                        <FaUserMd className="text-gray-400 text-xs shrink-0" />
                        <span className="text-xs">
                          Doctor: <strong>Dr. {p.doctor_name}</strong>
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-500">Refills:</span>
                      <span className="font-semibold text-gray-700">
                        {p.refills_used} / {p.refills_allowed} used
                      </span>
                    </div>

                    {p.instructions && (
                      <div className="bg-gray-50 p-2.5 rounded-lg text-xs text-gray-600 mt-2 line-clamp-2">
                        <span className="font-medium text-gray-700">Instructions:</span>{' '}
                        {p.instructions}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPrescription(p)}
                      className="text-xs text-medicare-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <FaInfoCircle /> Details
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(p)}
                      className="text-xs text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded flex items-center gap-1 font-medium transition"
                      title="Download Official PDF"
                    >
                      <FaFilePdf /> PDF
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {user?.role === 'patient' && (
                      <button
                        onClick={() => setRefillPrescriptionId(p.id)}
                        disabled={!canRefill}
                        className={`text-xs px-3 py-1.5 rounded-md font-medium transition ${
                          canRefill
                            ? 'bg-medicare-primary text-white hover:bg-teal-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          !canRefill
                            ? 'Refills exhausted or prescription inactive'
                            : 'Request a refill'
                        }
                      >
                        Request Refill
                      </button>
                    )}

                    {(user?.role === 'doctor' || user?.role === 'admin') && (
                      <button
                        onClick={() => setDeletingPrescriptionId(p.id)}
                        className="text-xs p-1.5 rounded text-red-500 hover:bg-red-50 transition"
                        title="Delete Prescription"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        title="Prescription Details"
        size="md"
      >
        {selectedPrescription && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedPrescription.medication_name}
                </h3>
                <p className="text-gray-500">{selectedPrescription.dosage}</p>
              </div>
              {getStatusBadge(selectedPrescription.status)}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500 block">Frequency:</span>
                <span className="font-semibold text-gray-800">{selectedPrescription.frequency}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Duration:</span>
                <span className="font-semibold text-gray-800">
                  {selectedPrescription.duration_days || selectedPrescription.duration || 7} days
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Patient:</span>
                <span className="font-semibold text-gray-800">
                  {selectedPrescription.patient_name || selectedPrescription.patient}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Prescribing Doctor:</span>
                <span className="font-semibold text-gray-800">
                  Dr. {selectedPrescription.doctor_name || selectedPrescription.doctor}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Refills:</span>
                <span className="font-semibold text-gray-800">
                  {selectedPrescription.refills_used} used of {selectedPrescription.refills_allowed} allowed
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Issued On:</span>
                <span className="font-semibold text-gray-800">
                  {new Date(selectedPrescription.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {selectedPrescription.instructions && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 block font-medium mb-1">Instructions:</span>
                <p className="text-gray-800">{selectedPrescription.instructions}</p>
              </div>
            )}

            {selectedPrescription.has_safety_warning && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
                  <FaExclamationTriangle className="text-amber-600 shrink-0" />
                  <span>Clinical Safety Override Applied by Prescribing Physician</span>
                </div>
                {selectedPrescription.safety_alerts && selectedPrescription.safety_alerts.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {selectedPrescription.safety_alerts.map((al, idx) => (
                      <div key={idx} className="bg-white/80 p-2 rounded-lg border border-amber-200 text-xs">
                        <span className="font-bold text-amber-900 block">{al.title}</span>
                        <span className="text-amber-800 text-[11px]">{al.message}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedPrescription.override_reason && (
                  <div className="text-xs text-amber-900 pt-1.5 border-t border-amber-200">
                    <span className="font-semibold">Physician Rationale:</span> {selectedPrescription.override_reason}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedPrescription)}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <FaFilePdf /> Download Official PDF
              </button>
              <button
                onClick={() => setSelectedPrescription(null)}
                className="btn-secondary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Doctor Issue Prescription Modal */}
      <Modal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title="Issue New Prescription"
        size="lg"
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <SearchableSelect
            label="Select Patient"
            placeholder="Choose a patient..."
            searchPlaceholder="Search patient by name or email..."
            required
            value={formData.patient}
            onChange={(val) => setFormData({ ...formData, patient: val })}
            options={patients.map((pt) => ({
              value: pt.id,
              label: pt.user.full_name,
              subLabel: `${pt.user.email}${pt.allergies ? ` | Allergies: ${pt.allergies}` : ''}`,
              badge: pt.blood_group ? `Blood: ${pt.blood_group}` : undefined,
              avatarUrl: pt.user.profile_picture,
              avatarInitial: pt.user.full_name?.charAt(0) || 'P',
            }))}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Medication Name *</label>
              <input
                type="text"
                placeholder="e.g. Amoxicillin, Lisinopril, Warfarin"
                className="input-field"
                value={formData.medication_name}
                onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Dosage *</label>
              <input
                type="text"
                placeholder="e.g. 500mg, 10ml"
                className="input-field"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Real-time Drug Safety Alerts Section */}
          {checkingSafety && (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-1 px-1">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
              <span>Analyzing patient allergies and active cross-interactions...</span>
            </div>
          )}

          {safetyEvaluation && !checkingSafety && (
            <div className="my-2">
              {safetyEvaluation.has_warnings ? (
                <div
                  className={`rounded-2xl p-4 space-y-3 border ${
                    safetyEvaluation.highest_severity === 'critical'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : safetyEvaluation.highest_severity === 'high'
                      ? 'bg-orange-50 border-orange-200 text-orange-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaExclamationTriangle
                        className={`text-base ${
                          safetyEvaluation.highest_severity === 'critical'
                            ? 'text-rose-600'
                            : 'text-amber-600'
                        }`}
                      />
                      <h4 className="text-sm font-bold">
                        Drug Safety Hazard Detected ({safetyEvaluation.alerts.length}{' '}
                        {safetyEvaluation.alerts.length === 1 ? 'Alert' : 'Alerts'})
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        safetyEvaluation.highest_severity === 'critical'
                          ? 'bg-rose-200 text-rose-800'
                          : 'bg-amber-200 text-amber-800'
                      }`}
                    >
                      {safetyEvaluation.highest_severity} Severity
                    </span>
                  </div>

                  {/* List of alerts */}
                  <div className="space-y-2">
                    {safetyEvaluation.alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className="bg-white/95 rounded-xl p-3 border border-slate-200 text-xs shadow-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                alert.severity === 'critical'
                                  ? 'bg-rose-500'
                                  : alert.severity === 'high'
                                  ? 'bg-orange-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                            {alert.title}
                          </span>
                          <span className="capitalize text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                            {alert.type}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{alert.message}</p>
                      </div>
                    ))}
                  </div>

                  {/* Clinical Override Inputs */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={acknowledgeWarnings}
                        onChange={(e) => setAcknowledgeWarnings(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span>
                        Clinical Override: I acknowledge these potential safety risks and authorize
                        this prescription under clinical monitoring.
                      </span>
                    </label>

                    {acknowledgeWarnings && (
                      <div>
                        <textarea
                          rows={2}
                          required
                          placeholder="Provide mandatory clinical justification / patient monitoring plan..."
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <FaCheckCircle className="text-emerald-600 shrink-0" />
                  <span>
                    No documented drug allergies or active prescription cross-interactions detected for
                    this medication.
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Frequency *</label>
              <input
                type="text"
                placeholder="e.g. Twice daily with meals"
                className="input-field"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Duration (Days)</label>
              <input
                type="number"
                min="1"
                max="365"
                className="input-field"
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Refills Allowed</label>
              <input
                type="number"
                min="0"
                max="10"
                className="input-field"
                value={formData.refills_allowed}
                onChange={(e) => setFormData({ ...formData, refills_allowed: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="label">Special Instructions</label>
            <textarea
              rows={3}
              placeholder="e.g. Drink plenty of water, avoid sun exposure, take after breakfast..."
              className="input-field"
              value={formData.instructions || ''}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowIssueModal(false)}
              disabled={submitting}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? 'Issuing...' : 'Issue Prescription'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Refill Confirmation Modal */}
      <ConfirmModal
        isOpen={!!refillPrescriptionId}
        onClose={() => setRefillPrescriptionId(null)}
        onConfirm={handleConfirmRefill}
        title="Request Prescription Refill"
        message="Are you sure you want to request a refill for this prescription? A notification will be sent to your prescribing doctor."
        confirmText="Confirm Refill"
        cancelText="Cancel"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingPrescriptionId}
        onClose={() => setDeletingPrescriptionId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Prescription"
        message="Are you sure you want to delete this prescription? This action will archive the record."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default PrescriptionsPage;
