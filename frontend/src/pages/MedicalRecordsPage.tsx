import React, { useState, useEffect, useCallback } from 'react';
import { medicalRecordsApi } from '../api/medical-records';
import { MedicalRecord } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { FaFileMedical, FaCalendar, FaUserMd, FaPlus, FaDownload } from 'react-icons/fa';

const MedicalRecordsPage: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleAddRecord = () => {
    // Navigate to add record form or open modal
    alert('Add record functionality coming soon!');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-medicare-dark">Medical Records</h1>
        <button
          onClick={handleAddRecord}
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
                  <a
                    href={record.attachment_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm flex items-center ml-4 whitespace-nowrap"
                  >
                    <FaDownload className="mr-1" /> View File
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MedicalRecordsPage;
