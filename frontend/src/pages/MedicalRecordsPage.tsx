import React, { useState, useEffect, useCallback } from 'react';
import { medicalRecordsApi } from '../api/medical-records';
import { patientsApi } from '../api/patients';
import { uploadApi } from '../api/upload';
import { MedicalRecord, Patient } from '../types';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui';
import { FaFileMedical, FaCalendar, FaUserMd, FaPlus, FaDownload, FaPaperclip, FaTimes, FaImage } from 'react-icons/fa';
import toast from 'react-hot-toast';

const MedicalRecordsPage: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    patient: '',
    record_type: 'diagnosis',
    title: '',
    description: '',
    record_date: new Date().toISOString().split('T')[0],
    is_confidential: false,
  });

  const fetchRecords = useCallback(async () => {
    try {
      const data = await medicalRecordsApi.getMyRecords();
      const list: MedicalRecord[] = Array.isArray(data) ? data : data?.results || [];
      setRecords(list);
    } catch {
      console.error('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadRecords = async () => {
      await fetchRecords();
    };
    loadRecords();
  }, [fetchRecords]);

  useEffect(() => {
    const loadPatients = async () => {
      if (user?.role === 'doctor' || user?.role === 'admin') {
        try {
          const res = await patientsApi.getAll();
          const list = Array.isArray(res) ? res : res.results || [];
          setPatients(list);
        } catch {
          // ignore
        }
      }
    };
    loadPatients();
  }, [user?.role]);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      diagnosis: 'badge-danger',
      prescription: 'badge-info',
      test_result: 'badge-warning',
      vaccination: 'badge-success',
      surgery: 'badge-danger',
      other: 'badge-secondary',
    };
    return colors[type] || 'badge-secondary';
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let patientId = formData.patient;
      if (user?.role === 'patient') {
        const myProfile = await patientsApi.getMyProfile();
        patientId = myProfile.id;
      }

      if (!patientId) {
        toast.error('Please select a patient');
        setSaving(false);
        return;
      }

      let attachmentUrl = '';
      if (attachmentFile) {
        try {
          const uploadRes = await uploadApi.uploadImage(attachmentFile, 'medical_records');
          attachmentUrl = uploadRes.url;
        } catch (uploadErr) {
          toast.error('Failed to upload attachment file');
          setSaving(false);
          return;
        }
      }

      await medicalRecordsApi.create({
        ...formData,
        patient: patientId,
        ...(attachmentUrl ? { attachment_file: attachmentUrl } : {}),
      });

      toast.success('Medical record added successfully!');
      setShowAddModal(false);
      setAttachmentFile(null);
      setAttachmentPreview(null);
      setFormData({
        patient: '',
        record_type: 'diagnosis',
        title: '',
        description: '',
        record_date: new Date().toISOString().split('T')[0],
        is_confidential: false,
      });
      await fetchRecords();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; detail?: string } } };
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Failed to add record');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit');
      e.target.value = '';
      return;
    }

    setAttachmentFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setAttachmentPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const handleClearFile = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-medicare-dark">Medical Records</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-2" /> Add Record
        </button>
      </div>

      <div className="grid gap-4">
        {records.length === 0 ? (
          <div className="card text-center py-12">
            <FaFileMedical className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No medical records found</p>
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`badge ${getTypeColor(record.record_type)}`}>
                      {record.record_type}
                    </span>
                    <h3 className="font-semibold text-medicare-dark">{record.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{record.description}</p>
                  <div className="text-sm text-gray-500 mt-2 space-y-1">
                    <p><FaCalendar className="inline mr-2" /> {new Date(record.record_date).toLocaleDateString()}</p>
                    {record.doctor_details && (
                      <p><FaUserMd className="inline mr-2" /> Dr. {record.doctor_details.user?.full_name}</p>
                    )}
                  </div>
                </div>
                {record.attachment_file && (
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 ml-4">
                    {/\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(record.attachment_file) && (
                      <a
                        href={record.attachment_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View attachment image"
                        className="block overflow-hidden rounded-lg border border-slate-200 hover:opacity-90 shadow-sm"
                      >
                        <img
                          src={record.attachment_file}
                          alt="Attachment"
                          className="w-14 h-14 object-cover"
                        />
                      </a>
                    )}
                    <a
                      href={record.attachment_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline text-xs flex items-center whitespace-nowrap"
                    >
                      <FaDownload className="mr-1" /> View File
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Medical Record Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Medical Record"
        description="Create a new medical history record, test result, or diagnosis note."
        size="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {(user?.role === 'doctor' || user?.role === 'admin') && (
            <div>
              <label className="label">Patient</label>
              <select
                className="input-field"
                value={formData.patient}
                onChange={(e) =>
                  setFormData({ ...formData, patient: e.target.value })
                }
                required
              >
                <option value="">Select a patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user?.full_name || p.user?.email || p.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Record Type</label>
              <select
                className="input-field"
                value={formData.record_type}
                onChange={(e) =>
                  setFormData({ ...formData, record_type: e.target.value })
                }
                required
              >
                <option value="diagnosis">Diagnosis</option>
                <option value="prescription">Prescription</option>
                <option value="test_result">Test Result</option>
                <option value="vaccination">Vaccination</option>
                <option value="surgery">Surgery</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Record Date</label>
              <input
                type="date"
                className="input-field"
                value={formData.record_date}
                onChange={(e) =>
                  setFormData({ ...formData, record_date: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Title</label>
            <input
              type="text"
              placeholder="e.g. Annual Cardiovascular Checkup"
              className="input-field"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="label">Description & Observations</label>
            <textarea
              rows={4}
              placeholder="Enter clinical observations, findings, treatment recommendations..."
              className="input-field"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          {/* Attachment / Lab Report (Cloudinary) */}
          <div>
            <label className="label flex items-center justify-between">
              <span>Attachment / Lab Report Image (Optional)</span>
              <span className="text-xs text-gray-400 font-normal">Cloudinary Cloud Storage</span>
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-teal-400 transition-colors bg-gray-50/50">
              {attachmentFile ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {attachmentPreview ? (
                      <img
                        src={attachmentPreview}
                        alt="Preview"
                        className="w-12 h-12 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                        <FaPaperclip className="text-xl" />
                      </div>
                    )}
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{attachmentFile.name}</p>
                      <p className="text-xs text-gray-400">
                        {(attachmentFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Remove attachment"
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <FaImage className="mx-auto text-2xl text-teal-500 mb-1" />
                  <p className="text-xs font-semibold text-teal-700">Click to upload report image or PDF</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">JPEG, PNG, WebP, GIF, PDF (max 5MB)</p>
                </label>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_confidential"
              checked={formData.is_confidential}
              onChange={(e) =>
                setFormData({ ...formData, is_confidential: e.target.checked })
              }
              className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
            <label htmlFor="is_confidential" className="text-sm text-slate-700 select-none cursor-pointer">
              Mark record as confidential
            </label>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving ? 'Saving Record...' : 'Save Record'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MedicalRecordsPage;
