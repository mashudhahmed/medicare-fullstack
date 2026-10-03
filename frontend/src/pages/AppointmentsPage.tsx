import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsApi } from '../api/appointments';
import { doctorsApi } from '../api/doctors';
import { Appointment, Doctor, CreateAppointmentData } from '../types';
import { useAuth } from '../hooks/useAuth';
import { FaCalendar, FaClock, FaStethoscope, FaTimes, FaPlus, FaVideo, FaStar, FaComments, FaBell, FaSearch, FaFilter } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { Modal, ConfirmModal, SearchableSelect } from '../components/ui';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [cancellingApptId, setCancellingApptId] = useState<string | null>(null);
  const [videoApptId, setVideoApptId] = useState<string | null>(null);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
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

  const handleSendReminder = async (appointmentId: string) => {
    try {
      setSendingReminderId(appointmentId);
      const res = await appointmentsApi.sendReminder(appointmentId);
      toast.success(res.message || 'Reminder dispatched to patient.');
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, reminder_sent: true, reminder_sent_at: res.reminder_sent_at } : a
        )
      );
    } catch {
      toast.error('Failed to send reminder');
    } finally {
      setSendingReminderId(null);
    }
  };

  const filteredAppointments = appointments.filter((appt) => {
    const matchesStatus = statusFilter === 'all' || appt.status.toLowerCase() === statusFilter.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus;

    const doctorName = appt.doctor_details?.user?.full_name?.toLowerCase() || '';
    const patientName = appt.patient_details?.user?.full_name?.toLowerCase() || '';
    const reason = appt.reason?.toLowerCase() || '';
    const specialty = appt.doctor_details?.specialty?.toLowerCase() || '';

    const matchesSearch =
      doctorName.includes(query) ||
      patientName.includes(query) ||
      reason.includes(query) ||
      specialty.includes(query);

    return matchesStatus && matchesSearch;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-medicare-dark">Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage consultation bookings, join telemedicine calls, and send reminders</p>
        </div>
        {user?.role === 'patient' && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center self-start sm:self-auto"
          >
            <FaPlus className="mr-2" /> Book Appointment
          </button>
        )}
      </div>

      {/* Search and Status Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3.5 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by doctor, patient, reason, or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-medicare-teal focus:outline-none"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-medicare-teal focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
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
      <div className="flex items-center justify-between text-xs text-gray-500 px-1 mb-4">
        <span>Showing {filteredAppointments.length} {filteredAppointments.length === 1 ? 'appointment' : 'appointments'}</span>
        {hasActiveFilters && (
          <span className="flex items-center gap-1 text-medicare-teal">
            <FaFilter className="text-[10px]" /> Filtered results
          </span>
        )}
      </div>

      <div className="grid gap-4">
        {filteredAppointments.length === 0 ? (
          <div className="card text-center py-12">
            <FaCalendar className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No appointments found</p>
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
          filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-semibold text-medicare-dark">
                    {appointment.doctor_details?.user?.full_name || 'Doctor'}
                  </h3>
                  {appointment.status === 'in_progress' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Consultation Active
                    </span>
                  ) : (
                    <span className={`badge ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  )}
                  {appointment.reminder_sent && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                      <FaBell className="text-[10px]" /> Reminder Sent
                    </span>
                  )}
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
              <div className="flex flex-wrap items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                {appointment.status !== 'cancelled' && (
                  <button
                    onClick={() => setVideoApptId(appointment.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center font-medium transition shadow-sm ${
                      appointment.status === 'in_progress'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400 ring-offset-1 animate-pulse'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                    title={
                      appointment.status === 'in_progress'
                        ? 'Consultation is active now - click to join immediately'
                        : 'Start / Join Video Consultation'
                    }
                  >
                    <FaVideo className="mr-1.5" />
                    {appointment.status === 'in_progress' ? 'Join Live Room' : 'Video Call'}
                  </button>
                )}
                {appointment.status !== 'cancelled' && (
                  <Link
                    to={`/messages?user=${
                      user?.role === 'patient'
                        ? appointment.doctor_details?.user?.id || appointment.doctor_details?.user_id || ''
                        : appointment.patient_details?.user?.id || appointment.patient_details?.user_id || ''
                    }`}
                    className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-3 py-1.5 rounded-lg text-sm flex items-center font-medium transition shadow-sm"
                    title="Send follow-up message"
                  >
                    <FaComments className="mr-1.5 text-teal-600" /> Chat
                  </Link>
                )}
                {(user?.role === 'doctor' || user?.role === 'admin') &&
                  appointment.status === 'confirmed' && (
                    <button
                      onClick={() => handleSendReminder(appointment.id)}
                      disabled={sendingReminderId === appointment.id}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg text-sm flex items-center font-medium transition shadow-sm disabled:opacity-50"
                      title="Dispatch automated reminder"
                    >
                      <FaBell className="mr-1.5 text-amber-600" />
                      {sendingReminderId === appointment.id
                        ? 'Sending...'
                        : appointment.reminder_sent
                        ? 'Resend'
                        : 'Send Reminder'}
                    </button>
                  )}
                {appointment.status === 'completed' && user?.role === 'patient' && (
                  <Link
                    to={`/doctors/${appointment.doctor}`}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-lg text-sm flex items-center font-medium transition shadow-sm"
                    title="Rate and review your doctor"
                  >
                    <FaStar className="mr-1.5 text-amber-500" /> Review Doctor
                  </Link>
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
          <SearchableSelect
            label="Doctor"
            placeholder="Select a doctor..."
            searchPlaceholder="Search doctor by name or specialty..."
            required
            value={formData.doctor}
            onChange={(val) => setFormData({ ...formData, doctor: val })}
            options={doctors.map((doctor) => ({
              value: doctor.id,
              label: `Dr. ${doctor.user.full_name}`,
              subLabel: doctor.qualification ? `${doctor.qualification} • ${doctor.experience_years} yrs exp` : undefined,
              badge: doctor.specialty,
              avatarUrl: doctor.user.profile_picture,
              avatarInitial: doctor.user.full_name?.charAt(0) || 'D',
            }))}
          />
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