import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  login: (token: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  /** Restores a previously saved session. Called once on app boot. Never redirects. */
  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const userStr = await SecureStore.getItemAsync('user');
      if (token && userStr) {
        set({ user: JSON.parse(userStr), accessToken: token, isAuthenticated: true });
      }
    } catch {
      // Silently ignore — user simply stays unauthenticated
    }
  },

  login: async (token, refreshToken, user) => {
    await SecureStore.setItemAsync('access_token', token);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user, accessToken: token, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  setAccessToken: (token) => {
    set({ accessToken: token });
    SecureStore.setItemAsync('access_token', token);
  },
}));
