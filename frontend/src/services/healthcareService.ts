import apiClient from './apiClient';

export interface Doctor {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  specialization: string;
  consultation_fee: number;
  is_verified: boolean;
}

export interface Appointment {
  id: number;
  doctor: Doctor;
  appointment_date: string;
  reason: string;
  status: 'PENDING' | 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}

export interface AppointmentPayload {
  doctor: number;
  appointment_date: string;
  reason: string;
}

export interface MedicalRecord {
  id: number;
  patient: number;
  doctor: number;
  diagnosis: string;
  prescription: string;
  attachment_file?: string | null;
  created_at: string;
}

export interface BillingInvoice {
  id: number;
  appointment: number;
  amount: number;
  total_amount: number;
  status: 'PENDING' | 'PAID' | 'REFUNDED';
  created_at: string;
}

export const healthcareService = {
  // Appointments
  getAppointments: async (): Promise<Appointment[]> => {
    const response = await apiClient.get('/appointments/');
    return response.data;
  },

  createAppointment: async (payload: AppointmentPayload): Promise<Appointment> => {
    const response = await apiClient.post('/appointments/', payload);
    return response.data;
  },

  // Doctors
  getDoctors: async (): Promise<Doctor[]> => {
    const response = await apiClient.get('/doctors/');
    return response.data;
  },

  // Medical Records (Supports file uploads)
  getMedicalRecords: async (patientId?: number): Promise<MedicalRecord[]> => {
    const url = patientId ? `/medical-records/?patient=${patientId}` : '/medical-records/';
    const response = await apiClient.get(url);
    return response.data;
  },

  createMedicalRecord: async (formData: FormData): Promise<MedicalRecord> => {
    const response = await apiClient.post('/medical-records/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Billing / Invoices
  getInvoices: async (): Promise<BillingInvoice[]> => {
    const response = await apiClient.get('/billing/');
    return response.data;
  },
};