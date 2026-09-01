import axios from 'axios';
import { i18n } from '../i18n';
import { ApiResponse } from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';
const AUTH_STORAGE_KEY = 'dms-lite-auth';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const rawUser = localStorage.getItem(AUTH_STORAGE_KEY);
  config.headers['Accept-Language'] = i18n.language || 'en';

  if (rawUser) {
    try {
      const user = JSON.parse(rawUser) as { accessToken?: string };
      if (user.accessToken) {
        config.headers.Authorization = `Bearer ${user.accessToken}`;
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  },
);

export async function unwrapResponse<T>(promise: Promise<{ data: ApiResponse<T> }>) {
  const response = await promise;
  return response.data.data;
}
