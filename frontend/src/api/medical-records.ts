import api from './axios';
import { ENDPOINTS } from './endpoints';

export const medicalRecordsApi = {
  getAll: async (params?: Record<string, unknown>) => {
    const { data } = await api.get(ENDPOINTS.MEDICAL_RECORDS.LIST, { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(ENDPOINTS.MEDICAL_RECORDS.DETAIL(id));
    return data;
  },

  getMy: async (params?: Record<string, unknown>) => {
    const { data } = await api.get(ENDPOINTS.MEDICAL_RECORDS.MY, { params });
    return data;
  },

  getMyRecords: async (params?: Record<string, unknown>) => {
    const { data } = await api.get(ENDPOINTS.MEDICAL_RECORDS.MY, { params });
    return data;
  },

  create: async (payload: Record<string, unknown>) => {
    const { data } = await api.post(ENDPOINTS.MEDICAL_RECORDS.LIST, payload);
    return data;
  },
};

export default medicalRecordsApi;
