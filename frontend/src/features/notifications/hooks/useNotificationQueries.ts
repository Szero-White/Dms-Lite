import { useQuery } from '@tanstack/react-query';
import {
  PERMISSIONS,
  hasPermission,
  useAuth,
} from '../../../features/auth';
import { queryKeys } from '../../../lib/queryKeys';
import { fetchNotifications } from '../api/notificationService';

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
