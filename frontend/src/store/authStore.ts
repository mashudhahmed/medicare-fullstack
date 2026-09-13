import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, RegisterData } from '../features/auth/types';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      checkAuth: () => {
        const token = localStorage.getItem('access_token');
        const user = localStorage.getItem('user');
        if (token && user) {
          try {
            set({ user: JSON.parse(user), isAuthenticated: true, isLoading: false });
          } catch {
            set({ isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      },

      login: async (email: string, password: string) => {
        try {
          const response = await authApi.login({ email, password });
          const { access, refresh, user } = response;
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
          localStorage.setItem('user', JSON.stringify(user));
          set({ user, isAuthenticated: true });
          return true;
        } catch {
          return false;
        }
      },

      register: async (data: RegisterData) => {
        try {
          await authApi.register(data);
          return true;
        } catch {
          return false;
        }
      },

      logout: async () => {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            await authApi.logout(refreshToken);
          }
        } catch {
          // ignore
        } finally {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user: User) => {
        set({ user });
        localStorage.setItem('user', JSON.stringify(user));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);