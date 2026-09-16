import { TeamOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../../../../../lib/format';
import type { Customer } from '../../../../types/customer.types';
import styles from './CustomersPulseBar.module.css';

interface CustomersPulseBarProps {
  activeCount: number;
  clearCount: number;
  customers: Customer[];
  debtorCount: number;
  overLimitCount: number;
  thresholdCustomers: number;
  totalReceivables: number;
  showFinancials: boolean;
}

export function CustomersPulseBar({
  activeCount,
  clearCount,
  customers,
  debtorCount,
  overLimitCount,
  thresholdCustomers,
  totalReceivables,
  showFinancials,
}: CustomersPulseBarProps) {
  const { t } = useTranslation();
  const totalCustomers = customers.length;

  const healthRows = [
    { key: 'clear', label: t('customers.pulse.clearBalance'), count: clearCount, tone: 'success' },
    { key: 'debt', label: t('customers.pulse.hasDebt'), count: debtorCount, tone: 'warning' },
    { key: 'over', label: t('customers.pulse.overLimit'), count: overLimitCount, tone: 'danger' },
  ] as const;

  return (
    <section className={styles.pulseBar} aria-label={t('customers.pulse.customerBase')}>
      <div className={styles.summaryBlock}>
        <div className={styles.summaryIcon}><TeamOutlined /></div>
        <div className={styles.summaryContent}>
          <span className={styles.eyebrow}>{t('customers.pulse.customerBase')}</span>
          <strong className={styles.summaryValue}>{totalCustomers}</strong>
          <span className={styles.summaryMeta}>
            {t('customers.pulse.activeInactive', {
              active: activeCount,
              inactive: totalCustomers - activeCount,
            })}
          </span>
        </div>
      </div>

      {showFinancials ? (
        <>
          <div className={styles.divider} />
          <div className={styles.healthBlock}>
            <span className={styles.eyebrow}>{t('customers.pulse.accountHealth')}</span>
            <div className={styles.healthRows}>
              {healthRows.map((row) => (
                <div key={row.key} className={styles.healthItem}>
                  <span className={`${styles.statusDot} ${styles[row.tone]}`} />
                  <span className={styles.healthLabel}>{row.label}</span>
                  <strong className={styles.healthCount}>{row.count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.divider} />
          <div className={styles.receivableBlock}>
            <span className={styles.eyebrow}>{t('payments.hero.totalReceivables')}</span>
            <strong className={styles.receivableValue}>{formatCurrency(totalReceivables)}</strong>
            <span className={styles.summaryMeta}>{t('customers.pulse.acrossDebtors', { count: debtorCount })}</span>
            {thresholdCustomers > 0 ? (
              <span className={styles.warningPill}>
                {t('customers.pulse.nearLimitAlert', { count: thresholdCustomers })}
              </span>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
