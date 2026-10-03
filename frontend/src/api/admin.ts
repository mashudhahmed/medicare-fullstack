import api from './axios';
import { ENDPOINTS } from './endpoints';
import type { AdminDashboardStats, AdminAnalyticsData, User, Doctor, AuditLog, PaginatedResponse, AdminUserDetail } from '../types';

const downloadCsv = async (endpoint: string, defaultFilename: string): Promise<void> => {
  const response = await api.get(endpoint, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', defaultFilename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const adminApi = {
  getDashboard: async (): Promise<AdminDashboardStats> => {
    const { data } = await api.get(ENDPOINTS.ADMIN.DASHBOARD);
    return data;
  },

  getAnalytics: async (): Promise<AdminAnalyticsData> => {
    const { data } = await api.get(ENDPOINTS.ADMIN.ANALYTICS);
    return data;
  },

  exportAppointments: async (): Promise<void> => {
    const dateStr = new Date().toISOString().slice(0, 10);
    await downloadCsv(ENDPOINTS.ADMIN.EXPORT_APPOINTMENTS, `appointments_export_${dateStr}.csv`);
  },

  exportBilling: async (): Promise<void> => {
    const dateStr = new Date().toISOString().slice(0, 10);
    await downloadCsv(ENDPOINTS.ADMIN.EXPORT_BILLING, `billing_export_${dateStr}.csv`);
  },

  exportPatients: async (): Promise<void> => {
    const dateStr = new Date().toISOString().slice(0, 10);
    await downloadCsv(ENDPOINTS.ADMIN.EXPORT_PATIENTS, `patients_export_${dateStr}.csv`);
  },

  exportDoctors: async (): Promise<void> => {
    const dateStr = new Date().toISOString().slice(0, 10);
    await downloadCsv(ENDPOINTS.ADMIN.EXPORT_DOCTORS, `doctors_export_${dateStr}.csv`);
  },

  getUsers: async (params?: Record<string, unknown>) => {
    const { data } = await api.get(ENDPOINTS.ADMIN.USERS, { params });
    return data as PaginatedResponse<User> | User[];
  },

  getUser: async (id: string): Promise<AdminUserDetail> => {
    const { data } = await api.get(ENDPOINTS.ADMIN.USER_DETAIL(id));
    return data as AdminUserDetail;
  },

  updateUserStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/admin/users/${id}/status/`, { status });
    return data;
  },

  getPendingDoctors: async () => {
    const { data } = await api.get(ENDPOINTS.ADMIN.PENDING_DOCTORS);
    return data as PaginatedResponse<Doctor> | Doctor[];
  },

  approveDoctor: async (id: string, is_verified = true) => {
    const { data } = await api.post(ENDPOINTS.ADMIN.APPROVE_DOCTOR(id), { is_verified });
    return data;
  },

  verifyDoctor: async (id: string, is_verified: boolean) => {
    const { data } = await api.patch(ENDPOINTS.ADMIN.VERIFY_DOCTOR(id), { is_verified });
    return data;
  },

  getAuditLogs: async (params?: Record<string, unknown>) => {
    const { data } = await api.get(ENDPOINTS.AUDIT_LOGS.LIST, { params });
    return data as PaginatedResponse<AuditLog> | AuditLog[];
  },
};

export default adminApi;
