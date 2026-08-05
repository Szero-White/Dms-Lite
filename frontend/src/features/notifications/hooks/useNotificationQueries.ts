import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PERMISSIONS,
  hasPermission,
  useAuth,
} from '../../../features/auth';
import { queryKeys } from '../../../lib/queryKeys';
import {
  fetchNotifications,
  markNotificationRead,
} from '../api/notificationService';
import type { NotificationItem } from '../types/notification.types';

const READ_NOTIFICATION_STORAGE_PREFIX = 'dms-lite-read-notifications';

function readNotificationStorageKey(userId?: number, tenantId?: number) {
  return READ_NOTIFICATION_STORAGE_PREFIX + ':' + (tenantId ?? 'tenant') + ':' + (userId ?? 'user');
}

function readStoredNotificationIds(storageKey: string) {
  if (typeof window === 'undefined') {
    return new Set<string>();
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    return new Set<string>(rawValue ? JSON.parse(rawValue) : []);
  } catch {
    return new Set<string>();
  }
}

function notificationStorageId(notification: NotificationItem) {
  return notification.source + ':' + notification.id;
}

function storeNotificationId(storageKey: string, notification: NotificationItem) {
  if (typeof window === 'undefined') {
    return;
  }

  const ids = readStoredNotificationIds(storageKey);
  ids.add(notificationStorageId(notification));
  window.localStorage.setItem(storageKey, JSON.stringify([...ids].slice(-300)));
}

function applyStoredReadState(items: NotificationItem[], storageKey: string) {
  const readIds = readStoredNotificationIds(storageKey);
  return items.map((item) => (
    readIds.has(notificationStorageId(item))
      ? { ...item, readFlag: true }
      : item
  ));
}

function markQueryItemRead(items: NotificationItem[] | undefined, notification: NotificationItem) {
  return (items ?? []).map((item) => (
    notificationStorageId(item) === notificationStorageId(notification)
      ? { ...item, readFlag: true }
      : item
  ));
}

export function useNotifications() {
  const { user } = useAuth();
  const canViewNotifications = hasPermission(user, PERMISSIONS.NOTIFICATION_VIEW);
  const storageKey = readNotificationStorageKey(user?.userId, user?.tenantId);
  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => applyStoredReadState(await fetchNotifications({ size: 20 }), storageKey),
    enabled: canViewNotifications,
    staleTime: 30_000,
  });

  return {
    data: canViewNotifications ? notificationsQuery.data : [],
    isLoading: canViewNotifications && notificationsQuery.isLoading,
    isError: canViewNotifications && notificationsQuery.isError,
    error: canViewNotifications ? notificationsQuery.error : null,
    refetch: notificationsQuery.refetch,
  };
}

export function useMarkNotificationRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const storageKey = readNotificationStorageKey(user?.userId, user?.tenantId);

  return useMutation({
    mutationFn: async (notification: NotificationItem) => {
      if (notification.readFlag !== false) {
        return;
      }

      storeNotificationId(storageKey, notification);

      if (notification.source === 'api') {
        await markNotificationRead(notification.id);
      }
    },
    onMutate: async (notification) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = queryClient.getQueryData<NotificationItem[]>(queryKeys.notifications);

      queryClient.setQueryData<NotificationItem[]>(
        queryKeys.notifications,
        (items) => markQueryItemRead(items, notification),
      );

      return { previous };
    },
    onError: () => {
      // Keep local read state even if persistence is temporarily unavailable.
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}
