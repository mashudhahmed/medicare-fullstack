import api from './axios';
import { ENDPOINTS } from './endpoints';

export const billingApi = {
  getInvoices: async (params?: Record<string, unknown>) => {
    const { data } = await api.get(ENDPOINTS.BILLING.LIST, { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(ENDPOINTS.BILLING.DETAIL(id));
    return data;
  },

  getMy: async (params?: Record<string, unknown>) => {
    const { data } = await api.get(ENDPOINTS.BILLING.MY, { params });
    return data;
  },

  getMyBilling: async (params?: Record<string, unknown>) => {
    const { data } = await api.get(ENDPOINTS.BILLING.MY, { params });
    return data;
  },

  pay: async (id: string, payload?: Record<string, unknown>) => {
    const { data } = await api.post(ENDPOINTS.BILLING.PAY(id), payload ?? {});
    return data;
  },
};

export default billingApi;
