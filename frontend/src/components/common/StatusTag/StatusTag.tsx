import type { ReactNode } from 'react';
import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import styles from './StatusTag.module.css';

export type StatusTone =
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

export function SemanticStatusTag({
  tone = 'neutral',
  children,
}: {
  tone?: StatusTone;
  children: ReactNode;
}) {
  return <Tag className={statusClass(tone)}>{children}</Tag>;
}

export function ActiveStatusTag({ active }: { active: boolean }) {
  const { t } = useTranslation();

  return (
    <SemanticStatusTag tone={active ? 'success' : 'neutral'}>
      {active ? t('common.active') : t('common.inactive')}
    </SemanticStatusTag>
  );
}

export function SalesOrderStatusTag({
  status,
}: {
  status: string;
}) {
  const { t } = useTranslation();

  return (
    <SemanticStatusTag tone={SALES_STATUS_MAP[status] || 'neutral'}>
      {t(`status.sales.${status}`, { defaultValue: t('status.sales.UNKNOWN') })}
    </SemanticStatusTag>
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
    return <ActiveStatusTag active={false} />;
  }

  return isLowStock ? (
    <SemanticStatusTag tone="warning">{t('status.product.lowStock')}</SemanticStatusTag>
  ) : (
    <ActiveStatusTag active />
  );
}

export function CustomerDebtTag({
  amount,
}: {
  amount: number;
}) {
  const { t } = useTranslation();

  return (
    <SemanticStatusTag tone={amount > 0 ? 'danger' : 'success'}>
      {amount > 0
        ? t('status.customer.outstanding')
        : t('status.customer.clear')}
    </SemanticStatusTag>
  );
}

export function NotificationTypeTag({
  type,
}: {
  type: string;
}) {
  const { t } = useTranslation();

  return (
    <SemanticStatusTag tone={NOTIFICATION_STATUS_MAP[type] || 'info'}>
      {t(`status.notification.${type}`, { defaultValue: t('status.notification.UNKNOWN') })}
    </SemanticStatusTag>
  );
}
