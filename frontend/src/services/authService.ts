import { apiClient, unwrapResponse } from './apiClient';
import { AuthUser, LoginPayload } from '../types';

export async function login(payload: LoginPayload) {
  return unwrapResponse<AuthUser>(apiClient.post('/auth/login', payload));
}
