import { App } from 'antd';
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

export function useSalesOrders() {
  return useQuery({
    queryKey: queryKeys.salesOrders,
    queryFn: async () => {
      const response = await fetchSalesOrders();
      return response.content;
    },
  });
}

function useMutationFeedback() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return {
    queryClient,
    message,
    onError(error: unknown) {
      message.error(getErrorMessage(error));
    },
  };
}

export function useCreateSalesOrder() {
  const { queryClient, message, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (payload: CreateSalesOrderPayload) => createSalesOrder(payload),
    onSuccess: async () => {
      message.success('Sales order created.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders });
    },
    onError,
  });
}

export function useConfirmSalesOrder() {
  const { queryClient, message, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (orderId: number) => confirmSalesOrder(orderId),
    onSuccess: async () => {
      message.success('Sales order confirmed.');
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
  const { queryClient, message, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (orderId: number) => cancelSalesOrder(orderId),
    onSuccess: async () => {
      message.success('Sales order cancelled.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
      ]);
    },
    onError,
  });
}
