import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelInvoice,
  createInvoice,
  createInvoiceFromSalesOrder,
  fetchInvoices,
  fetchInvoice,
  issueInvoice,
  recordInvoicePayment,
} from '../api/invoiceService';
import type {
  CreateInvoicePayload,
  Invoice,
  InvoicePaymentPayload,
} from '../types/invoice.types';

export function useInvoices(page = 0) {
  return useQuery({
    queryKey: ['invoices', page],
    queryFn: () => fetchInvoices(page),
  });
}

export function useInvoice(invoiceId: number) {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => fetchInvoice(invoiceId),
    enabled: !!invoiceId,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => createInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useCreateInvoiceFromSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (salesOrderId: number) => createInvoiceFromSalesOrder(salesOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
    },
  });
}

export function useIssueInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: number) => issueInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: number) => cancelInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useRecordInvoicePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: number; payload: InvoicePaymentPayload }) =>
      recordInvoicePayment(invoiceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}