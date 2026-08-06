import { apiClient, unwrapResponse } from '../../../services/apiClient';
import type { PageResponse } from '../../../types';
import type {
  CreateInvoicePayload,
  Invoice,
  InvoicePaymentPayload,
} from '../types/invoice.types';

export async function fetchInvoices(page = 0) {
  return unwrapResponse<PageResponse<Invoice>>(
    apiClient.get(`/invoices?page=${page}`)
  );
}

export async function fetchInvoice(invoiceId: number) {
  return unwrapResponse<Invoice>(apiClient.get(`/invoices/${invoiceId}`));
}

export async function createInvoice(payload: CreateInvoicePayload) {
  return unwrapResponse<Invoice>(apiClient.post('/invoices', payload));
}

export async function createInvoiceFromSalesOrder(salesOrderId: number) {
  return unwrapResponse<Invoice>(
    apiClient.post(`/invoices/from-sales-order/${salesOrderId}`)
  );
}

export async function issueInvoice(invoiceId: number) {
  return unwrapResponse<Invoice>(apiClient.post(`/invoices/${invoiceId}/issue`));
}

export async function cancelInvoice(invoiceId: number) {
  return unwrapResponse<Invoice>(apiClient.post(`/invoices/${invoiceId}/cancel`));
}

export async function recordInvoicePayment(
  invoiceId: number,
  payload: InvoicePaymentPayload
) {
  return unwrapResponse<Invoice>(
    apiClient.post(`/invoices/${invoiceId}/payment`, null, {
      params: { amount: payload.amount },
    })
  );
}

export async function generateInvoicePdf(invoiceId: number) {
  const response = await apiClient.get(`/invoices/${invoiceId}/pdf`, {
    responseType: 'blob',
  });
  return response.data;
}