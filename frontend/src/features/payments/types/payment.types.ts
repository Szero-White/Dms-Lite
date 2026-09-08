import type { ReceivableDueStatus } from '../../../types';

export type PaymentHistorySortField =
  | 'NEWEST'
  | 'PAYMENT_CODE'
  | 'SALES_ORDER'
  | 'CUSTOMER'
  | 'AMOUNT'
  | 'DEBT_AFTER'
  | 'NOTE';

export interface PaymentHistoryFilters {
  search?: string;
  from?: string;
  to?: string;
  sortBy?: PaymentHistorySortField;
  sortDirection?: SortDirection;
}

export type OutstandingPaymentSortField =
  | 'NEWEST'
  | 'ORDER_CODE'
  | 'CUSTOMER'
  | 'TOTAL_AMOUNT'
  | 'PAID_AMOUNT'
  | 'REMAINING_AMOUNT'
  | 'DUE_DATE'
  | 'DUE_STATUS';

export type SortDirection = 'ASC' | 'DESC';

export interface OutstandingPaymentFilters {
  search?: string;
  dueStatuses?: ReceivableDueStatus[];
  dueFrom?: string;
  dueTo?: string;
  minRemaining?: number;
  maxRemaining?: number;
  sortBy?: OutstandingPaymentSortField;
  sortDirection?: SortDirection;
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
