import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { useMutationFeedback } from '../../../lib/useMutationFeedback';
import { fetchInvoice, fetchInvoices, issueInvoice } from '../api/invoiceService';
import type { InvoiceSortDirection, InvoiceSortField } from '../types/invoice.types';

export function useInvoices(
  page = 0,
  filters: { search?: string; from?: string; to?: string; sortBy?: InvoiceSortField; sortDirection?: InvoiceSortDirection } = {},
) {
  const search = filters.search ?? '';
  const from = filters.from;
  const to = filters.to;
  const sortBy = filters.sortBy ?? 'NEWEST';
  const sortDirection = filters.sortDirection ?? 'DESC';

  return useQuery({
    queryKey: queryKeys.invoices(page, search, from, to, sortBy, sortDirection),
    queryFn: () => fetchInvoices({ page, search, from, to, sortBy, sortDirection }),
  });
}

export function useInvoice(invoiceId?: number) {
  return useQuery({
    queryKey: queryKeys.invoice(invoiceId ?? 'missing'),
    queryFn: () => fetchInvoice(invoiceId!),
    enabled: Boolean(invoiceId),
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
