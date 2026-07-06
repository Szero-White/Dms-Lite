import { apiClient, unwrapResponse } from './apiClient';
import { PaymentRecord, RecordPaymentPayload } from '../types';

export async function recordCustomerPayment(payload: RecordPaymentPayload) {
  return unwrapResponse<PaymentRecord>(apiClient.post('/payments/customer', payload));
}
