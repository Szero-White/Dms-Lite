import { App } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { getErrorMessage, toNumber } from '../../../lib/format';
import { recordCustomerPayment } from '../api/paymentService';

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

export function useRecordCustomerPayment() {
  const { queryClient, message, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: recordCustomerPayment,
    onSuccess: async (payment) => {
      message.success(
        `Payment of ${toNumber(payment.amount).toLocaleString('en-US')} VND recorded.`,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.customers }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
        queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs }),
      ]);
    },
    onError,
  });
}
