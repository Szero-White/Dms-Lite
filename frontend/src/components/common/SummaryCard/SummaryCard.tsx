import * as React from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { uiPalette } from '../../../styles/palette';
import styles from './SummaryCard.module.css';

interface SummaryCardProps {
  title: string;
  value: ReactNode;
  note: string;
  icon?: ReactNode;
  trend?: number;
  progress?: number;
  variant?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'cyan';
  visual?: 'default' | 'dashboard';
  microVisual?: ReactNode;
  indicatorLabel?: string;
}

const variantConfig: Record<NonNullable<SummaryCardProps['variant']>, { accent: string; iconBg: string; tint: string }> = {
  blue: {
    accent: uiPalette.brand.primary,
    iconBg: uiPalette.brand.soft,
    tint: 'rgba(111, 104, 232, 0.10)',
  },
  green: {
    accent: uiPalette.semantic.success,
    iconBg: uiPalette.semantic.successSoft,
    tint: 'rgba(84, 158, 109, 0.10)',
  },
  orange: {
    accent: uiPalette.semantic.warning,
    iconBg: uiPalette.semantic.warningSoft,
    tint: 'rgba(211, 148, 56, 0.10)',
  },
  purple: {
    accent: uiPalette.brand.primary,
    iconBg: uiPalette.brand.soft,
    tint: 'rgba(111, 104, 232, 0.10)',
  },
  red: {
    accent: uiPalette.semantic.danger,
    iconBg: uiPalette.semantic.dangerSoft,
    tint: 'rgba(216, 88, 88, 0.09)',
  },
  cyan: {
    accent: uiPalette.brand.primary,
    iconBg: uiPalette.brand.soft,
    tint: 'rgba(111, 104, 232, 0.10)',
  },
};

export function SummaryCard({
  title,
  value,
  note,
  icon,
  trend,
  variant = 'blue',
  visual = 'default',
  microVisual,
  indicatorLabel,
}: SummaryCardProps) {
  const { t } = useTranslation();
  const cfg = variantConfig[variant];
  const isPositive = trend !== undefined && trend >= 0;
  const showDashboardVisual = visual === 'dashboard' && microVisual;

  return (
    <div
      className={`${styles.card} ${visual === 'dashboard' ? styles.dashboardCard : ''}`}
      style={{
        '--accent': cfg.accent,
        '--icon-bg': cfg.iconBg,
        '--card-tint': cfg.tint,
      } as React.CSSProperties}
    >
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {showDashboardVisual ? (
          <div className={styles.microVisualBox} aria-hidden="true">
            {microVisual}
          </div>
        ) : icon ? <div className={styles.icon}>{icon}</div> : null}
      </div>

      <div className={styles.value}>{value}</div>

      <div className={styles.footer}>
        <div className={styles.noteRow}>
          {trend !== undefined ? (
            <span className={isPositive ? styles.trendUp : styles.trendDown}>
              {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
              <span className={styles.trendLabel}>&nbsp;{t('common.previousPeriod')}</span>
            </span>
          ) : (
            <span className={styles.note}>{note}</span>
          )}

          {indicatorLabel ? <span className={styles.indicatorPill}>{indicatorLabel}</span> : null}
        </div>
      </div>
    </div>
  );
}
