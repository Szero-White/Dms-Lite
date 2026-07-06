import { useMemo } from 'react';
import { App } from 'antd';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { getErrorMessage, toNumber } from '../lib/format';
import { createCustomer, fetchCustomerDebtStatement, fetchCustomers } from '../services/customerService';
import { fetchInventoryHistory, fetchInventoryStock } from '../services/inventoryService';
import { fetchProducts, createProduct, updateProduct } from '../services/productService';
import { fetchDashboardSummary, normalizeDashboardSummary } from '../services/reportService';
import { cancelSalesOrder, confirmSalesOrder, createSalesOrder, fetchSalesOrders } from '../services/salesService';
import { recordCustomerPayment } from '../services/paymentService';
import { fetchAuditLogs } from '../services/auditService';
import { fetchNotifications } from '../services/notificationService';
import { buildDashboardSnapshot, buildDerivedNotifications, enrichAuditLogs } from '../services/mockData';
import { CreateSalesOrderPayload, CustomerFormValues, ProductFormValues, ProductRow } from '../types';

function mapProductsWithStock(productsPage: Awaited<ReturnType<typeof fetchProducts>>, stockItems: Awaited<ReturnType<typeof fetchInventoryStock>>): ProductRow[] {
  const stockMap = new Map(stockItems.map((item) => [item.productId, item.quantityOnHand]));

  return productsPage.content.map((product) => {
    const stock = stockMap.get(product.id) ?? 0;
    return {
      ...product,
      stock,
      status: product.active ? 'ACTIVE' : 'INACTIVE',
      isLowStock: stock <= product.minStock,
    };
  });
}

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: async () => {
      const [productsPage, stockItems] = await Promise.all([fetchProducts(), fetchInventoryStock()]);
      return mapProductsWithStock(productsPage, stockItems);
    },
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers,
    queryFn: async () => {
      const response = await fetchCustomers();
      return response.content;
    },
  });
}

export function useSalesOrders() {
  return useQuery({
    queryKey: queryKeys.salesOrders,
    queryFn: async () => {
      const response = await fetchSalesOrders();
      return response.content;
    },
  });
}

export function useInventoryStock() {
  return useQuery({
    queryKey: queryKeys.inventoryStock,
    queryFn: fetchInventoryStock,
  });
}

export function useInventoryHistory() {
  return useQuery({
    queryKey: queryKeys.inventoryHistory,
    queryFn: fetchInventoryHistory,
  });
}

export function useCustomerDebtStatement(customerId?: number) {
  return useQuery({
    queryKey: queryKeys.customerDebt(customerId ?? 'missing'),
    queryFn: () => fetchCustomerDebtStatement(customerId!),
    enabled: Boolean(customerId),
  });
}

export function useDashboardData() {
  const results = useQueries({
    queries: [
      { queryKey: queryKeys.dashboard, queryFn: fetchDashboardSummary },
      { queryKey: queryKeys.customers, queryFn: async () => (await fetchCustomers()).content },
      { queryKey: queryKeys.products, queryFn: async () => {
        const [productsPage, stockItems] = await Promise.all([fetchProducts(), fetchInventoryStock()]);
        return mapProductsWithStock(productsPage, stockItems);
      } },
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

export function useAuditLogs() {
  return useQuery({
    queryKey: queryKeys.auditLogs,
    queryFn: async () => {
      const page = await fetchAuditLogs();
      return enrichAuditLogs(page.content);
    },
  });
}

export function useNotifications() {
  const customersQuery = useCustomers();
  const productsQuery = useProducts();
  const inventoryHistoryQuery = useInventoryHistory();
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
    if (!customersQuery.data || !productsQuery.data || !inventoryHistoryQuery.data || !apiNotificationsQuery.data) {
      return undefined;
    }

    const apiNotifications = apiNotificationsQuery.data.map((item) => ({
      ...item,
      source: 'api' as const,
    }));

    return [...apiNotifications, ...buildDerivedNotifications(customersQuery.data, productsQuery.data, debtTransactions, inventoryHistoryQuery.data)]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [apiNotificationsQuery.data, customersQuery.data, debtTransactions, inventoryHistoryQuery.data, productsQuery.data]);

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

function useMutationFeedback() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return {
    queryClient,
    message,
    onError(error: any) {
      message.error(getErrorMessage(error));
    },
  };
}

export function useCreateProduct() {
  const { queryClient, message, onError } = useMutationFeedback();
  return useMutation({
    mutationFn: (payload: ProductFormValues) => createProduct(payload),
    onSuccess: async () => {
      message.success('Product saved.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.products }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
    onError,
  });
}

export function useUpdateProduct() {
  const { queryClient, message, onError } = useMutationFeedback();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number; payload: ProductFormValues }) => updateProduct(productId, payload),
    onSuccess: async () => {
      message.success('Product updated.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
    onError,
  });
}

export function useCreateCustomer() {
  const { queryClient, message, onError } = useMutationFeedback();
  return useMutation({
    mutationFn: (payload: CustomerFormValues) => createCustomer(payload),
    onSuccess: async () => {
      message.success('Customer created.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
    onError,
  });
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

export function useRecordCustomerPayment() {
  const { queryClient, message, onError } = useMutationFeedback();
  return useMutation({
    mutationFn: recordCustomerPayment,
    onSuccess: async (payment) => {
      message.success(`Payment of ${toNumber(payment.amount).toLocaleString('en-US')} VND recorded.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.customers }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
        queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs }),
      ]);
    },
    onError,
  });
}
