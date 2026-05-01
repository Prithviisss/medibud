import { create } from 'zustand';
import { authService, LoginPayload, RegisterPayload } from '../services/authService';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (data: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.login(data);
      localStorage.setItem('token', res.token);
      set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  register: async (data: RegisterPayload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.register(data);
      localStorage.setItem('token', res.token);
      set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
