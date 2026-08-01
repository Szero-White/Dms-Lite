import { App } from 'antd';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return {
    queryClient,
    message,
    t,
    onError(error: unknown) {
      message.error(getErrorMessage(error));
    },
  };
}

export function useCustomers(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.customers,
    queryFn: () => fetchCustomersContent(),
    enabled: options.enabled ?? true,
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
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (payload: CustomerFormValues) => createCustomer(payload),
    onSuccess: async () => {
      message.success(t('toast.customer.created'));
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers });
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
    onSuccess: async () => {
      message.success(t('toast.customer.updated'));
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
    onError,
  });
}

export function useDeleteCustomer() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (customerId: number) => deleteCustomer(customerId),
    onSuccess: async () => {
      message.success(t('toast.customer.deleted'));
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
    onError,
  });
}
