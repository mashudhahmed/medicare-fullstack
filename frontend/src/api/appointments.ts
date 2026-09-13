import api from './axios';
import { ENDPOINTS } from './endpoints';
import type {
  Appointment,
  CreateAppointmentData,
  PaginatedResponse,
} from '../types';

export const appointmentsApi = {
  getAll: async (
    params?: Record<string, unknown>
  ): Promise<PaginatedResponse<Appointment> | Appointment[]> => {
    const { data } = await api.get(ENDPOINTS.APPOINTMENTS.LIST, { params });
    return data;
  },

  getMyAppointments: async (
    params?: Record<string, unknown>
  ): Promise<PaginatedResponse<Appointment> | Appointment[]> => {
    const { data } = await api.get(ENDPOINTS.APPOINTMENTS.MY, { params });
    return data;
  },

  getById: async (id: string): Promise<Appointment> => {
    const { data } = await api.get(ENDPOINTS.APPOINTMENTS.DETAIL(id));
    return data;
  },

  create: async (payload: CreateAppointmentData): Promise<Appointment> => {
    const { data } = await api.post(ENDPOINTS.APPOINTMENTS.LIST, payload);
    return data;
  },

  cancel: async (id: string): Promise<{ message?: string } | Appointment> => {
    const { data } = await api.post(ENDPOINTS.APPOINTMENTS.CANCEL(id));
    return data;
  },

  getAvailableSlots: async (
    doctorId: string,
    params?: Record<string, unknown>
  ) => {
    const { data } = await api.get(ENDPOINTS.APPOINTMENTS.SLOTS(doctorId), {
      params,
    });
    return data;
  },

  reschedule: async (id: string, appointmentDate: string) => {
    const { data } = await api.post(`/appointments/${id}/reschedule/`, {
      appointment_date: appointmentDate,
    });
    return data;
  },

  getVideoSession: async (id: string) => {
    const { data } = await api.get(`/appointments/${id}/video/`);
    return data;
  },
};

export default appointmentsApi;