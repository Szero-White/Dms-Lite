export interface DashboardSummary {
  revenueToday: string | number;
  revenueThisMonth: string | number;
  totalReceivable: string | number;
  lowStockItems: number;
  productCount: number;
}

export interface DebtLeader {
  customerId: number;
  customerName: string;
  debtBalance: number;
}

export interface TopSellingProduct {
  productId: number;
  productName: string;
  totalQuantity: number;
  revenue: number;
}

export interface OverdueReceivablePreview {
  salesOrderId: number;
  salesOrderCode: string;
  customerId: number;
  customerName: string;
  remainingAmount: string | number;
  dueDate: string;
  daysOverdue: number;
}

export interface ReceivableAttention {
  overdueAmount: string | number;
  overdueCount: number;
  dueTodayAmount: string | number;
  dueTodayCount: number;
  dueSoonAmount: string | number;
  dueSoonCount: number;
  oldestOverdue?: OverdueReceivablePreview | null;
}

export interface DashboardSnapshot {
  summary: DashboardSummary;
  topCustomersByDebt: DebtLeader[];
  topSellingProducts: TopSellingProduct[];
}
