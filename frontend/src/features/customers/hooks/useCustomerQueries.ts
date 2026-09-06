import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { useMutationFeedback } from '../../../lib/useMutationFeedback';
import {
  createCustomer,
  deactivateCustomer,
  fetchCustomer,
  fetchCustomerDebtStatement,
  fetchCustomersContent,
  reactivateCustomer,
  updateCustomer,
} from '../api/customerService';
import { CustomerFormValues } from '../types/customer.types';


export function useCustomers(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.customers,
    queryFn: () => fetchCustomersContent(),
    enabled: options.enabled ?? true,
  });
}

export function useCustomer(customerId?: number, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.customer(customerId ?? 'missing'),
    queryFn: () => fetchCustomer(customerId!),
    enabled: Boolean(customerId) && (options.enabled ?? true),
  });
}

export function useCustomerDebtStatement(
  customerId?: number,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.customerDebt(customerId ?? 'missing'),
    queryFn: () => fetchCustomerDebtStatement(customerId!),
    enabled: Boolean(customerId) && (options.enabled ?? true),
  });
}

export function useCreateCustomer() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (payload: CustomerFormValues) => createCustomer(payload),
    onSuccess: async () => {
      message.success(t('toast.customer.created'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.customers }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
    onError,
  });
}

export function useUpdateCustomer() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: ({
      customerId,
      payload,
    }: {
      customerId: number;
      payload: CustomerFormValues;
    }) => updateCustomer(customerId, payload),
    onSuccess: async (_, variables) => {
      message.success(t('toast.customer.updated'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.customers }),
        queryClient.invalidateQueries({ queryKey: queryKeys.customer(variables.customerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
    onError,
  });
}

export function useDeactivateCustomer() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (customerId: number) => deactivateCustomer(customerId),
    onSuccess: async (_, customerId) => {
      message.success(t('toast.customer.deactivated'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.customers }),
        queryClient.invalidateQueries({ queryKey: queryKeys.customer(customerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
    onError,
  });
}

export function useReactivateCustomer() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (customerId: number) => reactivateCustomer(customerId),
    onSuccess: async (_, customerId) => {
      message.success(t('toast.customer.reactivated'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.customers }),
        queryClient.invalidateQueries({ queryKey: queryKeys.customer(customerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
    onError,
  });
}
