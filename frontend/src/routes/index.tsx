import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import Dashboard from '../pages/Dashboard';
import ProfilePage from '../pages/ProfilePage';
import DoctorsPage from '../pages/DoctorsPage';
import DoctorDetailPage from '../pages/DoctorDetailPage';
import AppointmentsPage from '../pages/AppointmentsPage';
import AppointmentDetailPage from '../pages/AppointmentDetailPage';
import PatientsPage from '../pages/PatientsPage';
import BillingPage from '../pages/BillingPage';
import MedicalRecordsPage from '../pages/MedicalRecordsPage';
import NotificationsPage from '../pages/NotificationsPage';
import AdminDashboard from '../pages/AdminDashboard';
import AdminUsersPage from '../pages/AdminUsersPage';
import AdminDoctorsPage from '../pages/AdminDoctorsPage';
import NotFoundPage from '../pages/NotFoundPage';
import { useAuth } from '../context/AuthContext';

const RootRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />;
};

const AppRoutes: React.FC = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<RootRoute />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

    {/* Protected Dashboard Routes */}
    <Route
      element={
        <PrivateRoute>
          <DashboardLayout />
        </PrivateRoute>
      }
    >
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/doctors" element={<DoctorsPage />} />
      <Route path="/doctors/:id" element={<DoctorDetailPage />} />
      <Route path="/appointments" element={<AppointmentsPage />} />
      <Route path="/appointments/:id" element={<AppointmentDetailPage />} />
      <Route path="/medical-records" element={<MedicalRecordsPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route
        path="/patients"
        element={
          <PrivateRoute roles={['admin', 'doctor']}>
            <PatientsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <PrivateRoute roles={['admin', 'patient']}>
            <BillingPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute roles={['admin']}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <PrivateRoute roles={['admin']}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <PrivateRoute roles={['admin']}>
            <AdminUsersPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/doctors"
        element={
          <PrivateRoute roles={['admin']}>
            <AdminDoctorsPage />
          </PrivateRoute>
        }
      />
    </Route>

    <Route path="/404" element={<NotFoundPage />} />
    <Route path="*" element={<Navigate to="/404" replace />} />
  </Routes>
);

export default AppRoutes;
