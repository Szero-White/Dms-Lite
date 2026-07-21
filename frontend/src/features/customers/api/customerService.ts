import { apiClient, unwrapResponse } from '../../../services/apiClient';
import { PageResponse } from '../../../types';
import {
  Customer,
  CustomerFormValues,
  DebtTransaction,
} from '../types/customer.types';

export async function fetchCustomers(keyword = '') {
  return unwrapResponse<PageResponse<Customer>>(
    apiClient.get('/customers', { params: { keyword } }),
  );
}

export async function fetchCustomersContent(keyword = '') {
  const response = await fetchCustomers(keyword);

  return response.content;
}

export async function createCustomer(payload: CustomerFormValues) {
  return unwrapResponse<Customer>(apiClient.post('/customers', payload));
}

export async function updateCustomer(customerId: number, payload: CustomerFormValues) {
  return unwrapResponse<Customer>(apiClient.put(`/customers/${customerId}`, payload));
}

export async function deleteCustomer(customerId: number) {
  return unwrapResponse<void>(apiClient.delete(`/customers/${customerId}`));
}

export async function fetchCustomerDebtStatement(customerId: number) {
  return unwrapResponse<DebtTransaction[]>(
    apiClient.get(`/customers/${customerId}/debt-statement`),
  );
}
