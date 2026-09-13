export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  profile_picture?: string;
  role: 'patient' | 'doctor' | 'admin';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  full_name: string;
  password: string;
  password2: string;
  phone?: string;
  address?: string;
  role?: 'patient' | 'doctor';
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
  message: string;
}