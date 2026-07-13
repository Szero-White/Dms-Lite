import { apiClient, unwrapResponse } from '../../../services/apiClient';
import {
  PaymentRecord,
  RecordPaymentPayload,
} from '../types/payment.types';

export async function recordCustomerPayment(payload: RecordPaymentPayload) {
  return unwrapResponse<PaymentRecord>(
    apiClient.post('/payments/customer', payload),
  );
}
