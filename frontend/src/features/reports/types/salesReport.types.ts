import type { SalesOrderStatus } from '../../sales';

export interface SalesReportSummary {
  recognizedRevenue: string | number;
  totalOrders: number;
  averageCompletedOrderValue: string | number;
  completedOrders: number;
}

export interface SalesReportOrder {
  id: number;
  code: string;
  customerId: number;
  customerName: string;
  status: SalesOrderStatus;
  totalAmount: string | number;
  collectedAmount: string | number | null;
  remainingReceivable: string | number | null;
  collectionProgress: number | null;
  receivableRecognized: boolean;
  reportDate: string;
  createdAt: string;
  confirmedAt?: string | null;
}

export interface SalesReport {
  summary: SalesReportSummary;
  orders: SalesReportOrder[];
}
