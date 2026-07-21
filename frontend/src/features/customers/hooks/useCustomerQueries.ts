import { App } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { getErrorMessage } from '../../../lib/format';
import {
  createCustomer,
  deleteCustomer,
  fetchCustomerDebtStatement,
  fetchCustomersContent,
  updateCustomer,
} from '../api/customerService';
import { CustomerFormValues } from '../types/customer.types';

function useMutationFeedback() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return {
    queryClient,
    message,
    onError(error: unknown) {
      message.error(getErrorMessage(error));
    },
  };
}

export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers,
    queryFn: () => fetchCustomersContent(),
  });
}

export function useCustomerDebtStatement(customerId?: number) {
  return useQuery({
    queryKey: queryKeys.customerDebt(customerId ?? 'missing'),
    queryFn: () => fetchCustomerDebtStatement(customerId!),
    enabled: Boolean(customerId),
  });
}

export function useCreateCustomer() {
  const { queryClient, message, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (payload: CustomerFormValues) => createCustomer(payload),
    onSuccess: async () => {
      message.success('Customer created.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
    onError,
  });
}

export function useUpdateCustomer() {
  const { queryClient, message, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: ({
      customerId,
      payload,
    }: {
      customerId: number;
      payload: CustomerFormValues;
    }) => updateCustomer(customerId, payload),
    onSuccess: async () => {
      message.success('Customer updated.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
    onError,
  });
}

export function useDeleteCustomer() {
  const { queryClient, message, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (customerId: number) => deleteCustomer(customerId),
    onSuccess: async () => {
      message.success('Customer deleted.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
    onError,
  });
}
