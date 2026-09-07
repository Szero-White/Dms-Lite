import { apiClient, unwrapResponse } from '../../../services/apiClient';
import type {
  AuthSession,
  AuthUser,
  LoginPayload,
} from '../types/auth.types';

export async function login(payload: LoginPayload) {
  return unwrapResponse<AuthUser>(apiClient.post('/auth/login', payload));
}

export async function fetchCurrentSession() {
  return unwrapResponse<AuthSession>(apiClient.get('/auth/me'));
}
