import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorsApi } from '../api/doctors';
import { appointmentsApi } from '../api/appointments';
import { Doctor } from '../types';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { 
  FaStethoscope, FaClock, FaCheckCircle, 
  FaArrowLeft, FaPhone, FaEnvelope,
  FaMapMarkerAlt, FaMoneyBillWave, FaBookmark 
} from 'react-icons/fa';
import toast from 'react-hot-toast';

interface BookingData {
  appointment_date: string;
  reason: string;
  notes: string;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const DoctorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    appointment_date: '',
    reason: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDoctor = useCallback(async () => {
    if (!id) return;
    try {
      const data = await doctorsApi.getById(id);
      setDoctor(data);
    } catch {
      toast.error('Failed to load doctor details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const loadDoctor = async () => {
      await fetchDoctor();
    };
    loadDoctor();
  }, [fetchDoctor]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to book an appointment');
      navigate('/login');
      return;
    }

    if (user.role !== 'patient') {
      toast.error('Only patients can book appointments');
      return;
    }

    setSubmitting(true);
    try {
      await appointmentsApi.create({
        doctor: id!,
        appointment_date: bookingData.appointment_date,
        reason: bookingData.reason,
        notes: bookingData.notes,
      });
      toast.success('Appointment booked successfully!');
      setShowBooking(false);
      navigate('/appointments');
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast.error(apiError.response?.data?.error || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!doctor) return <div className="text-center py-12">Doctor not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-medicare-teal mb-6"
      >
        <FaArrowLeft className="mr-2" /> Back
      </button>

      {/* Doctor Profile */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-medicare-teal to-teal-500 px-6 py-8">
          <div className="flex items-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-medicare-teal">
              {doctor.user.full_name?.charAt(0) || 'D'}
            </div>
            <div className="ml-6 text-white">
              <h1 className="text-2xl font-bold">Dr. {doctor.user.full_name}</h1>
              <p className="text-teal-100 text-lg">{doctor.specialty}</p>
              <div className="flex items-center mt-2">
                {doctor.is_verified ? (
                  <span className="flex items-center bg-green-500/20 px-3 py-1 rounded-full text-sm">
                    <FaCheckCircle className="mr-1" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center bg-yellow-500/20 px-3 py-1 rounded-full text-sm">
                    Pending Verification
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Doctor Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-gray-600">
              <FaStethoscope className="mr-3 text-medicare-teal" />
              <span>{doctor.qualification}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <FaClock className="mr-3 text-medicare-teal" />
              <span>{doctor.experience_years} years experience</span>
            </div>
            <div className="flex items-center text-gray-600">
              <FaMoneyBillWave className="mr-3 text-medicare-teal" />
              <span>Consultation: ${doctor.consultation_fee}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <FaEnvelope className="mr-3 text-medicare-teal" />
              <span>{doctor.user.email}</span>
            </div>
            {doctor.user.phone && (
              <div className="flex items-center text-gray-600">
                <FaPhone className="mr-3 text-medicare-teal" />
                <span>{doctor.user.phone}</span>
              </div>
            )}
            {doctor.user.address && (
              <div className="flex items-center text-gray-600 col-span-2">
                <FaMapMarkerAlt className="mr-3 text-medicare-teal" />
                <span>{doctor.user.address}</span>
              </div>
            )}
          </div>

          {/* Availability */}
          {doctor.available_days && doctor.available_days.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-medicare-dark mb-2">Availability</h3>
              <div className="flex flex-wrap gap-2">
                {doctor.available_days.map((day) => (
                  <span key={day} className="px-3 py-1 bg-white rounded-full text-sm text-gray-600">
                    {day}
                  </span>
                ))}
              </div>
              {doctor.available_time_start && doctor.available_time_end && (
                <p className="text-sm text-gray-500 mt-2">
                  {doctor.available_time_start} - {doctor.available_time_end}
                </p>
              )}
            </div>
          )}

          {/* Book Button */}
          {user?.role === 'patient' && (
            <button
              onClick={() => setShowBooking(true)}
              className="btn-primary w-full py-3 text-lg flex items-center justify-center"
            >
              <FaBookmark className="mr-2" /> Book Appointment
            </button>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Book Appointment</h2>
            <p className="text-sm text-gray-600 mb-4">
              with Dr. {doctor.user.full_name} ({doctor.specialty})
            </p>
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="label">Date & Time</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={bookingData.appointment_date}
                  onChange={(e) => setBookingData({ ...bookingData, appointment_date: e.target.value })}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div>
                <label className="label">Reason</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={bookingData.reason}
                  onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                  required
                  placeholder="Briefly describe your reason for visiting"
                />
              </div>
              <div>
                <label className="label">Notes (Optional)</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  placeholder="Any additional information"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBooking(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDetailPage;