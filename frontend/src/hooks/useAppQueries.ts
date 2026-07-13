import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  fetchCustomersContent,
} from '../features/customers';
import { fetchProductRows } from '../features/products';
import { fetchSalesOrders } from '../features/sales';
import { queryKeys } from '../lib/queryKeys';
import { fetchDashboardSummary, normalizeDashboardSummary } from '../services/reportService';
import { buildDashboardSnapshot } from '../services/mockData';

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
