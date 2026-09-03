export type SalesOrderStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';

export interface SalesOrderItem {
  id?: number;
  productId: number;
  quantity: number;
  unitPrice: string | number | null;
  discountAmount: string | number | null;
  lineTotal: string | number | null;
}

export interface SalesOrder {
  id: number;
  customerId: number;
  warehouseId: number;
  code: string;
  status: SalesOrderStatus;
  totalAmount: string | number | null;
  paidAmount: string | number | null;
  debtAmount: string | number | null;
  createdAt: string;
  confirmedAt?: string;
  items?: SalesOrderItem[];
}

export interface CreateSalesOrderPayload {
  customerId: number;
  warehouseId: number;
  items: Array<{
    productId: number;
    quantity: number;
    discountAmount: number;
  }>;
}
