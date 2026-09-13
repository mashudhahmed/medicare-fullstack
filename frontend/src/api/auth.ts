import api from './axios';
import { ENDPOINTS } from './endpoints';
import type {
  RegisterData,
  LoginData,
  LoginResponse,
  User,
  ChangePasswordData,
} from '../types';

export const authApi = {
  register: async (data: RegisterData) => {
    const { data: res } = await api.post(ENDPOINTS.AUTH.REGISTER, data);
    return res;
  },

  login: async (data: LoginData): Promise<LoginResponse> => {
    // Backend accepts email as USERNAME_FIELD — send both for compatibility
    const { data: res } = await api.post(ENDPOINTS.AUTH.LOGIN, {
      email: data.email,
      username: data.email,
      password: data.password,
    });
    return res;
  },

  logout: async (refresh: string) => {
    const { data } = await api.post(ENDPOINTS.AUTH.LOGOUT, { refresh });
    return data;
  },

  getProfile: async (): Promise<User> => {
    const { data } = await api.get(ENDPOINTS.AUTH.PROFILE);
    return data.user ?? data;
  },

  updateProfile: async (payload: Partial<User>): Promise<User> => {
    const { data } = await api.patch(ENDPOINTS.AUTH.PROFILE, payload);
    return data.user ?? data;
  },

  changePassword: async (payload: ChangePasswordData) => {
    const { data } = await api.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      old_password: payload.old_password,
      new_password: payload.new_password,
      // Backend accepts both new_password2 and confirm_password
      new_password2: payload.confirm_password ?? payload.new_password2,
      confirm_password: payload.confirm_password ?? payload.new_password2,
    });
    return data;
  },

  passwordReset: async (email: string) => {
    const { data } = await api.post(ENDPOINTS.AUTH.PASSWORD_RESET, { email });
    return data;
  },

  passwordResetConfirm: async (payload: {
    uid: string;
    token: string;
    new_password: string;
    new_password2?: string;
  }) => {
    const { data } = await api.post(ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, payload);
    return data;
  },
};

export default authApi;
