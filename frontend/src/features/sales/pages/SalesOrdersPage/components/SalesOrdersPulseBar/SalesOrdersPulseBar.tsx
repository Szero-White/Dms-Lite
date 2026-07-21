import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  StopOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '../../../../../../lib/format';
import styles from './SalesOrdersPulseBar.module.css';

interface SalesOrdersPulseBarProps {
  totalOrders: number;
  activeOrders: number;
  draftCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  totalRevenue: number;
  paidAmount: number;
  outstandingDebt: number;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export function SalesOrdersPulseBar({
  totalOrders,
  activeOrders,
  draftCount,
  confirmedCount,
  completedCount,
  cancelledCount,
  totalRevenue,
  paidAmount,
  outstandingDebt,
  statusFilter,
  onStatusFilterChange,
}: SalesOrdersPulseBarProps) {
  const activeArc = totalOrders > 0 ? (activeOrders / totalOrders) * 201 : 0;

  return (
    <div className={styles.pulseBar}>
      {/* Hero Section */}
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
            <span className={styles.pulseRingLbl}>total</span>
          </div>
        </div>
        <div className={styles.pulseHeroText}>
          <div className={styles.pulseHeroTitle}>Sales Pipeline</div>
          <div className={styles.pulseHeroSub}>
            {activeOrders} active · {totalOrders - activeOrders} inactive
          </div>
        </div>
      </div>

      <div className={styles.pulseDivider} />

      {/* Status Tiers */}
      <div className={styles.pulseTiers}>
        <div className={styles.tierTitle}>Order Status</div>
        
        <button
          type="button"
          className={`${styles.tierRow} ${statusFilter === 'DRAFT' ? styles.tierActive : ''}`}
          onClick={() => onStatusFilterChange(statusFilter === 'DRAFT' ? 'ALL' : 'DRAFT')}
        >
          <div className={styles.tierDot} style={{ background: '#f59e0b' }}>
            <ClockCircleOutlined />
          </div>
          <span className={styles.tierLbl}>Draft</span>
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
          className={`${styles.tierRow} ${statusFilter === 'CONFIRMED' ? styles.tierActive : ''}`}
          onClick={() => onStatusFilterChange(statusFilter === 'CONFIRMED' ? 'ALL' : 'CONFIRMED')}
        >
          <div className={styles.tierDot} style={{ background: '#6366f1' }}>
            <CheckCircleOutlined />
          </div>
          <span className={styles.tierLbl}>Confirmed</span>
          <div className={styles.tierBar}>
            <div
              className={styles.tierFill}
              style={{
                width: `${totalOrders ? (confirmedCount / totalOrders) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              }}
            />
          </div>
          <span className={styles.tierCount}>{confirmedCount}</span>
        </button>

        <button
          type="button"
          className={`${styles.tierRow} ${statusFilter === 'COMPLETED' ? styles.tierActive : ''}`}
          onClick={() => onStatusFilterChange(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
        >
          <div className={styles.tierDot} style={{ background: '#10b981' }}>
            <TrophyOutlined />
          </div>
          <span className={styles.tierLbl}>Completed</span>
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
          <span className={styles.tierLbl}>Cancelled</span>
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

      <div className={styles.pulseDivider} />

      {/* Financial Summary */}
      <div className={styles.pulseFinancial}>
        <div className={styles.financialTitle}>Financial Overview</div>
        
        <div className={styles.financialRow}>
          <div className={styles.financialIcon} style={{ background: '#eef2ff', color: '#6366f1' }}>
            <DollarOutlined />
          </div>
          <div className={styles.financialContent}>
            <span className={styles.financialLabel}>Total Revenue</span>
            <span className={styles.financialValue}>{formatCurrency(totalRevenue)}</span>
          </div>
        </div>

        <div className={styles.financialRow}>
          <div className={styles.financialIcon} style={{ background: '#ecfdf5', color: '#10b981' }}>
            <DollarOutlined />
          </div>
          <div className={styles.financialContent}>
            <span className={styles.financialLabel}>Paid Amount</span>
            <span className={styles.financialValue}>{formatCurrency(paidAmount)}</span>
          </div>
        </div>

        <div className={styles.financialRow}>
          <div className={styles.financialIcon} style={{ background: '#fef2f2', color: '#ef4444' }}>
            <DollarOutlined />
          </div>
          <div className={styles.financialContent}>
            <span className={styles.financialLabel}>Outstanding Debt</span>
            <span className={`${styles.financialValue} ${outstandingDebt > 0 ? styles.debtValue : ''}`}>
              {formatCurrency(outstandingDebt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
