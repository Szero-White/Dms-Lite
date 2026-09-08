import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { useMutationFeedback } from '../../../lib/useMutationFeedback';
import type { OutstandingPaymentFilters, PaymentHistoryFilters } from '../types/payment.types';
import {
  fetchOutstandingPaymentOrders,
  fetchPaymentHistory,
  recordSalesOrderPayment,
} from '../api/paymentService';

export function useOutstandingPaymentOrders(
  page = 0,
  filters: OutstandingPaymentFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.paymentOutstanding(page, filters),
    queryFn: () => fetchOutstandingPaymentOrders(page, filters),
    enabled: options.enabled ?? true,
  });
}

export function usePaymentHistory(
  page = 0,
  filters: PaymentHistoryFilters = {},
  options: { enabled?: boolean } = {},
) {
  const { search = '', from, to, sortBy = 'NEWEST', sortDirection = 'DESC' } = filters;
  return useQuery({
    queryKey: queryKeys.paymentHistory(page, search, from, to, sortBy, sortDirection),
    queryFn: () => fetchPaymentHistory(page, { search, from, to, sortBy, sortDirection }),
    enabled: options.enabled ?? true,
  });
}

export function useRecordSalesOrderPayment() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: recordSalesOrderPayment,
    onSuccess: async (payment) => {
      message.success(
        payment.debtAfter !== undefined && Number(payment.debtAfter) <= 0
          ? t('toast.payment.settled', { code: payment.salesOrderCode ?? payment.code })
          : t('toast.payment.recorded', { code: payment.code }),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.paymentOutstandingRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.paymentHistoryRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.customers }),
        queryClient.invalidateQueries({ queryKey: queryKeys.customer(payment.customerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.customerDebt(payment.customerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
        queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders }),
        queryClient.invalidateQueries({ queryKey: queryKeys.salesReportRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.invoicesRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs }),
      ]);
    },
    onError,
  });
}
