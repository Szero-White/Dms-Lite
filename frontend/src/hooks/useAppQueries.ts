import { useMemo } from 'react';
import { App } from 'antd';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCustomerDebtStatement,
  fetchCustomersContent,
} from '../features/customers';
import { fetchProductRows } from '../features/products';
import { queryKeys } from '../lib/queryKeys';
import { getErrorMessage, toNumber } from '../lib/format';
import { fetchDashboardSummary, normalizeDashboardSummary } from '../services/reportService';
import { cancelSalesOrder, confirmSalesOrder, createSalesOrder, fetchSalesOrders } from '../services/salesService';
import { buildDashboardSnapshot } from '../services/mockData';
import { CreateSalesOrderPayload } from '../types';

export function useSalesOrders() {
  return useQuery({
    queryKey: queryKeys.salesOrders,
    queryFn: async () => {
      const response = await fetchSalesOrders();
      return response.content;
    },
  });
}

export function useDashboardData() {
  const results = useQueries({
    queries: [
      { queryKey: queryKeys.dashboard, queryFn: fetchDashboardSummary },
      { queryKey: queryKeys.customers, queryFn: () => fetchCustomersContent() },
      { queryKey: queryKeys.products, queryFn: fetchProductRows },
      { queryKey: queryKeys.salesOrders, queryFn: async () => (await fetchSalesOrders()).content },
    ],
  });

  const [summaryQuery, customersQuery, productsQuery, ordersQuery] = results;

  const data = useMemo(() => {
    if (!summaryQuery.data || !customersQuery.data || !productsQuery.data || !ordersQuery.data) {
      return undefined;
    }

    return buildDashboardSnapshot(
      normalizeDashboardSummary(summaryQuery.data),
      customersQuery.data,
      productsQuery.data,
      ordersQuery.data,
    );
  }, [customersQuery.data, ordersQuery.data, productsQuery.data, summaryQuery.data]);

  return {
    data,
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
    error: results.find((result) => result.error)?.error,
    refetch: () => Promise.all(results.map((result) => result.refetch())),
  };
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
