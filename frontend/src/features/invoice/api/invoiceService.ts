import { apiClient, unwrapResponse } from '../../../services/apiClient';
import type { PageResponse } from '../../../types';
import type { Invoice } from '../types/invoice.types';

export function fetchInvoices(page = 0) {
  return unwrapResponse<PageResponse<Invoice>>(apiClient.get(`/invoices?page=${page}`));
}

export function fetchInvoice(invoiceId: number) {
  return unwrapResponse<Invoice>(apiClient.get(`/invoices/${invoiceId}`));
}

export function createInvoiceFromSalesOrder(salesOrderId: number) {
  return unwrapResponse<Invoice>(apiClient.post(`/invoices/from-sales-order/${salesOrderId}`));
}

export function issueInvoice(invoiceId: number) {
  return unwrapResponse<Invoice>(apiClient.post(`/invoices/${invoiceId}/issue`));
}

export function cancelInvoice(invoiceId: number) {
  return unwrapResponse<Invoice>(apiClient.post(`/invoices/${invoiceId}/cancel`));
}

export async function downloadInvoicePdf(invoiceId: number) {
  const response = await apiClient.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
  return response.data as Blob;
}
