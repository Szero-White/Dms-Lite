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
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const NOTIFICATION_STATUS_MAP: Record<string, StatusTone> = {
  LOW_STOCK: 'warning',
  OVERDUE_DEBT: 'danger',
  PAYMENT_RECORDED: 'info',
  INVOICE_ISSUED: 'info',
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
  const { t } = useTranslation();

  return (
    <Tag className={statusClass(SALES_STATUS_MAP[status] || 'neutral')}>
      {t(`status.sales.${status}`, { defaultValue: t('status.sales.UNKNOWN') })}
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
      {t(`status.notification.${type}`, { defaultValue: t('status.notification.UNKNOWN') })}
    </Tag>
  );
}