import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  fetchCustomerDebtStatement,
  fetchCustomersContent,
} from '../../../features/customers';
import { fetchProductRows } from '../../../features/products';
import { queryKeys } from '../../../lib/queryKeys';
import { fetchInventoryHistory } from '../../../services/inventoryService';
import { buildDerivedNotifications } from '../../../services/mockData';
import { fetchNotifications } from '../api/notificationService';

export function useNotifications() {
  const customersQuery = useQuery({
    queryKey: queryKeys.customers,
    queryFn: () => fetchCustomersContent(),
  });
  const productsQuery = useQuery({
    queryKey: queryKeys.products,
    queryFn: fetchProductRows,
  });
  const inventoryHistoryQuery = useQuery({
    queryKey: queryKeys.inventoryHistory,
    queryFn: fetchInventoryHistory,
  });
  const apiNotificationsQuery = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: fetchNotifications,
  });

  const debtQueries = useQueries({
    queries: (customersQuery.data ?? []).map((customer) => ({
      queryKey: queryKeys.customerDebt(customer.id),
      queryFn: () => fetchCustomerDebtStatement(customer.id),
      enabled: Boolean(customersQuery.data?.length),
    })),
  });

  const debtTransactions = debtQueries.flatMap((query) => query.data ?? []);

  const data = useMemo(() => {
    if (
      !customersQuery.data ||
      !productsQuery.data ||
      !inventoryHistoryQuery.data ||
      !apiNotificationsQuery.data
    ) {
      return undefined;
    }

    const apiNotifications = apiNotificationsQuery.data.map((item) => ({
      ...item,
      source: 'api' as const,
    }));

    return [
      ...apiNotifications,
      ...buildDerivedNotifications(
        customersQuery.data,
        productsQuery.data,
        debtTransactions,
        inventoryHistoryQuery.data,
      ),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [
    apiNotificationsQuery.data,
    customersQuery.data,
    debtTransactions,
    inventoryHistoryQuery.data,
    productsQuery.data,
  ]);

  return {
    data,
    isLoading:
      customersQuery.isLoading ||
      productsQuery.isLoading ||
      inventoryHistoryQuery.isLoading ||
      apiNotificationsQuery.isLoading ||
      debtQueries.some((query) => query.isLoading),
    isError:
      customersQuery.isError ||
      productsQuery.isError ||
      inventoryHistoryQuery.isError ||
      apiNotificationsQuery.isError ||
      debtQueries.some((query) => query.isError),
    error:
      customersQuery.error ||
      productsQuery.error ||
      inventoryHistoryQuery.error ||
      apiNotificationsQuery.error ||
      debtQueries.find((query) => query.error)?.error,
  };
}
