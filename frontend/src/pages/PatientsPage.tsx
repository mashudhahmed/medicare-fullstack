import React, { useState, useEffect, useCallback } from 'react';
import { patientsApi } from '../api/patients';
import { Patient } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { FaSearch, FaUser, FaPhone, FaEnvelope } from 'react-icons/fa';

const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPatients = useCallback(async () => {
    try {
      const data = await patientsApi.getAll();
      const list: Patient[] = Array.isArray(data) ? data : data.results || [];
      setPatients(list);
    } catch {
      console.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadPatients = async () => {
      await fetchPatients();
    };
    loadPatients();
  }, [fetchPatients]);

  const filteredPatients = patients.filter((patient) =>
    patient.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    patient.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-medicare-dark">Patients</h1>
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-64"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPatients.length === 0 ? (
          <div className="card text-center py-12">
            <FaUser className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No patients found</p>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div key={patient.id} className="card flex justify-between items-center hover:shadow-lg transition-shadow">
              <div>
                <h3 className="font-semibold text-medicare-dark">{patient.user?.full_name || 'Unknown'}</h3>
                <div className="text-sm text-gray-600 mt-1 space-y-1">
                  <p><FaEnvelope className="inline mr-2" /> {patient.user?.email}</p>
                  <p><FaPhone className="inline mr-2" /> {patient.user?.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="badge badge-info capitalize">{patient.gender}</span>
                <p className="text-sm text-gray-500 mt-1">
                  {patient.blood_group || 'Blood group N/A'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientsPage;
