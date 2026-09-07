import { apiClient, unwrapResponse } from '../../../services/apiClient';
import type { PageResponse } from '../../../types';
import type { Invoice } from '../types/invoice.types';

export interface InvoiceListParams {
  page?: number;
  search?: string;
  from?: string;
  to?: string;
}

export function fetchInvoices(params: InvoiceListParams = {}) {
  return unwrapResponse<PageResponse<Invoice>>(apiClient.get('/invoices', { params }));
}

export function fetchInvoice(invoiceId: number) {
  return unwrapResponse<Invoice>(apiClient.get(`/invoices/${invoiceId}`));
}

export function issueInvoice(invoiceId: number) {
  return unwrapResponse<Invoice>(apiClient.post(`/invoices/${invoiceId}/issue`));
}

export async function downloadInvoicePdf(invoiceId: number) {
  const response = await apiClient.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
  return response.data as Blob;
}
