export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED' | 'OVERDUE' | string;

export interface InvoiceItem {
  id: number;
  productId: number;
  productName?: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerName?: string;
  salesOrderId: number;
  salesOrderCode?: string;
  status: InvoiceStatus;
  issueDate?: string;
  dueDate?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number | null;
  remainingAmount: number | null;
  notes?: string;
  companyName?: string;
  createdAt: string;
  updatedAt?: string;
  items: InvoiceItem[];
}
