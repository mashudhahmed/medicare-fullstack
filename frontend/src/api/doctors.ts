import api from './axios';
import { ENDPOINTS } from './endpoints';
import type { Doctor, PaginatedResponse } from '../types';

export const doctorsApi = {
  getAll: async (params?: Record<string, unknown>): Promise<PaginatedResponse<Doctor> | Doctor[]> => {
    const { data } = await api.get(ENDPOINTS.DOCTORS.LIST, { params });
    return data;
  },

  getById: async (id: string): Promise<Doctor> => {
    const { data } = await api.get(ENDPOINTS.DOCTORS.DETAIL(id));
    return data;
  },

  getMe: async (): Promise<Doctor> => {
    const { data } = await api.get(ENDPOINTS.DOCTORS.ME);
    return data;
  },

  getMyProfile: async (): Promise<Doctor> => {
    const { data } = await api.get(ENDPOINTS.DOCTORS.ME);
    return data;
  },

  updateMe: async (payload: Partial<Doctor>): Promise<Doctor> => {
    const { data } = await api.patch(ENDPOINTS.DOCTORS.ME, payload);
    return data;
  },

  updateMyProfile: async (payload: Partial<Doctor>): Promise<Doctor> => {
    const { data } = await api.patch(ENDPOINTS.DOCTORS.ME, payload);
    return data;
  },
};

export default doctorsApi;
