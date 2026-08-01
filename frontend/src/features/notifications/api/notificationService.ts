import { apiClient, unwrapResponse } from '../../../services/apiClient';
import { NotificationItem } from '../types/notification.types';

interface NotificationParams {
  size?: number;
}

export async function fetchNotifications(params: NotificationParams = {}) {
  return unwrapResponse<NotificationItem[]>(
    apiClient.get('/notifications', { params }),
  );
}
