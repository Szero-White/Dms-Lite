import { apiClient, unwrapResponse } from './apiClient';
import { Customer, CustomerFormValues, DebtTransaction, PageResponse } from '../types';

export async function fetchCustomers(keyword = '') {
  return unwrapResponse<PageResponse<Customer>>(apiClient.get('/customers', { params: { keyword } }));
}

export async function createCustomer(payload: CustomerFormValues) {
  return unwrapResponse<Customer>(apiClient.post('/customers', payload));
}

export async function fetchCustomerDebtStatement(customerId: number) {
  return unwrapResponse<DebtTransaction[]>(apiClient.get(`/customers/${customerId}/debt-statement`));
}
