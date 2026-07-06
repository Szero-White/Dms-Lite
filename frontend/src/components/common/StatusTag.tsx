import { Tag } from 'antd';

const SALES_STATUS_MAP: Record<string, string> = {
  DRAFT: 'default',
  CONFIRMED: 'processing',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

const NOTIFICATION_STATUS_MAP: Record<string, string> = {
  LOW_STOCK: 'warning',
  OVERDUE_DEBT: 'error',
  PAYMENT_RECORDED: 'processing',
  SALES_ORDER_CONFIRMED: 'success',
  SALES_ORDER_CANCELLED: 'default',
};

export function SalesOrderStatusTag({ status }: { status: string }) {
  return <Tag color={SALES_STATUS_MAP[status] || 'default'}>{status}</Tag>;
}

export function ProductStatusTag({ isLowStock, active }: { isLowStock: boolean; active: boolean }) {
  if (!active) {
    return <Tag color="default">INACTIVE</Tag>;
  }

  return isLowStock ? <Tag color="warning">LOW STOCK</Tag> : <Tag color="success">ACTIVE</Tag>;
}

export function CustomerDebtTag({ amount }: { amount: number }) {
  return <Tag color={amount > 0 ? 'error' : 'success'}>{amount > 0 ? 'Outstanding' : 'Clear'}</Tag>;
}

export function NotificationTypeTag({ type }: { type: string }) {
  return <Tag color={NOTIFICATION_STATUS_MAP[type] || 'blue'}>{type}</Tag>;
}
