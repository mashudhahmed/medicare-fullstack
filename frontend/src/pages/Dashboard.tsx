import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { appointmentsApi } from '../api/appointments';
import { doctorsApi } from '../api/doctors';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  FaCalendarAlt,
  FaUserMd,
  FaUsers,
  FaFileInvoiceDollar,
  FaHeartbeat,
  FaComments,
  FaShieldAlt,
  FaClock,
  FaPlus,
  FaCheckCircle,
  FaArrowRight,
} from 'react-icons/fa';

interface Appointment {
  id: string;
  reason?: string;
  status: string;
  appointment_date: string;
  doctor_details?: {
    user?: {
      full_name?: string;
      profile_picture?: string;
    };
    specialty?: string;
  };
  patient_details?: {
    user?: {
      full_name?: string;
      profile_picture?: string;
    };
  };
}

interface Doctor {
  id: string;
  user: {
    full_name: string;
  };
  specialty: string;
}

function asList<T>(data: { results?: T[] } | T[] | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.results || [];
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  to?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, subtitle, to }) => {
  const content = (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between group">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="mt-1.5 text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors border border-teal-100">
        {icon}
      </div>
    </div>
  );
  return to ? <Link to={to} className="block">{content}</Link> : content;
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'patient';

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', 'dashboard'],
    queryFn: () => appointmentsApi.getAll(),
  });

  const doctorsQuery = useQuery({
    queryKey: ['doctors', 'dashboard'],
    queryFn: () => doctorsApi.getAll(),
    enabled: role === 'patient',
  });

  if (appointmentsQuery.isLoading && !appointmentsQuery.data) return <LoadingSpinner />;

  const appointments = asList<Appointment>(appointmentsQuery.data);
  const upcoming = appointments.filter((a) =>
    ['pending', 'confirmed'].includes(String(a.status).toLowerCase())
  ).length;
  const completed = appointments.filter((a) =>
    ['completed'].includes(String(a.status).toLowerCase())
  ).length;
  const doctors = asList<Doctor>(doctorsQuery.data);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return (
          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {status}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Pending
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getSubtitle = () => {
    if (role === 'patient') {
      return 'Access your upcoming medical visits, vitals records, and connect with board-certified physicians.';
    }
    if (role === 'doctor') {
      return 'Manage your daily consultation schedule, review patient records, and send medical prescriptions.';
    }
    return 'Monitor system telemetry, practitioner approvals, analytics, and hospital compliance audit logs.';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/60 capitalize tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              {role} Portal
            </span>
            <span className="text-xs text-slate-400 font-medium">{currentDate}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
            {getSubtitle()}
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {role === 'patient' && (
            <>
              <Link
                to="/appointments"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <FaPlus className="text-xs" /> Book Consultation
              </Link>
              <Link
                to="/vitals"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition"
              >
                <FaHeartbeat className="text-xs text-teal-600" /> Log Vitals
              </Link>
            </>
          )}

          {role === 'doctor' && (
            <>
              <Link
                to="/appointments"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <FaCalendarAlt className="text-xs" /> View Schedule
              </Link>
              <Link
                to="/patients"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition"
              >
                <FaUsers className="text-xs text-teal-600" /> Patients Directory
              </Link>
            </>
          )}

          {role === 'admin' && (
            <>
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <FaShieldAlt className="text-xs" /> Executive Analytics
              </Link>
              <Link
                to="/admin/doctors"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition"
              >
                <FaUserMd className="text-xs text-teal-600" /> Doctor Approvals
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Role-Specific Metric Cards */}
      {role === 'admin' && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Registered Users" value={appointments.length + 3} icon={<FaUsers />} subtitle="Platform registry" to="/admin/users" />
          <StatCard title="Consultation Visits" value={appointments.length} icon={<FaCalendarAlt />} subtitle="Scheduled all time" to="/appointments" />
          <StatCard title="Practitioner Pool" value="Active" icon={<FaUserMd />} subtitle="Verified doctors" to="/admin/doctors" />
          <StatCard title="Security & Audits" value="Secured" icon={<FaShieldAlt />} subtitle="Immutable logs" to="/admin/audit-logs" />
        </div>
      )}

      {role === 'patient' && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Upcoming Visits" value={upcoming} icon={<FaCalendarAlt />} subtitle="Active appointments" to="/appointments" />
          <StatCard title="Available Doctors" value={doctors.length || '10+'} icon={<FaUserMd />} subtitle="Board certified" to="/doctors" />
          <StatCard title="Completed Visits" value={completed} icon={<FaCheckCircle />} subtitle="Health history" to="/appointments" />
          <StatCard title="Billing & Receipts" value="Invoices" icon={<FaFileInvoiceDollar />} subtitle="Payment records" to="/billing" />
        </div>
      )}

      {role === 'doctor' && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="All Consultations" value={appointments.length} icon={<FaCalendarAlt />} subtitle="Patient bookings" to="/appointments" />
          <StatCard title="Pending Review" value={upcoming} icon={<FaClock />} subtitle="Awaiting action" to="/appointments" />
          <StatCard title="Completed Visits" value={completed} icon={<FaCheckCircle />} subtitle="Consultations done" to="/appointments" />
          <StatCard title="Direct Messages" value="Inbox" icon={<FaComments />} subtitle="Patient follow-up" to="/messages" />
        </div>
      )}

      {/* Recent Appointments Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Recent Appointments</h2>
            <p className="text-xs text-slate-500">Scheduled clinical consultations and upcoming follow-ups</p>
          </div>
          <Link
            to="/appointments"
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition"
          >
            View All <FaArrowRight className="text-[10px]" />
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <FaCalendarAlt className="text-4xl mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No appointments scheduled</p>
            <p className="text-xs text-slate-400">Book a visit with one of our specialized practitioners.</p>
            {role === 'patient' && (
              <Link to="/doctors" className="inline-block mt-2 text-xs font-semibold text-teal-600 hover:underline">
                Find a Doctor
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.slice(0, 5).map((a) => {
              const otherParty =
                role === 'patient'
                  ? a.doctor_details?.user?.full_name
                    ? `Dr. ${a.doctor_details.user.full_name}`
                    : 'Doctor'
                  : a.patient_details?.user?.full_name || 'Patient';

              return (
                <div key={a.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 rounded-lg px-2 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-100">
                      <FaCalendarAlt />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{a.reason || 'Medical Consultation'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        With <span className="font-medium text-slate-700">{otherParty}</span>
                        {a.appointment_date && (
                          <span className="ml-2 text-slate-400">
                            • {new Date(a.appointment_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {getStatusBadge(a.status)}
                    <Link
                      to="/appointments"
                      className="text-xs font-medium text-slate-400 hover:text-teal-600 p-1"
                      title="View Details"
                    >
                      <FaArrowRight className="text-[10px]" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;