import React, { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  FaPills,
  FaClock,
  FaShieldAlt,
  FaHeartbeat,
  FaComments,
  FaBell,
  FaChartLine,
} from 'react-icons/fa';
import { messagesApi } from '../api/messages';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const data = await messagesApi.getUnreadCount();
      setUnreadMessages(data.unread_count || 0);
    } catch {
      // Ignore background fetch error
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, location.pathname]);

  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    navigate('/login');
  };

  const getNavigationSections = (): NavSection[] => {
    const role = user?.role || 'patient';

    if (role === 'patient') {
      return [
        {
          title: 'Overview',
          items: [
            { to: '/dashboard', label: 'Dashboard', icon: <FaHome />, end: true },
            { to: '/doctors', label: 'Find Doctors', icon: <FaUserMd /> },
            { to: '/appointments', label: 'Appointments', icon: <FaCalendarAlt /> },
            { to: '/messages', label: 'Messages', icon: <FaComments />, badge: unreadMessages },
          ],
        },
        {
          title: 'Clinical & Health',
          items: [
            { to: '/vitals', label: 'Health Vitals', icon: <FaHeartbeat /> },
            { to: '/prescriptions', label: 'Prescriptions', icon: <FaPills /> },
            { to: '/medical-records', label: 'Medical Records', icon: <FaFileMedical /> },
          ],
        },
        {
          title: 'Account',
          items: [
            { to: '/billing', label: 'Billing & Invoices', icon: <FaFileInvoiceDollar /> },
            { to: '/notifications', label: 'Notifications', icon: <FaBell /> },
            { to: '/profile', label: 'My Profile', icon: <FaCog /> },
          ],
        },
      ];
    }

    if (role === 'doctor') {
      return [
        {
          title: 'Clinical Practice',
          items: [
            { to: '/dashboard', label: 'Dashboard', icon: <FaHome />, end: true },
            { to: '/appointments', label: 'Appointments', icon: <FaCalendarAlt /> },
            { to: '/messages', label: 'Messages', icon: <FaComments />, badge: unreadMessages },
            { to: '/doctor/schedule', label: 'My Schedule', icon: <FaClock /> },
          ],
        },
        {
          title: 'Patient Care',
          items: [
            { to: '/patients', label: 'Patients Roster', icon: <FaUserInjured /> },
            { to: '/vitals', label: 'Patient Vitals', icon: <FaHeartbeat /> },
            { to: '/prescriptions', label: 'Prescriptions', icon: <FaPills /> },
            { to: '/medical-records', label: 'Medical Records', icon: <FaFileMedical /> },
          ],
        },
        {
          title: 'Account',
          items: [
            { to: '/notifications', label: 'Notifications', icon: <FaBell /> },
            { to: '/profile', label: 'Doctor Profile', icon: <FaCog /> },
          ],
        },
      ];
    }

    // Admin role
    return [
      {
        title: 'Hospital Operations',
        items: [
          { to: '/admin/dashboard', label: 'Executive Analytics', icon: <FaChartLine />, end: true },
          { to: '/dashboard', label: 'Activity Overview', icon: <FaHome />, end: true },
        ],
      },
      {
        title: 'User & Staff Directory',
        items: [
          { to: '/admin/users', label: 'Users Directory', icon: <FaUsers /> },
          { to: '/admin/doctors', label: 'Doctor Verification', icon: <FaUserMd /> },
          { to: '/patients', label: 'Patient Directory', icon: <FaUserInjured /> },
        ],
      },
      {
        title: 'Clinical & Financial',
        items: [
          { to: '/appointments', label: 'Appointments', icon: <FaCalendarAlt /> },
          { to: '/billing', label: 'Billing & Invoices', icon: <FaFileInvoiceDollar /> },
          { to: '/messages', label: 'Messages', icon: <FaComments />, badge: unreadMessages },
          { to: '/vitals', label: 'Health Vitals', icon: <FaHeartbeat /> },
          { to: '/prescriptions', label: 'Prescriptions', icon: <FaPills /> },
        ],
      },
      {
        title: 'System & Security',
        items: [
          { to: '/admin/audit-logs', label: 'Security & Audit Logs', icon: <FaShieldAlt /> },
          { to: '/notifications', label: 'Notifications', icon: <FaBell /> },
          { to: '/profile', label: 'System Settings', icon: <FaCog /> },
        ],
      },
    ];
  };

  const sections = getNavigationSections();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <Link
            to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight"
          >
            <img src="/logo.png" alt="MediCare" className="h-8 w-8 rounded-lg object-contain bg-white p-0.5 shadow-sm" />
            <span className="text-white tracking-wide">MediCare</span>
          </Link>
          <button
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-500 text-white shrink-0">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User Identity & Logout Footer */}
        <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950/70">
          <div className="flex items-center gap-2.5 mb-2 px-1">
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs relative overflow-hidden shrink-0 border border-slate-700">
              <span>{user?.full_name?.charAt(0) || 'U'}</span>
              {user?.profile_picture && (
                <img
                  src={user.profile_picture}
                  alt={user.full_name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name}</p>
              <p className="text-[11px] text-slate-400 truncate capitalize">{user?.role} Portal</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition"
          >
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-white px-4 py-3 shadow-sm">
          <button
            className="md:hidden text-slate-600 hover:text-slate-900 p-1"
            onClick={() => setOpen(true)}
            aria-label="Open sidebar"
          >
            <FaBars size={20} />
          </button>
          <div className="flex-1">
            <p className="text-xs text-slate-500">Welcome back</p>
            <p className="font-semibold text-slate-800 leading-tight">{user?.full_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/notifications"
              title="Notifications"
              className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition relative"
            >
              <FaBell size={18} />
            </Link>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium capitalize text-teal-700">
              {user?.role}
            </span>
            <Link to="/profile" title="View Profile" className="relative block">
              <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm relative overflow-hidden border border-teal-500 hover:ring-2 hover:ring-teal-400 transition">
                <span>{user?.full_name?.charAt(0) || 'U'}</span>
                {user?.profile_picture && (
                  <img
                    src={user.profile_picture}
                    alt={user.full_name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
            </Link>
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of your MediCare account? You will need to log back in to access your dashboard."
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="danger"
        icon={<FaSignOutAlt className="w-5 h-5 text-red-600" />}
      />
    </div>
  );
};

export default DashboardLayout;
