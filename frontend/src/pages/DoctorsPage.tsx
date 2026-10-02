import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { doctorsApi } from '../api/doctors';
import { Doctor } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  FaSearch,
  FaUserMd,
  FaStar,
  FaCheckCircle,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaFilter,
  FaTimes,
} from 'react-icons/fa';

const SPECIALTIES = [
  { value: 'all', label: 'All Specialties' },
  { value: 'general', label: 'General Medicine' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'psychiatry', label: 'Psychiatry' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'obstetrics', label: 'Obstetrics & Gynecology' },
];

const DoctorsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('all');
  const [minRating, setMinRating] = useState('all');

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await doctorsApi.getAll();
      const list = Array.isArray(data) ? data : data?.results || [];
      setDoctors(list);
    } catch {
      console.error('Failed to fetch doctors list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const filteredDoctors = doctors.filter((doc) => {
    const query = search.toLowerCase().trim();
    const docName = doc.user?.full_name?.toLowerCase() || '';
    const docSpec = doc.specialty?.toLowerCase() || '';
    const docQual = doc.qualification?.toLowerCase() || '';

    const matchesSearch = !query || docName.includes(query) || docSpec.includes(query) || docQual.includes(query);
    const matchesSpecialty = specialty === 'all' || doc.specialty === specialty;

    const ratingVal = doc.average_rating || 0;
    let matchesRating = true;
    if (minRating === '4') matchesRating = ratingVal >= 4.0;
    if (minRating === '3') matchesRating = ratingVal >= 3.0;

    return matchesSearch && matchesSpecialty && matchesRating;
  });

  const clearFilters = () => {
    setSearch('');
    setSpecialty('all');
    setMinRating('all');
  };

  const hasActiveFilters = search.trim() !== '' || specialty !== 'all' || minRating !== 'all';

  if (loading && doctors.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-medicare-dark">Find Doctors & Specialists</h1>
        <p className="text-gray-600 mt-1">
          Explore board-certified medical practitioners, review clinical credentials, and book consultations.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3.5 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by doctor name, specialty, or qualification..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-medicare-teal focus:outline-none"
          />
        </div>

        {/* Specialty Filter */}
        <div className="w-full md:w-56">
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-medicare-teal focus:outline-none"
          >
            {SPECIALTIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Rating Filter */}
        <div className="w-full md:w-44">
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-medicare-teal focus:outline-none"
          >
            <option value="all">Any Rating</option>
            <option value="4">4.0 Stars & Above</option>
            <option value="3">3.0 Stars & Above</option>
          </select>
        </div>

        {/* Clear Filters Button */}
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
        <span>Showing {filteredDoctors.length} {filteredDoctors.length === 1 ? 'physician' : 'physicians'}</span>
        {hasActiveFilters && (
          <span className="flex items-center gap-1 text-medicare-teal">
            <FaFilter className="text-[10px]" /> Filtered results
          </span>
        )}
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="card text-center py-16">
          <FaUserMd className="text-5xl mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700">No doctors match your criteria</h3>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your search terms or clearing specialty filters.</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 btn-outline inline-flex items-center text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => {
            const rating = doc.average_rating || 0;
            const reviewsCount = doc.total_reviews || 0;
            const fee = Number(doc.consultation_fee) || 0;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  {/* Top Doctor Avatar & Badges */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-lg relative overflow-hidden shrink-0 border border-teal-500 shadow-sm">
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="font-bold text-gray-900 text-base truncate">
                          Dr. {doc.user?.full_name}
                        </h2>
                        {doc.is_verified && (
                          <FaCheckCircle className="text-teal-600 text-xs shrink-0" title="Verified Practitioner" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-medicare-teal capitalize mt-0.5">
                        {doc.specialty}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {doc.qualification || 'Certified Practitioner'}
                      </p>
                    </div>
                  </div>

                  {/* Rating & Experience */}
                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center text-amber-500">
                        <FaStar className="text-xs" />
                        <span className="font-bold ml-1 text-gray-800">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
                      </div>
                      <span className="text-gray-400">
                        ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                    <span className="text-gray-600 bg-gray-50 px-2 py-0.5 rounded text-[11px]">
                      {doc.experience_years} yrs exp
                    </span>
                  </div>

                  {/* Consultation Fee & Availability */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-gray-700">
                      <FaMoneyBillWave className="text-teal-600" />
                      <span className="font-semibold text-gray-900">${fee.toFixed(2)}</span>
                      <span className="text-gray-400 text-[11px]">/ visit</span>
                    </div>

                    {doc.available_days && doc.available_days.length > 0 && (
                      <div className="flex items-center gap-1 text-gray-500 text-[11px]">
                        <FaCalendarAlt className="text-gray-400" />
                        <span>{doc.available_days.length} days/wk</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
                  <Link
                    to={`/doctors/${doc.id}`}
                    className="w-full text-center bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-3 rounded-lg text-xs transition shadow-sm"
                  >
                    View Profile & Book Consultation
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorsPage;
