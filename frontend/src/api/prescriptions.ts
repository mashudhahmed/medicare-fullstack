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

  downloadPdf: async (id: string, defaultFilename?: string): Promise<void> => {
    const response = await api.get(ENDPOINTS.PRESCRIPTIONS.PDF(id), {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', defaultFilename || `Prescription_${id.slice(0, 8)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default prescriptionsApi;
