export interface RecordPaymentPayload {
  customerId: number;
  amount: number;
  note?: string;
}

export interface PaymentRecord {
  id: number;
  customerId: number;
  amount: string | number;
  note?: string;
  createdAt: string;
}
