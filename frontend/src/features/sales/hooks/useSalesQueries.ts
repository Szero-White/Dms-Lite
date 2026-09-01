import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { useMutationFeedback } from '../../../lib/useMutationFeedback';
import {
  cancelSalesOrder,
  confirmSalesOrder,
  createSalesOrder,
  fetchSalesOrderDetail,
  fetchSalesOrders,
} from '../api/salesService';
import type { CreateSalesOrderPayload } from '../types/sales.types';

interface SalesOrderQueryOptions {
  enabled?: boolean;
  customerId?: number;
}

export function useSalesOrders(options: SalesOrderQueryOptions = {}) {
  return useQuery({
    queryKey: [...queryKeys.salesOrders, { customerId: options.customerId ?? null }],
    queryFn: async () => {
      const response = await fetchSalesOrders(options.customerId);
      return response.content;
    },
    enabled: options.enabled ?? true,
  });
}

export function useSalesOrderDetail(orderId?: number) {
  return useQuery({
    queryKey: queryKeys.salesOrderDetail(orderId ?? 'missing'),
    queryFn: () => fetchSalesOrderDetail(orderId!),
    enabled: Boolean(orderId),
  });
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
    onSuccess: async (_, orderId) => {
      message.success(t('toast.sales.confirmed'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders }),
        queryClient.invalidateQueries({ queryKey: queryKeys.salesOrderDetail(orderId) }),
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
    onSuccess: async (_, orderId) => {
      message.success(t('toast.sales.cancelled'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders }),
        queryClient.invalidateQueries({ queryKey: queryKeys.salesOrderDetail(orderId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
      ]);
    },
    onError,
  });
}
