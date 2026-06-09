import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

let client: AxiosInstance;

export function getApiClient(): AxiosInstance {
  if (client) return client;

  client = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Request interceptor — attach token
  client.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Response interceptor — refresh on 401
  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      if (error.response?.status === 401) {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (refreshToken) {
          try {
            const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
            await SecureStore.setItemAsync('access_token', data.data.accessToken);
            await SecureStore.setItemAsync('refresh_token', data.data.refreshToken);
            error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return client.request(error.config);
          } catch {
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
          }
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    getApiClient().get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    getApiClient().post<T>(url, data, config).then((r) => r.data),
  patch: <T>(url: string, data?: unknown) =>
    getApiClient().patch<T>(url, data).then((r) => r.data),
  delete: <T>(url: string) =>
    getApiClient().delete<T>(url).then((r) => r.data),
};
