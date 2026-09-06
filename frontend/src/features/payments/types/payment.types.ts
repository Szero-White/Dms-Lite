export interface RecordPaymentPayload {
  customerId: number;
  amount: number;
  note?: string;
}

export interface PaymentRecord {
  id: number;
  code: string;
  customerId: number;
  amount: string | number;
  note?: string;
  createdAt: string;
}
