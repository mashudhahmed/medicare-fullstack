import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { 
  FaCalendar, FaFileMedical, FaCreditCard, 
  FaUsers, FaStethoscope, FaArrowRight, FaClock} from 'react-icons/fa';
import { appointmentsApi } from '../api/appointments';
import { billingApi } from '../api/billing';
import { medicalRecordsApi } from '../api/medical-records';
import { patientsApi } from '../api/patients';
import LoadingSpinner from '../components/ui/LoadingSpinner';

type UpcomingAppointment = {
  id: string | number;
  appointment_date: string;
  status: string;
  doctor_details?: {
    user?: {
      full_name?: string;
    };
  };
};

const toArray = <T,>(data: unknown): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null && 'results' in data && Array.isArray((data as { results: unknown[] }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    appointments: 0,
    records: 0,
    billing: 0,
    patients: 0,
    doctors: 0,
    upcomingAppointments: [] as UpcomingAppointment[],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [appointmentsData, recordsData, billingData, patientsData] = await Promise.all([
          appointmentsApi.getMyAppointments(),
          medicalRecordsApi.getMyRecords(),
          billingApi.getMyBilling(),
          user?.role === 'admin' ? patientsApi.getAll() : Promise.resolve([]),
        ]);

        const appointments = toArray<UpcomingAppointment>(appointmentsData);
        const records = toArray(recordsData);
        const billing = toArray(billingData);
        const patients = toArray(patientsData);

        setStats({
          appointments: appointments.length,
          records: records.length,
          billing: billing.length,
          patients: patients.length,
          doctors: 0,
          upcomingAppointments: appointments.slice(0, 3),
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Role-based stats cards
  const getStatsCards = () => {
    const commonCards = [
      { 
        title: 'Appointments', 
        value: stats.appointments, 
        icon: <FaCalendar className="text-2xl text-blue-500" />, 
        link: '/appointments',
        color: 'blue'
      },
      { 
        title: 'Medical Records', 
        value: stats.records, 
        icon: <FaFileMedical className="text-2xl text-green-500" />, 
        link: '/medical-records',
        color: 'green'
      },
    ];

    const roleCards = {
      admin: [
        ...commonCards,
        { 
          title: 'Patients', 
          value: stats.patients, 
          icon: <FaUsers className="text-2xl text-purple-500" />, 
          link: '/patients',
          color: 'purple'
        },
        { 
          title: 'Billing', 
          value: stats.billing, 
          icon: <FaCreditCard className="text-2xl text-orange-500" />, 
          link: '/billing',
          color: 'orange'
        },
      ],
      doctor: [
        ...commonCards,
        { 
          title: 'Patients', 
          value: stats.patients, 
          icon: <FaUsers className="text-2xl text-purple-500" />, 
          link: '/patients',
          color: 'purple'
        },
      ],
      patient: [
        ...commonCards,
        { 
          title: 'Billing', 
          value: stats.billing, 
          icon: <FaCreditCard className="text-2xl text-orange-500" />, 
          link: '/billing',
          color: 'orange'
        },
      ],
    };

    return roleCards[user?.role as keyof typeof roleCards] || roleCards.patient;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-medicare-dark">
          {getGreeting()}, {user?.full_name || 'User'}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          {user?.role === 'admin' && 'Manage your healthcare platform from one place'}
          {user?.role === 'doctor' && 'Manage your patients and appointments'}
          {user?.role === 'patient' && 'Track your health and appointments'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {getStatsCards().map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between hover:shadow-xl transition-shadow group"
          >
            <div>
              <p className="text-sm text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-medicare-dark">{stat.value}</p>
            </div>
            <div className={`bg-${stat.color}-50 p-3 rounded-full group-hover:bg-${stat.color}-100 transition-colors`}>
              {stat.icon}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-medicare-dark">Upcoming Appointments</h3>
            <Link to="/appointments" className="text-medicare-teal text-sm hover:underline flex items-center">
              View All <FaArrowRight className="ml-1 text-xs" />
            </Link>
          </div>
          {stats.upcomingAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaCalendar className="text-4xl mx-auto mb-2 text-gray-300" />
              <p>No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.upcomingAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-medicare-dark">
                      {appt.doctor_details?.user?.full_name || 'Doctor'}
                    </p>
                    <p className="text-sm text-gray-500">
                      <FaClock className="inline mr-1 text-xs" />
                      {new Date(appt.appointment_date).toLocaleString()}
                    </p>
                  </div>
                  <span className={`badge ${
                    appt.status === 'confirmed' ? 'badge-success' :
                    appt.status === 'pending' ? 'badge-warning' :
                    appt.status === 'cancelled' ? 'badge-danger' : 'badge-info'
                  }`}>
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-medicare-dark mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {user?.role === 'patient' && (
              <>
                <Link to="/appointments" className="p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors text-center">
                  <FaCalendar className="text-2xl text-primary-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-primary-700">Book Appointment</span>
                </Link>
                <Link to="/billing" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center">
                  <FaCreditCard className="text-2xl text-green-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-green-700">Pay Bill</span>
                </Link>
              </>
            )}
            {user?.role === 'doctor' && (
              <>
                <Link to="/patients" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center">
                  <FaUsers className="text-2xl text-purple-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-purple-700">View Patients</span>
                </Link>
                <Link to="/medical-records" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center">
                  <FaFileMedical className="text-2xl text-blue-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-blue-700">Add Record</span>
                </Link>
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <Link to="/patients" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center">
                  <FaUsers className="text-2xl text-purple-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-purple-700">Manage Users</span>
                </Link>
                <Link to="/doctors" className="p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors text-center">
                  <FaStethoscope className="text-2xl text-teal-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-teal-700">Verify Doctors</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
