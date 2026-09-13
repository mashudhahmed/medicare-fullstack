export const ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register/',
    LOGIN: '/auth/login/',
    LOGOUT: '/auth/logout/',
    PROFILE: '/auth/profile/',
    CHANGE_PASSWORD: '/auth/change-password/',
    // Matches backend: /auth/refresh-token/ (also aliased as /auth/token/refresh/)
    REFRESH_TOKEN: '/auth/refresh-token/',
    PASSWORD_RESET: '/auth/password-reset/',
    PASSWORD_RESET_CONFIRM: '/auth/password-reset/confirm/',
  },
  PATIENTS: {
    LIST: '/patients/',
    DETAIL: (id: string) => `/patients/${id}/`,
    ME: '/patients/me/',
  },
  DOCTORS: {
    LIST: '/doctors/',
    DETAIL: (id: string) => `/doctors/${id}/`,
    ME: '/doctors/me/',
    AVAILABILITY: '/doctors/me/',
  },
  APPOINTMENTS: {
    LIST: '/appointments/',
    DETAIL: (id: string) => `/appointments/${id}/`,
    CANCEL: (id: string) => `/appointments/${id}/cancel/`,
    MY: '/appointments/my/',
    SLOTS: (doctorId: string) => `/appointments/available-slots/${doctorId}/`,
  },
  BILLING: {
    LIST: '/billing/',
    DETAIL: (id: string) => `/billing/${id}/`,
    MY: '/billing/my/',
    PAY: (id: string) => `/billing/${id}/pay/`,
  },
  MEDICAL_RECORDS: {
    LIST: '/medical-records/',
    DETAIL: (id: string) => `/medical-records/${id}/`,
    MY: '/medical-records/my/',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard/',
    USERS: '/admin/users/',
    USER_DETAIL: (id: string) => `/admin/users/${id}/`,
    PENDING_DOCTORS: '/admin/doctors/pending/',
    APPROVE_DOCTOR: (id: string) => `/admin/doctors/${id}/approve/`,
    VERIFY_DOCTOR: (id: string) => `/admin/doctors/${id}/verify/`,
  },
  NOTIFICATIONS: {
    LIST: '/notifications/',
    READ: (id: string) => `/notifications/${id}/read/`,
    READ_ALL: '/notifications/read-all/',
  },
  PRESCRIPTIONS: {
    LIST: '/prescriptions/',
    DETAIL: (id: string) => `/prescriptions/${id}/`,
    MY: '/prescriptions/my/',
    REFILL: (id: string) => `/prescriptions/${id}/refill/`,
  },
  AUDIT_LOGS: {
    LIST: '/admin/audit-logs/',
  },
} as const;
