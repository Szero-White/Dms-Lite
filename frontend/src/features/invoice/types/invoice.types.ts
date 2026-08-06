export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PAID'
  | 'CANCELLED'
  | 'OVERDUE'
  | string;

export interface InvoiceItem {
  id?: number;
  productId: number;
  productName?: string;
  productCode?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: string;
  taxAmount?: number;
  lineTotal?: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  salesOrderId?: number;
  status: InvoiceStatus;
  issueDate?: string;
  dueDate?: string;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  taxRate?: string;
  notes?: string;
  companyName?: string;
  companyAddress?: string;
  companyTaxCode?: string;
  customerName?: string;
  customerAddress?: string;
  customerTaxCode?: string;
  createdAt: string;
  updatedAt?: string;
  items: InvoiceItem[];
}

export interface CreateInvoicePayload {
  customerId: number;
  salesOrderId?: number;
  issueDate: string;
  dueDate?: string;
  taxRate?: string;
  notes?: string;
  companyName?: string;
  companyAddress?: string;
  companyTaxCode?: string;
  customerName?: string;
  customerAddress?: string;
  customerTaxCode?: string;
  items: InvoiceItem[];
}

export interface InvoicePaymentPayload {
  amount: number;
}