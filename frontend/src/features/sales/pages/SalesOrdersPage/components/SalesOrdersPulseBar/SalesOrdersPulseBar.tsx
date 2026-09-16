import { ClockCircleOutlined, FileTextOutlined, StopOutlined, TrophyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { SalesOrderStatus } from '../../../../types/sales.types';
import styles from './SalesOrdersPulseBar.module.css';

interface SalesOrdersPulseBarProps {
  totalOrders: number;
  activeOrders: number;
  draftCount: number;
  completedCount: number;
  cancelledCount: number;
  statusFilters: SalesOrderStatus[];
  onStatusFiltersChange: (statuses: SalesOrderStatus[]) => void;
}

export function SalesOrdersPulseBar({
  totalOrders,
  activeOrders,
  draftCount,
  completedCount,
  cancelledCount,
  statusFilters,
  onStatusFiltersChange,
}: SalesOrdersPulseBarProps) {
  const { t } = useTranslation();

  const isStatusSelected = (status: SalesOrderStatus) => statusFilters.includes(status);
  const toggleStatus = (status: SalesOrderStatus) => {
    onStatusFiltersChange(
      statusFilters.includes(status)
        ? statusFilters.filter((value) => value !== status)
        : [...statusFilters, status],
    );
  };

  const statuses = [
    { status: 'DRAFT' as const, count: draftCount, icon: <ClockCircleOutlined />, tone: 'warning' },
    { status: 'COMPLETED' as const, count: completedCount, icon: <TrophyOutlined />, tone: 'success' },
    { status: 'CANCELLED' as const, count: cancelledCount, icon: <StopOutlined />, tone: 'danger' },
  ];

  return (
    <section className={styles.pulseBar} aria-label={t('sales.pulse.pipeline')}>
      <div className={styles.summaryBlock}>
        <div className={styles.summaryIcon}><FileTextOutlined /></div>
        <div className={styles.summaryContent}>
          <span className={styles.eyebrow}>{t('sales.pulse.pipeline')}</span>
          <strong className={styles.summaryValue}>{totalOrders}</strong>
          <span className={styles.summaryMeta}>
            {t('sales.pulse.activeInactive', { active: activeOrders, inactive: totalOrders - activeOrders })}
          </span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.statusBlock}>
        <span className={styles.eyebrow}>{t('sales.pulse.orderStatus')}</span>
        <div className={styles.statusGrid}>
          {statuses.map((item) => {
            const selected = isStatusSelected(item.status);
            const percentage = totalOrders > 0 ? (item.count / totalOrders) * 100 : 0;
            return (
              <button
                key={item.status}
                type="button"
                className={`${styles.statusButton} ${selected ? styles.selected : ''}`}
                onClick={() => toggleStatus(item.status)}
                aria-pressed={selected}
              >
                <span className={`${styles.statusIcon} ${styles[item.tone]}`}>{item.icon}</span>
                <span className={styles.statusText}>
                  <span>{t(`status.sales.${item.status}`)}</span>
                  <strong>{item.count}</strong>
                </span>
                <span className={styles.statusTrack} aria-hidden="true">
                  <span
                    className={`${styles.statusFill} ${styles[item.tone]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
