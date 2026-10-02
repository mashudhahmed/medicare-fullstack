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
  average_rating?: number;
  total_reviews?: number;
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
  reminder_sent?: boolean;
  reminder_sent_at?: string;
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

// Admin Dashboard & Analytics Types
export interface AdminDashboardStats {
  totalUsers?: number;
  pendingDoctors?: number;
  verifiedDoctors?: number;
  totalDoctors?: number;
  [key: string]: unknown;
}

export interface AdminAnalyticsSummary {
  total_users: number;
  total_patients: number;
  total_doctors: number;
  verified_doctors: number;
  pending_doctors: number;
  total_appointments: number;
  completed_appointments: number;
  confirmed_appointments: number;
  pending_appointments: number;
  cancelled_appointments: number;
  total_revenue: number;
  pending_revenue: number;
  average_doctor_rating: number;
  total_reviews: number;
}

export interface AdminMonthlyTrend {
  month: string;
  appointments: number;
  revenue: number;
}

export interface AdminSpecialtyDistribution {
  specialty: string;
  key: string;
  count: number;
}

export interface AdminStatusDistribution {
  status: string;
  key: string;
  count: number;
}

export interface AdminAnalyticsData {
  summary: AdminAnalyticsSummary;
  monthly_trends: AdminMonthlyTrend[];
  specialty_distribution: AdminSpecialtyDistribution[];
  status_distribution: AdminStatusDistribution[];
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
  has_safety_warning?: boolean;
  safety_alerts?: DrugSafetyAlert[];
  override_reason?: string;
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
  acknowledge_warnings?: boolean;
  override_reason?: string;
}

export interface DrugSafetyAlert {
  type: 'allergy' | 'interaction' | 'duplicate' | string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  title: string;
  message: string;
  allergen?: string;
  conflict_with?: string;
  conflicting_prescription_id?: string;
}

export interface DrugSafetyEvaluation {
  is_safe: boolean;
  has_warnings: boolean;
  highest_severity: 'critical' | 'high' | 'moderate' | 'low' | 'none';
  alerts: DrugSafetyAlert[];
  patient_allergies: string;
  active_medications: { name: string; dosage: string; id: string }[];
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

// Doctor Review Types
export interface DoctorReview {
  id: string;
  doctor: string;
  patient: string;
  appointment?: string;
  rating: number;
  comment: string;
  patient_name: string;
  patient_avatar?: string;
  doctor_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDoctorReviewData {
  doctor: string;
  appointment?: string;
  rating: number;
  comment?: string;
}

// Patient Health Vitals Types
export interface PatientVital {
  id: string;
  patient: string;
  patient_name?: string;
  recorded_by?: string;
  recorded_by_name?: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  bp_reading?: string;
  heart_rate?: number;
  blood_glucose?: number;
  glucose_context: 'fasting' | 'post_meal' | 'random' | 'bedtime';
  body_temperature?: number;
  oxygen_saturation?: number;
  weight_kg?: number;
  height_cm?: number;
  bmi?: number;
  bmi_category?: 'Underweight' | 'Normal' | 'Overweight' | 'Obese' | string;
  notes?: string;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePatientVitalData {
  patient?: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  blood_glucose?: number;
  glucose_context?: 'fasting' | 'post_meal' | 'random' | 'bedtime';
  body_temperature?: number;
  oxygen_saturation?: number;
  weight_kg?: number;
  height_cm?: number;
  notes?: string;
  recorded_at?: string;
}

// Doctor-Patient Follow-Up Chat Types
export interface ChatMessage {
  id: string;
  appointment?: string;
  sender: string;
  sender_name: string;
  sender_role: string;
  sender_avatar?: string;
  recipient: string;
  recipient_name: string;
  recipient_role: string;
  recipient_avatar?: string;
  content: string;
  attachment_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface SendChatMessageData {
  recipient: string;
  appointment?: string;
  content: string;
  attachment_url?: string;
}

export interface ConversationSummary {
  user_id: string;
  full_name: string;
  role: string;
  profile_picture?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}




