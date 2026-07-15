import * as React from 'react';
import type { ReactNode } from 'react';
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
}

const variantConfig: Record<string, { accent: string; iconBg: string; iconColor: string }> = {
  blue:   { accent: '#6366f1', iconBg: '#eef2ff', iconColor: '#4f46e5' },
  green:  { accent: '#10b981', iconBg: '#ecfdf5', iconColor: '#059669' },
  orange: { accent: '#f59e0b', iconBg: '#fffbeb', iconColor: '#d97706' },
  purple: { accent: '#8b5cf6', iconBg: '#f5f3ff', iconColor: '#7c3aed' },
  red:    { accent: '#ef4444', iconBg: '#fef2f2', iconColor: '#dc2626' },
  cyan:   { accent: '#06b6d4', iconBg: '#ecfeff', iconColor: '#0891b2' },
};

export function SummaryCard({
  title,
  value,
  note,
  icon,
  trend,
  variant = 'blue',
}: SummaryCardProps) {
  const cfg = variantConfig[variant];
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div
      className={styles.card}
      style={{ '--accent': cfg.accent, '--icon-bg': cfg.iconBg, '--icon-color': cfg.iconColor } as React.CSSProperties}
    >
      {/* Left accent bar */}
      <div className={styles.accentBar} />

      {/* Header row: title + icon */}
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {icon && <div className={styles.icon}>{icon}</div>}
      </div>

      {/* Big value */}
      <div className={styles.value}>{value}</div>

      {/* Footer: note or trend */}
      <div className={styles.footer}>
        {trend !== undefined ? (
          <span className={isPositive ? styles.trendUp : styles.trendDown}>
            {isPositive ? '▲' : '▼'} {Math.abs(trend)}%
            <span className={styles.trendLabel}>&nbsp;vs prev. period</span>
          </span>
        ) : (
          <span className={styles.note}>{note}</span>
        )}
      </div>
    </div>
  );
}
