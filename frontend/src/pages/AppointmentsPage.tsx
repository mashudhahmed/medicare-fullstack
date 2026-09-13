import React, { useState, useEffect, useCallback } from 'react';
import { appointmentsApi } from '../api/appointments';
import { doctorsApi } from '../api/doctors';
import { Appointment, Doctor, CreateAppointmentData } from '../types';
import { useAuth } from '../hooks/useAuth';
import { FaCalendar, FaClock, FaStethoscope, FaTimes, FaPlus } from 'react-icons/fa';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-12" role="status" aria-label="Loading">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-medicare-primary border-t-transparent" />
  </div>
);

const AppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<CreateAppointmentData>({
    doctor: '',
    appointment_date: '',
    reason: '',
    notes: '',
  });

  const fetchAppointments = useCallback(async () => {
    try {
      const data = await appointmentsApi.getAll();
      setAppointments(Array.isArray(data) ? data : data.results || []);
    } catch {
      console.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      const data = await doctorsApi.getAll();
      setDoctors(Array.isArray(data) ? data : data.results || []);
    } catch {
      console.error('Failed to fetch doctors');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchAppointments();
      if (user?.role === 'patient') {
        await fetchDoctors();
      }
    };
    loadData();
  }, [fetchAppointments, fetchDoctors, user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await appointmentsApi.create({ ...formData });
      setShowModal(false);
      setFormData({ doctor: '', appointment_date: '', reason: '', notes: '' });
      await fetchAppointments();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Failed to book appointment');
    }
  };

  const handleCancel = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentsApi.cancel(id);
        await fetchAppointments();
      } catch {
        alert('Failed to cancel appointment');
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger',
      'in_progress': 'badge-info',
      'no_show': 'badge-danger',
    };
    return colors[status] || 'badge-secondary';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-medicare-dark">Appointments</h1>
        {user?.role === 'patient' && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center"
          >
            <FaPlus className="mr-2" /> Book Appointment
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <div className="card text-center py-12">
            <FaCalendar className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No appointments found</p>
          </div>
        ) : (
          appointments.map((appointment) => (
            <div key={appointment.id} className="card flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-medicare-dark">
                    {appointment.doctor_details?.user?.full_name || 'Doctor'}
                  </h3>
                  <span className={`badge ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <p>
                    <FaClock className="inline mr-2" />
                    {new Date(appointment.appointment_date).toLocaleString()}
                  </p>
                  <p>
                    <FaStethoscope className="inline mr-2" />
                    {appointment.reason}
                  </p>
                </div>
              </div>
              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <button
                  onClick={() => handleCancel(appointment.id)}
                  className="btn-danger text-sm flex items-center"
                >
                  <FaTimes className="mr-1" /> Cancel
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Book Appointment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Doctor</label>
                <select
                  className="input-field"
                  value={formData.doctor}
                  onChange={(e) =>
                    setFormData({ ...formData, doctor: e.target.value })
                  }
                  required
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.user.full_name} - {doctor.specialty}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Date & Time</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={formData.appointment_date}
                  onChange={(e) =>
                    setFormData({ ...formData, appointment_date: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Reason</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Notes (Optional)</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">
                  Book Appointment
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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

export default AppointmentsPage;