import {
  AppstoreOutlined,
  CalendarOutlined,
  DollarOutlined,
  WarningOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { SummaryCard } from '../../../../../components/common/SummaryCard/SummaryCard';
import { formatCurrency, formatNumber } from '../../../../../lib/format';
import type { DashboardSnapshot } from '../../../types/dashboard.types';
import type { DashboardRange } from '../dashboardPage.types';
import styles from './DashboardPerformanceSection.module.css';

interface DashboardPerformanceSectionProps {
  dashboard: DashboardSnapshot;
  range: DashboardRange;
}

function RevenueVisual() {
  return (
    <div className={`${styles.microVisual} ${styles.barVisual}`}>
      <span style={{ height: '34%' }} />
      <span style={{ height: '54%' }} />
      <span style={{ height: '42%' }} />
      <span className={styles.barAccent} style={{ height: '76%' }} />
    </div>
  );
}

function ReceivableVisual() {
  return (
    <div className={`${styles.microVisual} ${styles.ringVisual}`}>
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="13" className={styles.ringTrack} />
        <circle cx="18" cy="18" r="13" className={styles.ringProgress} pathLength="100" strokeDasharray="64 36" />
      </svg>
      <span className={styles.ringValue}>64%</span>
    </div>
  );
}

function ProductVisual() {
  return (
    <div className={`${styles.microVisual} ${styles.pillVisual}`}>
      <span className={styles.pillShort} />
      <span className={styles.pillMedium} />
      <span className={styles.pillTall} />
    </div>
  );
}

function WarningVisual() {
  return (
    <div className={`${styles.microVisual} ${styles.warningVisual}`}>
      <span className={styles.warningLine} />
      <span className={styles.warningLineSoft} />
      <span className={styles.warningDot} />
    </div>
  );
}

export function DashboardPerformanceSection({
  dashboard,
  range,
}: DashboardPerformanceSectionProps) {
  const { t } = useTranslation();
  const rangeLabel = t(`dashboard.range.${range}`);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <div>
          <Typography.Title level={3}>{t('dashboard.performance.title')}</Typography.Title>
          <Typography.Text type="secondary">
            {t('dashboard.performance.subtitle')}
          </Typography.Text>
        </div>
        <Tag icon={<CalendarOutlined />}>{rangeLabel}</Tag>
      </div>

      <div className={styles.primaryMetrics}>
        <SummaryCard
          title={t('dashboard.performance.revenueThisMonth')}
          value={formatCurrency(dashboard.summary.revenueThisMonth)}
          note={t('dashboard.performance.revenueThisMonthNote')}
          icon={<DollarOutlined />}
          variant="blue"
          visual="dashboard"
          microVisual={<RevenueVisual />}
          indicatorLabel={t('dashboard.range.THIS_MONTH')}
        />
        <SummaryCard
          title={t('dashboard.performance.totalReceivables')}
          value={formatCurrency(dashboard.summary.totalReceivable)}
          note={t('dashboard.performance.totalReceivablesNote')}
          icon={<WalletOutlined />}
          variant="orange"
          visual="dashboard"
          microVisual={<ReceivableVisual />}
          indicatorLabel={t('dashboard.range.7_DAYS')}
        />
        <SummaryCard
          title={t('dashboard.performance.activeSkus')}
          value={formatNumber(dashboard.summary.productCount)}
          note={t('dashboard.performance.lowStockCount', { count: dashboard.summary.lowStockItems })}
          icon={<AppstoreOutlined />}
          variant="green"
          visual="dashboard"
          microVisual={<ProductVisual />}
          indicatorLabel={formatNumber(dashboard.summary.lowStockItems)}
        />
        <SummaryCard
          title={t('dashboard.performance.lowStockProducts')}
          value={formatNumber(dashboard.summary.lowStockItems)}
          note={t('dashboard.performance.lowStockProductsNote')}
          icon={<WarningOutlined />}
          variant="red"
          visual="dashboard"
          microVisual={<WarningVisual />}
          indicatorLabel={dashboard.summary.lowStockItems > 0 ? t('inventory.overview.needsRestock') : t('inventory.overview.allProductsHealthy')}
        />
      </div>
    </section>
  );
}
