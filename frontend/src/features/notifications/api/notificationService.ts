import { apiClient, unwrapResponse } from '../../../services/apiClient';
import { NotificationItem } from '../types/notification.types';

export async function fetchNotifications() {
  return unwrapResponse<NotificationItem[]>(apiClient.get('/notifications'));
}
