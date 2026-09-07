import { apiClient, unwrapResponse } from '../../../services/apiClient';
import type { PageResponse } from '../../../types';
import type {
  OutstandingPaymentOrder,
  PaymentHistoryFilters,
  PaymentRecord,
  RecordPaymentPayload,
} from '../types/payment.types';

export function fetchOutstandingPaymentOrders(page = 0, search = '') {
  return unwrapResponse<PageResponse<OutstandingPaymentOrder>>(
    apiClient.get('/payments/outstanding-orders', { params: { page, search } }),
  );
}

export function fetchPaymentHistory(page = 0, filters: PaymentHistoryFilters = {}) {
  const { search = '', from, to } = filters;
  return unwrapResponse<PageResponse<PaymentRecord>>(
    apiClient.get('/payments/history', { params: { page, search, from, to } }),
  );
}

export async function recordSalesOrderPayment(payload: RecordPaymentPayload) {
  return unwrapResponse<PaymentRecord>(apiClient.post('/payments', payload));
}

export async function downloadPaymentReceipt(paymentId: number) {
  const response = await apiClient.get(`/payments/${paymentId}/receipt.pdf`, {
    responseType: 'blob',
  });
  return response.data as Blob;
}
