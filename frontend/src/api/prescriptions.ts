import api from './axios';
import { ENDPOINTS } from './endpoints';
import type { Prescription, CreatePrescriptionData, PaginatedResponse } from '../types';

export const prescriptionsApi = {
  getAll: async (params?: Record<string, unknown>): Promise<PaginatedResponse<Prescription> | Prescription[]> => {
    const { data } = await api.get(ENDPOINTS.PRESCRIPTIONS.LIST, { params });
    return data;
  },

  getMy: async (): Promise<PaginatedResponse<Prescription> | Prescription[]> => {
    const { data } = await api.get(ENDPOINTS.PRESCRIPTIONS.MY);
    return data;
  },

  getById: async (id: string): Promise<Prescription> => {
    const { data } = await api.get(ENDPOINTS.PRESCRIPTIONS.DETAIL(id));
    return data;
  },

  create: async (payload: CreatePrescriptionData): Promise<Prescription> => {
    const { data } = await api.post(ENDPOINTS.PRESCRIPTIONS.LIST, payload);
    return data;
  },

  refill: async (id: string): Promise<{ message: string; prescription: Prescription }> => {
    const { data } = await api.post(ENDPOINTS.PRESCRIPTIONS.REFILL(id));
    return data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.delete(ENDPOINTS.PRESCRIPTIONS.DETAIL(id));
    return data;
  },
};

export default prescriptionsApi;
