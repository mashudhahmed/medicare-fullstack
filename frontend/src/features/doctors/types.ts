import { User } from '../auth/types';

export interface Doctor {
  id: string;
  user: User;
  user_id: string;
  specialty: string;
  qualification: string;
  experience_years: number;
  license_number: string;
  is_verified: boolean;
  consultation_fee: string;
  available_days?: string[];
  available_time_start?: string;
  available_time_end?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDoctorData {
  specialty: string;
  qualification: string;
  experience_years: number;
  license_number: string;
  consultation_fee?: number;
  available_days?: string[];
  available_time_start?: string;
  available_time_end?: string;
}

export interface DoctorFilters {
  page?: number;
  limit?: number;
  specialty?: string;
  search?: string;
  is_verified?: boolean;
}