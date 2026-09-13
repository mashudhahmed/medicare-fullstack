import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import Dashboard from '../pages/Dashboard';
import ProfilePage from '../pages/ProfilePage';
import DoctorsPage from '../pages/DoctorsPage';
import AppointmentsPage from '../pages/AppointmentsPage';
import PatientsPage from '../pages/PatientsPage';
import BillingPage from '../pages/BillingPage';
import MedicalRecordsPage from '../pages/MedicalRecordsPage';
import AdminUsersPage from '../pages/AdminUsersPage';
import AdminDoctorsPage from '../pages/AdminDoctorsPage';
import NotFoundPage from '../pages/NotFoundPage';

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    <Route
      element={
        <PrivateRoute>
          <DashboardLayout />
        </PrivateRoute>
      }
    >
      <Route index element={<Dashboard />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="doctors" element={<DoctorsPage />} />
      <Route path="appointments" element={<AppointmentsPage />} />
      <Route path="medical-records" element={<MedicalRecordsPage />} />
      <Route
        path="patients"
        element={
          <PrivateRoute roles={['admin', 'doctor']}>
            <PatientsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="billing"
        element={
          <PrivateRoute roles={['admin', 'patient']}>
            <BillingPage />
          </PrivateRoute>
        }
      />
      <Route
        path="admin/users"
        element={
          <PrivateRoute roles={['admin']}>
            <AdminUsersPage />
          </PrivateRoute>
        }
      />
      <Route
        path="admin/doctors"
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
