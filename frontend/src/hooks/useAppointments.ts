import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export interface AppointmentPayload {
  doctorId: number;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface AppointmentRecord extends AppointmentPayload {
  id: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  doctorName?: string;
}

export const APPOINTMENT_KEYS = {
  all: ["appointments"] as const,
  lists: () => [...APPOINTMENT_KEYS.all, "list"] as const,
  detail: (id: number) => [...APPOINTMENT_KEYS.all, "detail", id] as const,
};

export function useAppointments() {
  return useQuery<AppointmentRecord[]>({
    queryKey: APPOINTMENT_KEYS.lists(),
    queryFn: () => apiClient.get("/appointments/"),
    staleTime: 1000 * 60 * 2, // 2 minutes cache validity
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newBooking: AppointmentPayload) =>
      apiClient.post<AppointmentRecord>("/appointments/", newBooking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.lists() });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentId: number) =>
      apiClient.post(`/appointments/${appointmentId}/cancel/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.lists() });
    },
  });
}