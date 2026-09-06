import {
  ClockCircleOutlined,
  StopOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styles from './SalesOrdersPulseBar.module.css';

interface SalesOrdersPulseBarProps {
  totalOrders: number;
  activeOrders: number;
  draftCount: number;
  completedCount: number;
  cancelledCount: number;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export function SalesOrdersPulseBar({
  totalOrders,
  activeOrders,
  draftCount,
  completedCount,
  cancelledCount,
  statusFilter,
  onStatusFilterChange,
}: SalesOrdersPulseBarProps) {
  const { t } = useTranslation();
  const activeArc = totalOrders > 0 ? (activeOrders / totalOrders) * 201 : 0;

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
              stroke="url(#salesPulseGradient)"
              strokeWidth="8"
              strokeDasharray={`${activeArc} 201`}
              strokeDashoffset="50"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="salesPulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className={styles.pulseRingCenter}>
            <span className={styles.pulseRingNum}>{totalOrders}</span>
            <span className={styles.pulseRingLbl}>{t('sales.pulse.total')}</span>
          </div>
        </div>
        <div className={styles.pulseHeroText}>
          <div className={styles.pulseHeroTitle}>{t('sales.pulse.pipeline')}</div>
          <div className={styles.pulseHeroSub}>
            {t('sales.pulse.activeInactive', {
              active: activeOrders,
              inactive: totalOrders - activeOrders,
            })}
          </div>
        </div>
      </div>

      <div className={styles.pulseDivider} />

      <div className={styles.pulseTiers}>
        <div className={styles.tierTitle}>{t('sales.pulse.orderStatus')}</div>

        <button
          type="button"
          className={`${styles.tierRow} ${statusFilter === 'DRAFT' ? styles.tierActive : ''}`}
          onClick={() => onStatusFilterChange(statusFilter === 'DRAFT' ? 'ALL' : 'DRAFT')}
        >
          <div className={styles.tierDot} style={{ background: '#f59e0b' }}>
            <ClockCircleOutlined />
          </div>
          <span className={styles.tierLbl}>{t('status.sales.DRAFT')}</span>
          <div className={styles.tierBar}>
            <div
              className={styles.tierFill}
              style={{
                width: `${totalOrders ? (draftCount / totalOrders) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              }}
            />
          </div>
          <span className={styles.tierCount}>{draftCount}</span>
        </button>

        <button
          type="button"
          className={`${styles.tierRow} ${statusFilter === 'COMPLETED' ? styles.tierActive : ''}`}
          onClick={() => onStatusFilterChange(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
        >
          <div className={styles.tierDot} style={{ background: '#10b981' }}>
            <TrophyOutlined />
          </div>
          <span className={styles.tierLbl}>{t('status.sales.COMPLETED')}</span>
          <div className={styles.tierBar}>
            <div
              className={styles.tierFill}
              style={{
                width: `${totalOrders ? (completedCount / totalOrders) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #10b981, #34d399)',
              }}
            />
          </div>
          <span className={styles.tierCount}>{completedCount}</span>
        </button>

        <button
          type="button"
          className={`${styles.tierRow} ${statusFilter === 'CANCELLED' ? styles.tierActive : ''}`}
          onClick={() => onStatusFilterChange(statusFilter === 'CANCELLED' ? 'ALL' : 'CANCELLED')}
        >
          <div className={styles.tierDot} style={{ background: '#ef4444' }}>
            <StopOutlined />
          </div>
          <span className={styles.tierLbl}>{t('status.sales.CANCELLED')}</span>
          <div className={styles.tierBar}>
            <div
              className={styles.tierFill}
              style={{
                width: `${totalOrders ? (cancelledCount / totalOrders) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #ef4444, #f87171)',
              }}
            />
          </div>
          <span className={styles.tierCount}>{cancelledCount}</span>
        </button>
      </div>

    </div>
  );
}
