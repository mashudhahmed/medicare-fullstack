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

  downloadPdf: async (id: string, defaultFilename?: string): Promise<void> => {
    const response = await api.get(ENDPOINTS.BILLING.PDF(id), {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', defaultFilename || `Invoice_${id.slice(0, 8)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default billingApi;
