import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'RIDER' | 'ADMIN';
  status: string;
  profilePhotoUrl?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await Promise.all([
      SecureStore.setItemAsync('access_token', accessToken),
      SecureStore.setItemAsync('refresh_token', refreshToken),
      SecureStore.setItemAsync('user', JSON.stringify(user)),
    ]);
    set({ user, isAuthenticated: true });
  },

  clearAuth: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync('access_token'),
      SecureStore.deleteItemAsync('refresh_token'),
      SecureStore.deleteItemAsync('user'),
    ]);
    set({ user: null, isAuthenticated: false });
  },

  loadAuth: async () => {
    try {
      const [token, userStr] = await Promise.all([
        SecureStore.getItemAsync('access_token'),
        SecureStore.getItemAsync('user'),
      ]);
      if (token && userStr) {
        set({ user: JSON.parse(userStr), isAuthenticated: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
