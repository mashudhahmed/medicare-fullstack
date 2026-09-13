import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { appointmentsApi } from '../api/appointments';
import { doctorsApi } from '../api/doctors';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { FaCalendarAlt, FaUserMd, FaUsers, FaFileInvoiceDollar } from 'react-icons/fa';

interface Appointment {
  id: string;
  reason?: string;
  status: string;
  appointment_date: string;
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
  to?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, to }) => {
  const content = (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="rounded-full bg-teal-50 p-3 text-teal-600 text-xl">{icon}</div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
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

  // Removed adminApi.getDashboard() since it doesn't exist

  if (appointmentsQuery.isLoading) return <LoadingSpinner />;

  const appointments = asList<Appointment>(appointmentsQuery.data);
  const upcoming = appointments.filter((a) =>
    ['pending', 'confirmed'].includes(String(a.status).toLowerCase())
  ).length;
  const doctors = asList<Doctor>(doctorsQuery.data);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Hello, {user?.full_name}</p>
      </div>

      {role === 'admin' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total users" value="—" icon={<FaUsers />} to="/admin/users" />
          <StatCard title="Patients" value="—" icon={<FaUsers />} to="/patients" />
          <StatCard title="Doctors" value="—" icon={<FaUserMd />} to="/admin/doctors" />
        </div>
      )}

      {role === 'patient' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Upcoming appointments" value={upcoming} icon={<FaCalendarAlt />} to="/appointments" />
          <StatCard title="Available doctors" value={doctors.length} icon={<FaUserMd />} to="/doctors" />
          <StatCard title="Billing" value="View" icon={<FaFileInvoiceDollar />} to="/billing" />
        </div>
      )}

      {role === 'doctor' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="My appointments" value={appointments.length} icon={<FaCalendarAlt />} to="/appointments" />
          <StatCard title="Pending" value={upcoming} icon={<FaCalendarAlt />} to="/appointments" />
          <StatCard title="Patients" value="View" icon={<FaUsers />} to="/patients" />
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Recent appointments</h2>
          <Link to="/appointments" className="text-sm text-teal-600 hover:underline">
            View all
          </Link>
        </div>
        {appointments.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">No appointments yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {appointments.slice(0, 5).map((a) => (
              <li key={a.id} className="py-3 flex justify-between text-sm">
                <span className="text-slate-800">{a.reason || 'Appointment'}</span>
                <span className="capitalize text-slate-500">{a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Dashboard;