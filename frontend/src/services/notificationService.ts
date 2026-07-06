import { apiClient, unwrapResponse } from './apiClient';
import { NotificationItem } from '../types';

export async function fetchNotifications() {
  return unwrapResponse<NotificationItem[]>(apiClient.get('/notifications'));
}
