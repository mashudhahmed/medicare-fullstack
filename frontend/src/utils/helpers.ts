import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'badge-warning',
    confirmed: 'badge-info',
    completed: 'badge-success',
    cancelled: 'badge-danger',
    'in_progress': 'badge-info',
    'no_show': 'badge-danger',
    approved: 'badge-success',
    rejected: 'badge-danger',
    suspended: 'badge-danger',
    paid: 'badge-success',
    overdue: 'badge-danger',
  };
  return colors[status] || 'badge-secondary';
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const extractErrorMessage = (error: unknown, fallback = 'Something went wrong'): string => {
  if (!error) return fallback;

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const res = (error as { response?: { status?: number; data?: unknown } }).response;
    if (res?.status === 500) {
      return 'Internal Server Error (500). Please check backend server logs.';
    }
    if (res?.data) {
      const data = res.data;
      if (typeof data === 'string') return data;
      if (typeof data === 'object' && data !== null) {
        const obj = data as Record<string, unknown>;
        if (typeof obj.message === 'string' && obj.message !== 'Validation error') {
          return obj.message;
        }
        if (typeof obj.detail === 'string') {
          return obj.detail;
        }
        if (typeof obj.error === 'string') {
          return obj.error;
        }
        const errors = (obj.errors || obj.error || obj) as Record<string, unknown>;
        if (typeof errors === 'object' && errors !== null) {
          const firstKey = Object.keys(errors).find(
            (k) => !['success', 'status_code', 'message'].includes(k)
          );
          if (firstKey) {
            const val = errors[firstKey];
            if (Array.isArray(val) && val.length > 0) {
              return typeof val[0] === 'string' ? val[0] : String(val[0]);
            }
            if (typeof val === 'string') {
              return val;
            }
          }
        }
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
