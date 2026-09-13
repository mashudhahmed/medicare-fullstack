import { useState, useEffect, useCallback, useRef } from 'react';
import { appointmentsApi } from '../api';
import { Appointment, AppointmentFilters, CreateAppointmentData } from '../types';
import toast from 'react-hot-toast';

interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  total: number;
  fetchAppointments: () => Promise<void>;
  bookAppointment: (data: CreateAppointmentData) => Promise<Appointment | undefined>;
  cancelAppointment: (id: string) => Promise<void>;
}

export const useAppointments = (filters?: AppointmentFilters): UseAppointmentsReturn => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await appointmentsApi.getAll(filters);
      if (isMounted.current) {
        setAppointments(data.results || []);
        setTotal(data.count || 0);
      }
    } catch {
      if (isMounted.current) {
        toast.error('Failed to load appointments');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [filters]);

  const bookAppointment = useCallback(
    async (data: CreateAppointmentData): Promise<Appointment | undefined> => {
      try {
        const result = await appointmentsApi.create(data);
        toast.success('Appointment booked successfully!');
        await fetchAppointments();
        return result;
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(err.response?.data?.error || 'Failed to book appointment');
        return undefined;
      }
    },
    [fetchAppointments]
  );

  const cancelAppointment = useCallback(
    async (id: string): Promise<void> => {
      try {
        await appointmentsApi.cancel(id);
        toast.success('Appointment cancelled');
        await fetchAppointments();
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(err.response?.data?.error || 'Failed to cancel appointment');
      }
    },
    [fetchAppointments]
  );

  useEffect(() => {
    const loadData = async () => {
      await fetchAppointments();
    };
    loadData();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    total,
    fetchAppointments,
    bookAppointment,
    cancelAppointment,
  };
};

export default useAppointments;