export interface Customer {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  creditLimit: string | number;
  paymentTermDays: number;
  debtBalance: string | number;
  active: boolean;
}

export interface CustomerFormValues {
  name: string;
  phone?: string;
  address?: string;
  creditLimit?: number;
  paymentTermDays?: number;
}

export interface DebtTransaction {
  id: number;
  customerId: number;
  sourceType: string;
  sourceId: number;
  direction: 'INCREASE' | 'DECREASE' | string;
  amount: string | number;
  remainingAmount: string | number;
  dueDate?: string;
  note?: string;
  createdAt: string;
}
