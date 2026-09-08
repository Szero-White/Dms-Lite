import type { ReceivableDueStatus } from '../../../types';

export interface PaymentHistoryFilters {
  search?: string;
  from?: string;
  to?: string;
}

export interface OutstandingPaymentFilters {
  search?: string;
  dueStatuses?: ReceivableDueStatus[];
  dueFrom?: string;
  dueTo?: string;
  minRemaining?: number;
  maxRemaining?: number;
}

export interface RecordPaymentPayload {
  salesOrderId: number;
  amount: number;
  note?: string;
  requestKey: string;
}

export interface OutstandingPaymentOrder {
  salesOrderId: number;
  salesOrderCode: string;
  customerId: number;
  customerName: string;
  totalAmount: string | number;
  paidAmount: string | number;
  remainingAmount: string | number;
  dueDate?: string;
  confirmedAt?: string;
  dueStatus?: ReceivableDueStatus;
  daysUntilDue?: number;
}

export interface PaymentRecord {
  id: number;
  code: string;
  customerId: number;
  customerName?: string;
  salesOrderId?: number;
  salesOrderCode?: string;
  salesOrderTotal?: string | number;
  amount: string | number;
  debtBefore?: string | number;
  debtAfter?: string | number;
  note?: string;
  recordedBy?: string;
  createdAt: string;
  legacy: boolean;
}
