import React, { useState, useEffect, useCallback } from 'react';
import { appointmentsApi } from '../api/appointments';
import { doctorsApi } from '../api/doctors';
import { Appointment, Doctor, CreateAppointmentData } from '../types';
import { useAuth } from '../hooks/useAuth';
import { FaCalendar, FaClock, FaStethoscope, FaTimes, FaPlus, FaVideo } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Modal, ConfirmModal } from '../components/ui';
import VideoConsultationModal from '../components/video/VideoConsultationModal';

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
  const [cancellingApptId, setCancellingApptId] = useState<string | null>(null);
  const [videoApptId, setVideoApptId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateAppointmentData>({
    doctor: '',
    appointment_date: '',
    reason: '',
    notes: '',
  });
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsFetched, setSlotsFetched] = useState(false);

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

  useEffect(() => {
    const fetchSlots = async () => {
      if (!formData.doctor || !selectedDate) {
        setAvailableSlots([]);
        setSlotsFetched(false);
        return;
      }
      setLoadingSlots(true);
      try {
        const res = await appointmentsApi.getAvailableSlots(formData.doctor, {
          date: selectedDate,
        });
        setAvailableSlots(res?.slots || []);
        setSlotsFetched(true);
      } catch {
        setAvailableSlots([]);
        setSlotsFetched(true);
      } finally {
        setLoadingSlots(false);
      }
    };

    if (showModal && formData.doctor && selectedDate) {
      fetchSlots();
    }
  }, [formData.doctor, selectedDate, showModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.appointment_date) {
      toast.error('Please select an appointment time slot');
      return;
    }
    try {
      await appointmentsApi.create({ ...formData });
      setShowModal(false);
      setFormData({ doctor: '', appointment_date: '', reason: '', notes: '' });
      toast.success('Appointment booked successfully!');
      await fetchAppointments();
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(message || 'Failed to book appointment');
    }
  };

  const handleCancelClick = (id: string) => {
    setCancellingApptId(id);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingApptId) return;
    try {
      await appointmentsApi.cancel(cancellingApptId);
      toast.success('Appointment cancelled successfully');
      setCancellingApptId(null);
      await fetchAppointments();
    } catch {
      toast.error('Failed to cancel appointment');
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
              <div className="flex items-center space-x-2">
                {appointment.status !== 'cancelled' && (
                  <button
                    onClick={() => setVideoApptId(appointment.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center font-medium transition shadow-sm"
                    title="Start / Join Video Consultation"
                  >
                    <FaVideo className="mr-1.5" /> Video Call
                  </button>
                )}
                {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                  <button
                    onClick={() => handleCancelClick(appointment.id)}
                    className="btn-danger text-sm flex items-center"
                  >
                    <FaTimes className="mr-1" /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Book Appointment"
        description="Schedule a new consultation with one of our healthcare professionals."
        size="md"
      >
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
            <label className="label">Appointment Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className="input-field"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setFormData({ ...formData, appointment_date: '' });
              }}
              required
            />
          </div>

          <div>
            <label className="label flex items-center justify-between">
              <span>Available Time Slots</span>
              {formData.appointment_date && (
                <span className="text-xs font-semibold text-medicare-primary">
                  Selected: {new Date(formData.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </label>

            {!formData.doctor ? (
              <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                Please choose a doctor above to check available consultation slots.
              </p>
            ) : loadingSlots ? (
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-medicare-primary border-t-transparent rounded-full animate-spin" />
                Checking doctor schedule & available slots...
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 bg-gray-50 rounded-lg">
                {availableSlots.map((slot) => {
                  const isSelected = formData.appointment_date === slot;
                  const timeLabel = new Date(slot).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setFormData({ ...formData, appointment_date: slot })}
                      className={`text-xs py-2 px-1 rounded-md font-medium text-center transition ${
                        isSelected
                          ? 'bg-medicare-primary text-white shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-teal-50 hover:text-medicare-primary border border-gray-200'
                      }`}
                    >
                      {timeLabel}
                    </button>
                  );
                })}
              </div>
            ) : slotsFetched ? (
              <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                No slots available on this date. Doctor may not practice on this day or all slots are booked. Please select another date.
              </p>
            ) : null}
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
          <div className="flex gap-3 pt-2">
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
      </Modal>

      {/* Cancel Appointment Confirmation Modal */}
      <ConfirmModal
        isOpen={!!cancellingApptId}
        onClose={() => setCancellingApptId(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="Keep Appointment"
        variant="danger"
      />

      {/* Video Consultation Modal */}
      <VideoConsultationModal
        isOpen={!!videoApptId}
        onClose={() => setVideoApptId(null)}
        appointmentId={videoApptId || ''}
      />
    </div>
  );
};

export default AppointmentsPage;