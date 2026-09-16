import type { ReactNode } from 'react';
import styles from '../../ReportsPage.module.css';

export interface ReportStatStripItem {
  color?: string;
  icon: ReactNode;
  label: string;
  value: string | number;
}

interface ReportStatStripProps {
  items: ReportStatStripItem[];
}

export function ReportStatStrip({ items }: ReportStatStripProps) {
  return (
    <div className={styles.statStrip}>
      {items.map((item) => (
        <div key={item.label} className={styles.statStripItem}>
          <div
            className={styles.statStripIcon}
            style={{ color: item.color ?? 'var(--color-primary)' }}
          >
            {item.icon}
          </div>
          <div>
            <div className={styles.statStripVal} style={{ color: item.color }}>
              {item.value}
            </div>
            <div className={styles.statStripLbl}>{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
