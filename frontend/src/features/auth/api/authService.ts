import { apiClient, unwrapResponse } from '../../../services/apiClient';
import type {
  AuthUser,
  LoginPayload,
} from '../types/auth.types';

export async function login(payload: LoginPayload) {
  return unwrapResponse<AuthUser>(apiClient.post('/auth/login', payload));
}
