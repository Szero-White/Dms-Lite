import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
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
  INVOICE_ISSUED: 'success',
  INVOICE_PAID: 'info',
  INVOICE_CANCELLED: 'danger',
};

function statusClass(tone: StatusTone) {
  return `${styles.tag} ${styles[tone]}`;
}

function enumFallback(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function SalesOrderStatusTag({
  status,
}: {
  status: string;
}) {
  const { t } = useTranslation();

  return (
    <Tag className={statusClass(SALES_STATUS_MAP[status] || 'neutral')}>
      {t(`status.sales.${status}`, enumFallback(status))}
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
  const { t } = useTranslation();

  if (!active) {
    return (
      <Tag className={statusClass('neutral')}>
        {t('common.inactive')}
      </Tag>
    );
  }

  return isLowStock ? (
    <Tag className={statusClass('warning')}>{t('status.product.lowStock')}</Tag>
  ) : (
    <Tag className={statusClass('success')}>{t('common.active')}</Tag>
  );
}

export function CustomerDebtTag({
  amount,
}: {
  amount: number;
}) {
  const { t } = useTranslation();

  return (
    <Tag className={statusClass(amount > 0 ? 'danger' : 'success')}>
      {amount > 0
        ? t('status.customer.outstanding')
        : t('status.customer.clear')}
    </Tag>
  );
}

export function NotificationTypeTag({
  type,
}: {
  type: string;
}) {
  const { t } = useTranslation();

  return (
    <Tag className={statusClass(NOTIFICATION_STATUS_MAP[type] || 'info')}>
      {t(`status.notification.${type}`, enumFallback(type))}
    </Tag>
  );
}