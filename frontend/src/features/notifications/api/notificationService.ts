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

export async function setNotificationReadState(id: number | string, read: boolean) {
  return unwrapResponse<void>(
    apiClient.put(
      '/notifications/' + encodeURIComponent(String(id)) + '/read-state',
      { read },
    ),
  );
}
