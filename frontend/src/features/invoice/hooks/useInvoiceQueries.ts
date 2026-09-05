import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { useMutationFeedback } from '../../../lib/useMutationFeedback';
import {
  cancelInvoice,
  createInvoiceFromSalesOrder,
  fetchInvoice,
  fetchInvoices,
  issueInvoice,
} from '../api/invoiceService';

export function useInvoices(page = 0) {
  return useQuery({
    queryKey: queryKeys.invoices(page),
    queryFn: () => fetchInvoices(page),
  });
}

export function useInvoice(invoiceId?: number) {
  return useQuery({
    queryKey: queryKeys.invoice(invoiceId ?? 'missing'),
    queryFn: () => fetchInvoice(invoiceId!),
    enabled: Boolean(invoiceId),
  });
}

export function useCreateInvoiceFromSalesOrder() {
  const { queryClient, message, t, onError } = useMutationFeedback();
  return useMutation({
    mutationFn: (salesOrderId: number) => createInvoiceFromSalesOrder(salesOrderId),
    onSuccess: async (invoice) => {
      message.success(t('toast.invoice.created', { number: invoice.invoiceNumber }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.invoicesRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs }),
      ]);
    },
    onError,
  });
}

export function useIssueInvoice() {
  const { queryClient, message, t, onError } = useMutationFeedback();
  return useMutation({
    mutationFn: (invoiceId: number) => issueInvoice(invoiceId),
    onSuccess: async (_, invoiceId) => {
      message.success(t('toast.invoice.issued'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.invoicesRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.invoice(invoiceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs }),
      ]);
    },
    onError,
  });
}

export function useCancelInvoice() {
  const { queryClient, message, t, onError } = useMutationFeedback();
  return useMutation({
    mutationFn: (invoiceId: number) => cancelInvoice(invoiceId),
    onSuccess: async (_, invoiceId) => {
      message.success(t('toast.invoice.cancelled'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.invoicesRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.invoice(invoiceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs }),
      ]);
    },
    onError,
  });
}
