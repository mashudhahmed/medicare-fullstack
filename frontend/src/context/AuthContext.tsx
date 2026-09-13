import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authApi } from '../api/auth';
import { User, LoginData, RegisterData } from '../types';
import { extractErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

export interface LoginResult {
  success: boolean;
  requires_2fa?: boolean;
  temp_token?: string;
  email?: string;
  user?: User;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginData) => Promise<LoginResult>;
  verify2FA: (tempToken: string, code: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; data?: unknown; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const initializeAuth = (): void => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginData): Promise<LoginResult> => {
    try {
      const response = await authApi.login(credentials);

      // Check if server requires 2FA verification
      const rawRes = response as unknown as { requires_2fa?: boolean; temp_token?: string; email?: string };
      if (rawRes.requires_2fa) {
        return {
          success: true,
          requires_2fa: true,
          temp_token: rawRes.temp_token,
          email: rawRes.email,
        };
      }

      const { access, refresh, user } = response;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      setUser(user);
      setIsAuthenticated(true);
      return { success: true, user };
    } catch (error: unknown) {
      const message = extractErrorMessage(error, 'Login failed');
      return { success: false, error: message };
    }
  };

  const verify2FA = async (tempToken: string, code: string) => {
    try {
      const response = await authApi.verify2FA({ temp_token: tempToken, code });
      const { access, refresh, user } = response;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      setUser(user);
      setIsAuthenticated(true);
      return { success: true, user };
    } catch (error: unknown) {
      const message = extractErrorMessage(error, 'Invalid 2FA verification code');
      return { success: false, error: message };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authApi.register(data);
      return { success: true, data: response };
    } catch (error: unknown) {
      const message = extractErrorMessage(error, 'Registration failed');
      return { success: false, error: message };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      console.error('Logout error:');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (updatedUser: User): void => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, login, verify2FA, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
