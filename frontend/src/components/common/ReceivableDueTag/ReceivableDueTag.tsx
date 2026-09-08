import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ReceivableDueStatus } from '../../../types';
import styles from './ReceivableDueTag.module.css';

interface ReceivableDueTagProps {
  status?: ReceivableDueStatus;
  daysUntilDue?: number | null;
}

function labelKey(status: ReceivableDueStatus, daysUntilDue?: number | null) {
  if (status === 'OVERDUE' && daysUntilDue !== null && daysUntilDue !== undefined) {
    return 'receivables.dueStatus.overdueDays';
  }
  if (status === 'DUE_SOON' && daysUntilDue !== null && daysUntilDue !== undefined) {
    return 'receivables.dueStatus.dueSoonDays';
  }
  if (status === 'CURRENT' && daysUntilDue !== null && daysUntilDue !== undefined) {
    return 'receivables.dueStatus.currentDays';
  }
  return `receivables.dueStatus.${status}`;
}

export function ReceivableDueTag({ status, daysUntilDue }: ReceivableDueTagProps) {
  const { t } = useTranslation();

  if (!status) {
    return null;
  }

  const count = status === 'OVERDUE' && daysUntilDue !== null && daysUntilDue !== undefined
    ? Math.abs(daysUntilDue)
    : daysUntilDue;

  return (
    <Tag className={`${styles.tag} ${styles[status.toLowerCase()]}`}>
      {t(labelKey(status, daysUntilDue), { count })}
    </Tag>
  );
}
