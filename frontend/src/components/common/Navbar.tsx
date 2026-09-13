import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../ui';
import { FaUser, FaSignOutAlt, FaBars, FaTimes, FaHome, FaCalendar, FaFileMedical, FaCreditCard, FaUserMd, FaUsers } from 'react-icons/fa';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <FaHome className="inline mr-1" />, roles: ['patient', 'doctor', 'admin'] },
    { name: 'Patients', href: '/patients', icon: <FaUsers className="inline mr-1" />, roles: ['admin', 'doctor'] },
    { name: 'Doctors', href: '/doctors', icon: <FaUserMd className="inline mr-1" />, roles: ['admin', 'patient'] },
    { name: 'Appointments', href: '/appointments', icon: <FaCalendar className="inline mr-1" />, roles: ['patient', 'doctor', 'admin'] },
    { name: 'Medical Records', href: '/medical-records', icon: <FaFileMedical className="inline mr-1" />, roles: ['patient', 'doctor', 'admin'] },
    { name: 'Billing', href: '/billing', icon: <FaCreditCard className="inline mr-1" />, roles: ['patient', 'admin'] },
    { name: 'Admin Panel', href: '/admin', icon: <FaUsers className="inline mr-1" />, roles: ['admin'] },
  ];

  const hasAccess = (item: typeof navItems[0]) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-medicare-teal flex items-center">
            <span className="bg-medicare-teal text-white rounded-lg px-2 py-1 mr-2 text-sm">MC</span>
            MediCare Hub
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated && navItems.map((item) => (
              hasAccess(item) && (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-700 hover:text-medicare-teal transition-colors text-sm font-medium"
                >
                  {item.icon} {item.name}
                </Link>
              )
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">
                  {user?.full_name || user?.email}
                </span>
                <Link to="/profile" className="text-gray-700 hover:text-medicare-teal transition-colors">
                  <FaUser className="text-lg" />
                </Link>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="text-gray-700 hover:text-red-600 transition-colors"
                  title="Log out"
                >
                  <FaSignOutAlt className="text-lg" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-medicare-teal transition-colors">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-medicare-teal text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700 text-2xl"
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {isAuthenticated && navItems.map((item) => (
              hasAccess(item) && (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block py-2 text-gray-700 hover:text-medicare-teal"
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon} {item.name}
                </Link>
              )
            ))}
            <div className="pt-4 border-t border-gray-200">
              <Link to="/profile" className="block py-2 text-gray-700 hover:text-medicare-teal" onClick={() => setIsOpen(false)}>
                <FaUser className="inline mr-2" /> Profile
              </Link>
              <button
                onClick={() => { setShowLogoutModal(true); setIsOpen(false); }}
                className="block w-full text-left py-2 text-red-600 hover:text-red-800"
              >
                <FaSignOutAlt className="inline mr-2" /> Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to log out of MediCare Hub? You will need to sign in again to access your account."
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="danger"
        icon={<FaSignOutAlt className="w-5 h-5 text-red-600" />}
      />
    </nav>
  );
};

export default Navbar;