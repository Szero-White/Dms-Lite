import { Tag } from 'antd';
import styles from './StatusTag.module.css';

type StatusTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

const SALES_STATUS_MAP: Record<string, StatusTone> = {
  DRAFT: 'neutral',
  CONFIRMED: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const NOTIFICATION_STATUS_MAP: Record<string, StatusTone> = {
  LOW_STOCK: 'warning',
  OVERDUE_DEBT: 'danger',
  PAYMENT_RECORDED: 'info',
  SALES_ORDER_CONFIRMED: 'success',
  SALES_ORDER_CANCELLED: 'neutral',
};

function statusClass(tone: StatusTone) {
  return `${styles.tag} ${styles[tone]}`;
}

export function SalesOrderStatusTag({
  status,
}: {
  status: string;
}) {
  return (
    <Tag className={statusClass(SALES_STATUS_MAP[status] || 'neutral')}>
      {status}
    </Tag>
  );
}

export function ProductStatusTag({
  isLowStock,
  active,
}: {
  isLowStock: boolean;
  active: boolean;
}) {
  if (!active) {
    return (
      <Tag className={statusClass('neutral')}>
        INACTIVE
      </Tag>
    );
  }

  return isLowStock ? (
    <Tag className={statusClass('warning')}>LOW STOCK</Tag>
  ) : (
    <Tag className={statusClass('success')}>ACTIVE</Tag>
  );
}

export function CustomerDebtTag({
  amount,
}: {
  amount: number;
}) {
  return (
    <Tag className={statusClass(amount > 0 ? 'danger' : 'success')}>
      {amount > 0 ? 'Outstanding' : 'Clear'}
    </Tag>
  );
}

export function NotificationTypeTag({
  type,
}: {
  type: string;
}) {
  return (
    <Tag className={statusClass(NOTIFICATION_STATUS_MAP[type] || 'info')}>
      {type}
    </Tag>
  );
}
