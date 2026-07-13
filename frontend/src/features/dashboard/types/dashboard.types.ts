export interface DashboardSummary {
  revenueToday: string | number;
  revenueThisMonth: string | number;
  totalReceivable: string | number;
  payableDebt: string | number;
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

export interface DashboardSnapshot {
  summary: DashboardSummary;
  topCustomersByDebt: DebtLeader[];
  topSellingProducts: TopSellingProduct[];
}
