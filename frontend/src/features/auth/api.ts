import api from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { LoginCredentials, RegisterData, AuthResponse, User } from './types';

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post(ENDPOINTS.AUTH.REGISTER, data);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<{ message: string }> => {
    const response = await api.post(ENDPOINTS.AUTH.LOGOUT, { refresh: refreshToken });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get(ENDPOINTS.AUTH.PROFILE);
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.patch(ENDPOINTS.AUTH.PROFILE, data);
    return response.data;
  },

  changePassword: async (data: { old_password: string; new_password: string; new_password2: string }): Promise<{ message: string }> => {
    const response = await api.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
    return response.data;
  },

  passwordReset: async (email: string): Promise<{ message: string }> => {
    const response = await api.post(ENDPOINTS.AUTH.PASSWORD_RESET, { email });
    return response.data;
  },

  passwordResetConfirm: async (data: { uid: string; token: string; new_password: string; new_password2: string }): Promise<{ message: string }> => {
    const response = await api.post(ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, data);
    return response.data;
  },
};

export default authApi;