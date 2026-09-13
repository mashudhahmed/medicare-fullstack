import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/ui';
import {
  FaHome,
  FaUserMd,
  FaCalendarAlt,
  FaFileMedical,
  FaFileInvoiceDollar,
  FaUserInjured,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from 'react-icons/fa';

const navByRole: Record<string, { to: string; label: string; icon: React.ReactNode }[]> = {
  patient: [
    { to: '/', label: 'Dashboard', icon: <FaHome /> },
    { to: '/doctors', label: 'Find Doctors', icon: <FaUserMd /> },
    { to: '/appointments', label: 'Appointments', icon: <FaCalendarAlt /> },
    { to: '/medical-records', label: 'Records', icon: <FaFileMedical /> },
    { to: '/billing', label: 'Billing', icon: <FaFileInvoiceDollar /> },
    { to: '/profile', label: 'Profile', icon: <FaCog /> },
  ],
  doctor: [
    { to: '/', label: 'Dashboard', icon: <FaHome /> },
    { to: '/appointments', label: 'Appointments', icon: <FaCalendarAlt /> },
    { to: '/patients', label: 'Patients', icon: <FaUserInjured /> },
    { to: '/medical-records', label: 'Records', icon: <FaFileMedical /> },
    { to: '/profile', label: 'Profile', icon: <FaCog /> },
  ],
  admin: [
    { to: '/', label: 'Dashboard', icon: <FaHome /> },
    { to: '/admin/users', label: 'Users', icon: <FaUsers /> },
    { to: '/admin/doctors', label: 'Doctors', icon: <FaUserMd /> },
    { to: '/patients', label: 'Patients', icon: <FaUserInjured /> },
    { to: '/appointments', label: 'Appointments', icon: <FaCalendarAlt /> },
    { to: '/billing', label: 'Billing', icon: <FaFileInvoiceDollar /> },
    { to: '/profile', label: 'Profile', icon: <FaCog /> },
  ],
};

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const links = navByRole[user?.role || 'patient'] || navByRole.patient;

  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
          <Link to="/" className="text-lg font-bold tracking-tight">
            MediCare Hub
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <FaTimes />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="text-xs text-slate-400 mb-2 truncate">{user?.email}</div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-white px-4 py-3 shadow-sm">
          <button className="md:hidden text-slate-600" onClick={() => setOpen(true)}>
            <FaBars size={20} />
          </button>
          <div className="flex-1">
            <p className="text-sm text-slate-500">Welcome back</p>
            <p className="font-semibold text-slate-800">{user?.full_name}</p>
          </div>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium capitalize text-teal-700">
            {user?.role}
          </span>
        </header>
        <main className="p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of your MediCare Hub account? You will need to log back in to access your dashboard."
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="danger"
        icon={<FaSignOutAlt className="w-5 h-5 text-red-600" />}
      />
    </div>
  );
};

export default DashboardLayout;
