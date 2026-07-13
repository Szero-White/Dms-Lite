import { App } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { getErrorMessage } from '../../../lib/format';
import {
  createCustomer,
  fetchCustomerDebtStatement,
  fetchCustomersContent,
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
