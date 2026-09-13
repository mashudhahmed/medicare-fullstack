// User Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  profile_picture?: string;
  role: 'patient' | 'doctor' | 'admin';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  two_factor_enabled?: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
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

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  access: string;
  refresh: string;
  message: string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password2?: string;
  confirm_password?: string;
}

export interface PasswordResetConfirmData {
  uid: string;
  token: string;
  new_password: string;
  new_password2: string;
}

// Patient Types
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

// Doctor Types
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

// Appointment Types
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

// Billing Types
export interface Billing {
  id: string;
  patient: string;
  patient_details?: Patient;
  invoice_number: string;
  amount: string;
  tax: string;
  discount: string;
  total_amount: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: 'cash' | 'card' | 'insurance' | 'online';
  due_date: string;
  paid_at?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Medical Record Types
export interface MedicalRecord {
  id: string;
  patient: string;
  patient_details?: Patient;
  doctor?: string;
  doctor_details?: Doctor;
  record_type: 'diagnosis' | 'prescription' | 'test_result' | 'vaccination' | 'surgery' | 'other';
  title: string;
  description: string;
  details?: Record<string, unknown>;
  attachments?: string[];
  attachment_file?: string;
  record_date: string;
  is_confidential: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMedicalRecordData {
  patient: string;
  record_type: string;
  title: string;
  description: string;
  details?: Record<string, unknown>;
  attachments?: string[];
  attachment_file?: File;
  record_date: string;
  is_confidential?: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: 'appointment' | 'billing' | 'system' | 'medical';
  is_read: boolean;
  link?: string;
  created_at: string;
}

// Admin Dashboard Types
export interface AdminDashboardStats {
  totalUsers?: number;
  pendingDoctors?: number;
  verifiedDoctors?: number;
  totalDoctors?: number;
  [key: string]: unknown;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
}

export interface ApiError {
  error: string;
  status_code: number;
  message?: string;
  errors?: Record<string, string[]>;
}

// 2FA Types
export interface TwoFactorSetupResponse {
  secret: string;
  qr_code: string;
  email: string;
  provisioning_uri: string;
  is_enabled: boolean;
}

export interface TwoFactorVerifyData {
  temp_token: string;
  code: string;
}

// Prescription Types
export interface Prescription {
  id: string;
  appointment?: string;
  patient: string;
  patient_name?: string;
  doctor: string;
  doctor_name?: string;
  doctor_specialty?: string;
  patient_details?: Patient;
  doctor_details?: Doctor;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days?: number;
  duration?: string;
  instructions?: string;
  refills_allowed: number;
  refills_used: number;
  can_refill?: boolean;
  status: 'active' | 'completed' | 'cancelled';
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePrescriptionData {
  appointment?: string;
  patient: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days?: number;
  instructions?: string;
  refills_allowed?: number;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  user?: string;
  user_email?: string;
  user_role?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW' | string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}


