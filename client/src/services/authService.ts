import api from './api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export const authService = {
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterPayload): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};
