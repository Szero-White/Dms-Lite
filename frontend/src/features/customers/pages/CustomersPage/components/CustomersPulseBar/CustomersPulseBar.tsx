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
}

export function CustomersPulseBar({
  activeCount,
  clearCount,
  customers,
  debtorCount,
  overLimitCount,
  thresholdCustomers,
  totalReceivables,
}: CustomersPulseBarProps) {
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
            <span className={styles.pulseRingLbl}>total</span>
          </div>
        </div>
        <div className={styles.pulseHeroText}>
          <div className={styles.pulseHeroTitle}>Customer Base</div>
          <div className={styles.pulseHeroSub}>
            {activeCount} active · {totalCustomers - activeCount} inactive
          </div>
        </div>
      </div>

      <div className={styles.pulseDivider} />

      <div className={styles.pulseTiers}>
        <div className={styles.tierTitle}>Account Health</div>
        <div className={styles.tierRow}>
          <div className={styles.tierDot} style={{ background: '#10b981' }} />
          <span className={styles.tierLbl}>Clear balance</span>
          <div className={styles.tierBar}>
            <div
              className={styles.tierFill}
              style={{
                width: `${totalCustomers ? (clearCount / totalCustomers) * 100 : 0}%`,
                background: '#10b981',
              }}
            />
          </div>
          <span className={styles.tierCount}>{clearCount}</span>
        </div>
        <div className={styles.tierRow}>
          <div className={styles.tierDot} style={{ background: '#f59e0b' }} />
          <span className={styles.tierLbl}>Has debt</span>
          <div className={styles.tierBar}>
            <div
              className={styles.tierFill}
              style={{
                width: `${totalCustomers ? (debtorCount / totalCustomers) * 100 : 0}%`,
                background: 'linear-gradient(90deg,#f59e0b,#fbbf24)',
              }}
            />
          </div>
          <span className={styles.tierCount}>{debtorCount}</span>
        </div>
        <div className={styles.tierRow}>
          <div className={styles.tierDot} style={{ background: '#ef4444' }} />
          <span className={styles.tierLbl}>Over limit</span>
          <div className={styles.tierBar}>
            <div
              className={styles.tierFill}
              style={{
                width: `${totalCustomers ? (overLimitCount / totalCustomers) * 100 : 0}%`,
                background: 'linear-gradient(90deg,#ef4444,#f87171)',
              }}
            />
          </div>
          <span className={styles.tierCount}>{overLimitCount}</span>
        </div>
      </div>

      <div className={styles.pulseDivider} />

      <div className={styles.pulseReceivables}>
        <div className={styles.prLabel}>Total Receivables</div>
        <div className={styles.prAmount}>{formatCurrency(totalReceivables)}</div>
        <div className={styles.prSub}>
          across {debtorCount} debtor{debtorCount !== 1 ? 's' : ''}
        </div>
        <div className={styles.prAlerts}>
          {thresholdCustomers > 0 && (
            <span className={styles.prAlertTag}>⚠ {thresholdCustomers} near limit</span>
          )}
        </div>
      </div>
    </div>
  );
}
