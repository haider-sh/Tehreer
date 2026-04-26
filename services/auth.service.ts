import api from './api';
import { User } from '../store/auth.store';

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', {
      username,
      email,
      password,
    });
    return data;
  },
};
