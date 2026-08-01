import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getErrorMessage,
} from '../../../lib/format';
import { queryKeys } from '../../../lib/queryKeys';
import {
  cancelSalesOrder,
  confirmSalesOrder,
  createSalesOrder,
  fetchSalesOrders,
} from '../api/salesService';
import type { CreateSalesOrderPayload } from '../types/sales.types';

export function useSalesOrders(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.salesOrders,
    queryFn: async () => {
      const response = await fetchSalesOrders();
      return response.content;
    },
    enabled: options.enabled ?? true,
  });
}

function useMutationFeedback() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  return {
    queryClient,
    message,
    t,
    onError(error: unknown) {
      message.error(getErrorMessage(error));
    },
  };
}

export function useCreateSalesOrder() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (payload: CreateSalesOrderPayload) => createSalesOrder(payload),
    onSuccess: async () => {
      message.success(t('toast.sales.created'));
      await queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders });
    },
    onError,
  });
}

export function useConfirmSalesOrder() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (orderId: number) => confirmSalesOrder(orderId),
    onSuccess: async () => {
      message.success(t('toast.sales.confirmed'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventoryStock }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventoryHistory }),
        queryClient.invalidateQueries({ queryKey: queryKeys.customers }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
      ]);
    },
    onError,
  });
}

export function useCancelSalesOrder() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (orderId: number) => cancelSalesOrder(orderId),
    onSuccess: async () => {
      message.success(t('toast.sales.cancelled'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
      ]);
    },
    onError,
  });
}
