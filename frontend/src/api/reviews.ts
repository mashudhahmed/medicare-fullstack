import api from './axios';
import { ENDPOINTS } from './endpoints';
import type { DoctorReview, CreateDoctorReviewData, PaginatedResponse } from '../types';

export const reviewsApi = {
  getDoctorReviews: async (doctorId: string): Promise<DoctorReview[]> => {
    const { data } = await api.get(ENDPOINTS.REVIEWS.DOCTOR(doctorId));
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'results' in data) {
      return (data as PaginatedResponse<DoctorReview>).results;
    }
    return [];
  },

  create: async (payload: CreateDoctorReviewData): Promise<DoctorReview> => {
    const { data } = await api.post(ENDPOINTS.REVIEWS.LIST, payload);
    return data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.delete(ENDPOINTS.REVIEWS.DETAIL(id));
    return data;
  },
};

export default reviewsApi;
