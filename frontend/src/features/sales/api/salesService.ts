import { apiClient, unwrapResponse } from '../../../services/apiClient';
import type { PageResponse } from '../../../types';
import type {
  CreateSalesOrderPayload,
  SalesOrder,
} from '../types/sales.types';

export async function fetchSalesOrders() {
  return unwrapResponse<PageResponse<SalesOrder>>(apiClient.get('/sales-orders'));
}

export async function createSalesOrder(payload: CreateSalesOrderPayload) {
  return unwrapResponse<SalesOrder>(apiClient.post('/sales-orders', payload));
}

export async function confirmSalesOrder(orderId: number) {
  return unwrapResponse<SalesOrder>(apiClient.post(`/sales-orders/${orderId}/confirm`));
}

export async function cancelSalesOrder(orderId: number) {
  return unwrapResponse<SalesOrder>(apiClient.post(`/sales-orders/${orderId}/cancel`));
}
