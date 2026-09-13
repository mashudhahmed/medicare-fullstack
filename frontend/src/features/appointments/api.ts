import api from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { Appointment, CreateAppointmentData, AppointmentFilters } from './types';
import { PaginatedResponse } from '../../types';

export const appointmentsApi = {
  getAll: async (params?: AppointmentFilters): Promise<PaginatedResponse<Appointment>> => {
    const response = await api.get(ENDPOINTS.APPOINTMENTS.LIST, { params });
    return response.data;
  },

  getById: async (id: string): Promise<Appointment> => {
    const response = await api.get(ENDPOINTS.APPOINTMENTS.DETAIL(id));
    return response.data;
  },

  create: async (data: CreateAppointmentData): Promise<Appointment> => {
    const response = await api.post(ENDPOINTS.APPOINTMENTS.LIST, data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateAppointmentData>): Promise<Appointment> => {
    const response = await api.patch(ENDPOINTS.APPOINTMENTS.DETAIL(id), data);
    return response.data;
  },

  cancel: async (id: string): Promise<{ message: string }> => {
    const response = await api.post(ENDPOINTS.APPOINTMENTS.CANCEL(id));
    return response.data;
  },

  getMyAppointments: async (): Promise<PaginatedResponse<Appointment>> => {
    const response = await api.get(ENDPOINTS.APPOINTMENTS.MY);
    return response.data;
  },
};

export default appointmentsApi;