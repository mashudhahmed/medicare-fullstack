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
    email?: string;
    code?: string;
    uid?: string;
    token?: string;
    new_password: string;
    new_password2?: string;
  }) => {
    const { data } = await api.post(ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, payload);
    return data;
  },

  verify2FA: async (payload: { temp_token: string; code: string }): Promise<LoginResponse> => {
    const { data } = await api.post(ENDPOINTS.AUTH.TWO_FACTOR_VERIFY, payload);
    return data;
  },

  setup2FA: async (): Promise<{
    secret: string;
    qr_code: string;
    email: string;
    provisioning_uri: string;
    is_enabled: boolean;
  }> => {
    const { data } = await api.get(ENDPOINTS.AUTH.TWO_FACTOR_SETUP);
    return data;
  },

  enable2FA: async (payload: {
    secret: string;
    code: string;
  }): Promise<{ message: string; two_factor_enabled: boolean }> => {
    const { data } = await api.post(ENDPOINTS.AUTH.TWO_FACTOR_ENABLE, payload);
    return data;
  },

  disable2FA: async (payload: {
    code: string;
  }): Promise<{ message: string; two_factor_enabled: boolean }> => {
    const { data } = await api.post(ENDPOINTS.AUTH.TWO_FACTOR_DISABLE, payload);
    return data;
  },
};

export default authApi;
