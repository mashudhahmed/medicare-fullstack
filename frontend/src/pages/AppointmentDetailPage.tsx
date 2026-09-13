import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentsApi } from '../api/appointments';
import { Appointment } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { 
  FaCalendar, FaClock, FaStethoscope, 
  FaTimes, FaArrowLeft, FaCheckCircle, FaClock as FaClockIcon,
  FaComment
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const AppointmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchAppointment = useCallback(async () => {
    if (!id) return;
    try {
      const data = await appointmentsApi.getById(id);
      setAppointment(data);
    } catch {
      toast.error('Failed to load appointment');
      navigate('/appointments');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    const loadAppointment = async () => {
      await fetchAppointment();
    };
    loadAppointment();
  }, [fetchAppointment]);

  const handleCancel = async () => {
    if (!appointment) return;
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    setCancelling(true);
    try {
      await appointmentsApi.cancel(appointment.id);
      toast.success('Appointment cancelled');
      await fetchAppointment();
    } catch {
      toast.error('Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger',
      in_progress: 'badge-info',
      no_show: 'badge-danger',
    };
    return colors[status] || 'badge-secondary';
  };

  const getStatusIcon = (status: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      pending: <FaClockIcon className="text-yellow-500" />,
      confirmed: <FaCheckCircle className="text-blue-500" />,
      completed: <FaCheckCircle className="text-green-500" />,
      cancelled: <FaTimes className="text-red-500" />,
    };
    return icons[status] || null;
  };

  if (loading) return <LoadingSpinner />;
  if (!appointment) return <div className="text-center py-12">Appointment not found</div>;

  const isUpcoming = ['pending', 'confirmed'].includes(appointment.status);
  const canCancel = isUpcoming && appointment.status !== 'cancelled';

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-medicare-teal mb-6"
      >
        <FaArrowLeft className="mr-2" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-medicare-teal to-teal-500 px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Appointment Details</h1>
              <p className="text-teal-100 mt-1">
                {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              {getStatusIcon(appointment.status)}
              <span className={`badge ${getStatusColor(appointment.status)}`}>
                {appointment.status}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Doctor Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Doctor Information</h3>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-medicare-teal rounded-full flex items-center justify-center text-white font-bold text-lg">
                {appointment.doctor_details?.user?.full_name?.charAt(0) || 'D'}
              </div>
              <div className="ml-4">
                <p className="font-semibold text-medicare-dark">
                  Dr. {appointment.doctor_details?.user?.full_name || 'Doctor'}
                </p>
                <p className="text-sm text-gray-600">
                  <FaStethoscope className="inline mr-1" /> {appointment.doctor_details?.specialty || 'General'}
                </p>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-gray-600">
              <FaCalendar className="mr-3 text-medicare-teal" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p>{new Date(appointment.appointment_date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center text-gray-600">
              <FaClock className="mr-3 text-medicare-teal" />
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p>{new Date(appointment.appointment_date).toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="flex items-center text-gray-600">
              <FaClockIcon className="mr-3 text-medicare-teal" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p>{appointment.duration_minutes} minutes</p>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Reason</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{appointment.reason}</p>
          </div>

          {appointment.notes && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                <FaComment className="inline mr-1" /> Notes
              </h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{appointment.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="btn-danger flex items-center"
              >
                <FaTimes className="mr-2" /> {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailPage;