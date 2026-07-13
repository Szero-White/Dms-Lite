export type RoleCode = 'OWNER' | 'SALE_STAFF' | 'WAREHOUSE' | 'ACCOUNTANT' | string;
export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | string;

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface AuthUser {
  accessToken: string;
  userId: number;
  tenantId: number;
  username: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface SalesOrderItem {
  id?: number;
  productId: number;
  quantity: number;
  unitPrice: string | number;
  discountAmount: string | number;
  lineTotal: string | number;
}

export interface SalesOrder {
  id: number;
  customerId: number;
  warehouseId: number;
  code: string;
  status: SalesOrderStatus;
  totalAmount: string | number;
  paidAmount: string | number;
  debtAmount: string | number;
  createdAt: string;
  confirmedAt?: string;
  items: SalesOrderItem[];
}

export interface CreateSalesOrderPayload {
  customerId: number;
  warehouseId: number;
  paidAmount: number;
  items: Array<{
    productId: number;
    quantity: number;
    discountAmount: number;
  }>;
}

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
