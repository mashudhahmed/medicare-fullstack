import api from './axios';
import { ENDPOINTS } from './endpoints';
import type { AdminDashboardStats, User, Doctor, AuditLog, PaginatedResponse } from '../types';

export const adminApi = {
  getDashboard: async (): Promise<AdminDashboardStats> => {
    const { data } = await api.get(ENDPOINTS.ADMIN.DASHBOARD);
    return data;
  },

  getUsers: async (params?: Record<string, unknown>) => {
    const { data } = await api.get(ENDPOINTS.ADMIN.USERS, { params });
    return data as PaginatedResponse<User> | User[];
  },

  getUser: async (id: string) => {
    const { data } = await api.get(ENDPOINTS.ADMIN.USER_DETAIL(id));
    return data as User;
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
