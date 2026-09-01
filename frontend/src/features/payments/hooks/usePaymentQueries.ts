import { useMutation } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { useMutationFeedback } from '../../../lib/useMutationFeedback';
import { recordCustomerPayment } from '../api/paymentService';


export function useRecordCustomerPayment() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: recordCustomerPayment,
    onSuccess: async (payment) => {
      message.success(t('toast.payment.recorded'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.customers }),
        queryClient.invalidateQueries({ queryKey: queryKeys.customer(payment.customerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.customerDebt(payment.customerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
        queryClient.invalidateQueries({ queryKey: queryKeys.salesOrders }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs }),
      ]);
    },
    onError,
  });
}
