import { Patient } from '../patients/types';
import { Doctor } from '../doctors/types';

export interface Appointment {
  id: string;
  patient: string;
  doctor: string;
  patient_details?: Patient;
  doctor_details?: Doctor;
  appointment_date: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  reason: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentData {
  doctor: string;
  appointment_date: string;
  duration_minutes?: number;
  reason: string;
  notes?: string;
}

export interface AppointmentFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}