export type SalesOrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | string;

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
