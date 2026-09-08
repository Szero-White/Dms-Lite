import { fetchAllPages } from '../../../lib/fetchAllPages';
import { apiClient, unwrapResponse } from '../../../services/apiClient';
import { PageResponse } from '../../../types';
import {
  Customer,
  CustomerFormValues,
  DebtTransaction,
} from '../types/customer.types';

export async function fetchCustomers(keyword = '', page = 0, size = 20) {
  return unwrapResponse<PageResponse<Customer>>(
    apiClient.get('/customers', { params: { keyword, page, size } }),
  );
}

export async function fetchCustomersContent(keyword = '') {
  return fetchAllPages((page, size) => fetchCustomers(keyword, page, size));
}

export async function fetchCustomer(customerId: number) {
  return unwrapResponse<Customer>(apiClient.get(`/customers/${customerId}`));
}

export async function createCustomer(payload: CustomerFormValues) {
  return unwrapResponse<Customer>(apiClient.post('/customers', payload));
}

export async function updateCustomer(customerId: number, payload: CustomerFormValues) {
  return unwrapResponse<Customer>(apiClient.put(`/customers/${customerId}`, payload));
}

export async function deactivateCustomer(customerId: number) {
  return unwrapResponse<Customer>(apiClient.post(`/customers/${customerId}/deactivate`));
}

export async function reactivateCustomer(customerId: number) {
  return unwrapResponse<Customer>(apiClient.post(`/customers/${customerId}/reactivate`));
}

export async function fetchCustomerDebtStatement(customerId: number) {
  return unwrapResponse<DebtTransaction[]>(
    apiClient.get(`/customers/${customerId}/debt-statement`),
  );
}
