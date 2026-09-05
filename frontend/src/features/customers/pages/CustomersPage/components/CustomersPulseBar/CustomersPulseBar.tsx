import { useTranslation } from 'react-i18next';
import type { Customer } from '../../../../types/customer.types';
import { formatCurrency } from '../../../../../../lib/format';
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
  const activeArc = totalCustomers > 0 ? (activeCount / totalCustomers) * 201 : 0;


  return (
    <div className={styles.pulseBar}>
      <div className={styles.pulseHero}>
        <div className={styles.pulseRingWrap}>
          <svg viewBox="0 0 80 80" className={styles.pulseRing}>
            <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke="url(#customerPulseGradient)"
              strokeWidth="8"
              strokeDasharray={`${activeArc} 201`}
              strokeDashoffset="50"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="customerPulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className={styles.pulseRingCenter}>
            <span className={styles.pulseRingNum}>{totalCustomers}</span>
            <span className={styles.pulseRingLbl}>{t('sales.pulse.total')}</span>
          </div>
        </div>
        <div className={styles.pulseHeroText}>
          <div className={styles.pulseHeroTitle}>{t('customers.pulse.customerBase')}</div>
          <div className={styles.pulseHeroSub}>
            {t('customers.pulse.activeInactive', { active: activeCount, inactive: totalCustomers - activeCount })}
          </div>
        </div>
      </div>

      {showFinancials ? (
        <>
          <div className={styles.pulseDivider} />
          <div className={styles.pulseTiers}>
            <div className={styles.tierTitle}>{t('customers.pulse.accountHealth')}</div>
            <div className={styles.tierRow}>
              <div className={styles.tierDot} style={{ background: '#10b981' }} />
              <span className={styles.tierLbl}>{t('customers.pulse.clearBalance')}</span>
              <div className={styles.tierBar}>
                <div
                  className={styles.tierFill}
                  style={{
                    width: `${totalCustomers ? (clearCount / totalCustomers) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #10b981, #34d399)',
                  }}
                />
              </div>
              <span className={styles.tierCount} style={{ color: '#10b981' }}>{clearCount}</span>
            </div>
            <div className={styles.tierRow}>
              <div className={styles.tierDot} style={{ background: '#f59e0b' }} />
              <span className={styles.tierLbl}>{t('customers.pulse.hasDebt')}</span>
              <div className={styles.tierBar}>
                <div
                  className={styles.tierFill}
                  style={{
                    width: `${totalCustomers ? (debtorCount / totalCustomers) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  }}
                />
              </div>
              <span className={styles.tierCount} style={{ color: '#f59e0b' }}>{debtorCount}</span>
            </div>
            <div className={styles.tierRow}>
              <div className={styles.tierDot} style={{ background: '#ef4444' }} />
              <span className={styles.tierLbl}>{t('customers.pulse.overLimit')}</span>
              <div className={styles.tierBar}>
                <div
                  className={styles.tierFill}
                  style={{
                    width: `${totalCustomers ? (overLimitCount / totalCustomers) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #ef4444, #f87171)',
                  }}
                />
              </div>
              <span className={styles.tierCount} style={{ color: '#ef4444' }}>{overLimitCount}</span>
            </div>
          </div>

          <div className={styles.pulseDivider} />
          <div className={styles.pulseReceivables}>
            <div className={styles.prLabel}>{t('payments.hero.totalReceivables')}</div>
            <div className={styles.prAmount} style={{ color: '#8b5cf6' }}>{formatCurrency(totalReceivables)}</div>
            <div className={styles.prSub}>
              {t('customers.pulse.acrossDebtors', { count: debtorCount })}
            </div>
            <div className={styles.prAlerts}>
              {thresholdCustomers > 0 && (
                <span className={styles.prAlertTag}>{t('customers.pulse.nearLimitAlert', { count: thresholdCustomers })}</span>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
