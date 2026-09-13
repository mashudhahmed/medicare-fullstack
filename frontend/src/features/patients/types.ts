import { User } from '../auth/types';

export interface Patient {
  id: string;
  user: User;
  user_id: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  blood_group?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  allergies?: string;
  chronic_conditions?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePatientData {
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  blood_group?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  allergies?: string;
  chronic_conditions?: string;
}

export interface PatientFilters {
  page?: number;
  limit?: number;
  search?: string;
}