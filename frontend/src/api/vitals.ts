import api from './axios';
import { ENDPOINTS } from './endpoints';
import type { PatientVital, CreatePatientVitalData, PaginatedResponse } from '../types';

export const vitalsApi = {
  getAll: async (patientId?: string): Promise<PatientVital[]> => {
    const params = patientId ? { patient: patientId } : undefined;
    const { data } = await api.get(ENDPOINTS.VITALS.LIST, { params });
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'results' in data) {
      return (data as PaginatedResponse<PatientVital>).results;
    }
    return [];
  },

  getPatientHistory: async (patientId: string): Promise<PatientVital[]> => {
    const { data } = await api.get(ENDPOINTS.VITALS.PATIENT_HISTORY(patientId));
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'results' in data) {
      return (data as PaginatedResponse<PatientVital>).results;
    }
    return [];
  },

  create: async (payload: CreatePatientVitalData): Promise<PatientVital> => {
    const { data } = await api.post(ENDPOINTS.VITALS.LIST, payload);
    return data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.delete(ENDPOINTS.VITALS.DETAIL(id));
    return data;
  },
};

export default vitalsApi;
