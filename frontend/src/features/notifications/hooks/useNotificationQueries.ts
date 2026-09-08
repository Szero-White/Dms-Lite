import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PERMISSIONS,
  hasPermission,
  useAuth,
} from '../../../features/auth';
import { getErrorMessage } from '../../../lib/format';
import { queryKeys } from '../../../lib/queryKeys';
import {
  fetchNotifications,
  setNotificationReadState,
} from '../api/notificationService';
import type { NotificationItem } from '../types/notification.types';

interface NotificationReadStateChange {
  notification: NotificationItem;
  read: boolean;
}

function updateNotificationReadState(
  items: NotificationItem[] | undefined,
  notification: NotificationItem,
  read: boolean,
) {
  return (items ?? []).map((item) => (
    item.id === notification.id && item.source === notification.source
      ? { ...item, readFlag: read }
      : item
  ));
}

export function useNotifications() {
  const { user } = useAuth();
  const canViewNotifications = hasPermission(user, PERMISSIONS.NOTIFICATION_VIEW);
  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => fetchNotifications({ size: 20 }),
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

export function useSetNotificationReadState() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ notification, read }: NotificationReadStateChange) =>
      setNotificationReadState(notification.id, read),
    onMutate: async ({ notification, read }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = queryClient.getQueryData<NotificationItem[]>(queryKeys.notifications);

      queryClient.setQueryData<NotificationItem[]>(
        queryKeys.notifications,
        (items) => updateNotificationReadState(items, notification, read),
      );

      return { previous };
    },
    onSuccess: (_data, { read }) => {
      message.success(read
        ? t('notifications.feedback.markedRead')
        : t('notifications.feedback.markedUnread'));
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications, context.previous);
      }
      message.error(getErrorMessage(error, t('notifications.feedback.updateFailed')));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}
