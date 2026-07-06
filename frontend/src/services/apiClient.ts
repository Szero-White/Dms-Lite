import axios from 'axios';
import { ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const rawUser = localStorage.getItem('dms-lite-auth');

  if (rawUser) {
    const user = JSON.parse(rawUser);
    config.headers.Authorization = `Bearer ${user.accessToken}`;
  }

  return config;
});

export async function unwrapResponse<T>(promise: Promise<{ data: ApiResponse<T> }>) {
  const response = await promise;
  return response.data.data;
}
