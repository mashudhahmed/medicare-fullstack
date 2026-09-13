import api from './axios';
import { ENDPOINTS } from './endpoints';
import type { Patient, PaginatedResponse } from '../types';

export const patientsApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const { data } = await api.get(ENDPOINTS.PATIENTS.LIST, { params });
    return data as PaginatedResponse<Patient> | Patient[];
  },

  getById: async (id: string) => {
    const { data } = await api.get(ENDPOINTS.PATIENTS.DETAIL(id));
    return data as Patient;
  },

  getMe: async () => {
    const { data } = await api.get(ENDPOINTS.PATIENTS.ME);
    return data as Patient;
  },

  getMyProfile: async () => {
    const { data } = await api.get(ENDPOINTS.PATIENTS.ME);
    return data as Patient;
  },

  updateMe: async (payload: Partial<Patient>) => {
    const { data } = await api.patch(ENDPOINTS.PATIENTS.ME, payload);
    return data as Patient;
  },

  updateMyProfile: async (payload: Partial<Patient>) => {
    const { data } = await api.patch(ENDPOINTS.PATIENTS.ME, payload);
    return data as Patient;
  },
};

export default patientsApi;
