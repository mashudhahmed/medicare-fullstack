import React, { useState, useEffect, useCallback } from 'react';
import { patientsApi } from '../api/patients';
import { Patient } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { FaSearch, FaUser, FaPhone, FaEnvelope, FaFilter, FaTimes, FaTint } from 'react-icons/fa';

const BLOOD_GROUPS = ['all', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('all');

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
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
    fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = patients.filter((patient) => {
    const query = search.toLowerCase().trim();
    const name = patient.user?.full_name?.toLowerCase() || '';
    const email = patient.user?.email?.toLowerCase() || '';
    const phone = patient.user?.phone?.toLowerCase() || '';

    const matchesSearch = !query || name.includes(query) || email.includes(query) || phone.includes(query);
    const matchesGender = genderFilter === 'all' || patient.gender?.toLowerCase() === genderFilter.toLowerCase();
    const matchesBlood = bloodGroupFilter === 'all' || patient.blood_group === bloodGroupFilter;

    return matchesSearch && matchesGender && matchesBlood;
  });

  const clearFilters = () => {
    setSearch('');
    setGenderFilter('all');
    setBloodGroupFilter('all');
  };

  const hasActiveFilters = search.trim() !== '' || genderFilter !== 'all' || bloodGroupFilter !== 'all';

  if (loading && patients.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-medicare-dark">Patients Directory</h1>
        <p className="text-sm text-gray-500 mt-1">
          Comprehensive healthcare client registry with clinical demographics and contact records
        </p>
      </div>

      {/* Search and Demographic Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3.5 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search patient by name, email, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-medicare-teal focus:outline-none"
          />
        </div>

        {/* Gender Filter */}
        <div className="w-full md:w-44">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-medicare-teal focus:outline-none capitalize"
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Blood Group Filter */}
        <div className="w-full md:w-44">
          <select
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-medicare-teal focus:outline-none"
          >
            <option value="all">All Blood Groups</option>
            {BLOOD_GROUPS.filter((b) => b !== 'all').map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-lg transition"
          >
            <FaTimes /> Clear
          </button>
        )}
      </div>

      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>
          Showing {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'}
        </span>
        {hasActiveFilters && (
          <span className="flex items-center gap-1 text-medicare-teal">
            <FaFilter className="text-[10px]" /> Filtered results
          </span>
        )}
      </div>

      {/* Patients List */}
      <div className="grid gap-4">
        {filteredPatients.length === 0 ? (
          <div className="card text-center py-12">
            <FaUser className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No patients found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria or clearing filters.</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 btn-outline inline-flex items-center text-xs"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-full bg-teal-50 text-medicare-teal flex items-center justify-center font-bold text-base shrink-0 border border-teal-100">
                  <span>{patient.user?.full_name?.charAt(0) || 'P'}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-medicare-dark">{patient.user?.full_name || 'Patient'}</h3>
                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                    <p>
                      <FaEnvelope className="inline mr-1.5 text-gray-400" /> {patient.user?.email || 'No email'}
                    </p>
                    <p>
                      <FaPhone className="inline mr-1.5 text-gray-400" /> {patient.user?.phone || 'No phone'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 gap-2">
                <span className="badge badge-info capitalize">{patient.gender || 'Not specified'}</span>
                {patient.blood_group ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    <FaTint className="text-[10px]" /> {patient.blood_group}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Blood group N/A</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientsPage;
