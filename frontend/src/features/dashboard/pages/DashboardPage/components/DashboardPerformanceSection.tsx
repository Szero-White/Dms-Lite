import * as React from 'react';
import {
  AppstoreOutlined,
  CalendarOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  WarningOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { SummaryCard } from '../../../../../components/common/SummaryCard/SummaryCard';
import { formatCurrency, formatNumber } from '../../../../../lib/format';
import type { DashboardSnapshot } from '../../../types/dashboard.types';
import type { ProductRow } from '../../../../products';
import type { SalesOrder } from '../../../../sales';
import type { DashboardRange } from '../dashboardPage.types';
import styles from './DashboardPerformanceSection.module.css';

interface DashboardPerformanceSectionProps {
  activeCustomers: number;
  completedOrders: SalesOrder[];
  dashboard: DashboardSnapshot;
  filteredOrders: SalesOrder[];
  lowStockProducts: ProductRow[];
  products: ProductRow[];
  range: DashboardRange;
}

function MiniGauge({ color, pct }: { color: string; pct: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const gradientId = `grad-${color.replace('#', '')}`;

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className={styles.miniGaugeSvg}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r={radius} fill={`url(#${gradientId})`} stroke="none" />
      <circle cx="24" cy="24" r={radius} fill="none" stroke={`${color}22`} strokeWidth="4" />
      <circle
        cx="24"
        cy="24"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
        strokeDashoffset={circumference * 0.25}
        strokeLinecap="round"
      />
      <text x="24" y="28" textAnchor="middle" fontSize="10" fontWeight="800" fill={color}>
        {pct}%
      </text>
    </svg>
  );
}

export function DashboardPerformanceSection({
  activeCustomers,
  completedOrders,
  dashboard,
  filteredOrders,
  lowStockProducts,
  products,
  range,
}: DashboardPerformanceSectionProps) {
  const { t } = useTranslation();
  const rangeLabel = t(`dashboard.range.${range}`);
  const totalOrders = filteredOrders.length || 1;
  const completedPct = Math.round((completedOrders.length / totalOrders) * 100);
  const healthyPct = products.length
    ? Math.round(((products.length - lowStockProducts.length) / products.length) * 100)
    : 100;

  const kpis = [
    {
      color: '#6366f1',
      icon: <DollarOutlined />,
      label: t('dashboard.performance.revenueToday'),
      showGauge: false,
      subLabel: t('dashboard.performance.vsThisMonth'),
      value: formatCurrency(dashboard.summary.revenueToday),
    },
    {
      color: '#06b6d4',
      icon: <AppstoreOutlined />,
      label: t('dashboard.performance.activeSkus'),
      showGauge: false,
      subLabel: t('dashboard.performance.lowStockCount', { count: lowStockProducts.length }),
      value: String(formatNumber(dashboard.summary.productCount)),
    },
    {
      color: '#10b981',
      icon: <TeamOutlined />,
      label: t('dashboard.performance.activeCustomers'),
      pct: healthyPct,
      showGauge: true,
      subLabel: t('dashboard.performance.inventoryHealthy', { percent: healthyPct }),
      value: String(formatNumber(activeCustomers)),
    },
    {
      color: '#f59e0b',
      icon: <ShoppingCartOutlined />,
      label: t('dashboard.performance.ordersNeedAction'),
      pct: completedPct,
      showGauge: true,
      subLabel: t('dashboard.performance.completedPercent', { percent: completedPct }),
      value: String(formatNumber(filteredOrders.filter((order) => order.status === 'DRAFT').length)),
    },
  ];

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
        />
        <SummaryCard
          title={t('dashboard.performance.totalReceivables')}
          value={formatCurrency(dashboard.summary.totalReceivable)}
          note={t('dashboard.performance.totalReceivablesNote')}
          icon={<WalletOutlined />}
          variant="orange"
        />
        <SummaryCard
          title={t('dashboard.performance.completedOrders')}
          value={formatNumber(completedOrders.length)}
          note={t('dashboard.performance.ordersInRange', { range: rangeLabel.toLowerCase() })}
          icon={<ShoppingCartOutlined />}
          variant="green"
        />
        <SummaryCard
          title={t('dashboard.performance.lowStockProducts')}
          value={formatNumber(lowStockProducts.length)}
          note={t('dashboard.performance.lowStockProductsNote')}
          icon={<WarningOutlined />}
          variant="red"
        />
      </div>

      <div className={styles.kpiMiniPanel}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={styles.kpiMiniCard}
            style={{ '--kpi-color': kpi.color } as React.CSSProperties}
          >
            <div className={styles.kpiMiniTop}>
              <div
                className={styles.kpiMiniIconWrap}
                style={{ background: `${kpi.color}18`, color: kpi.color }}
              >
                {kpi.icon}
              </div>
              {kpi.showGauge && kpi.pct !== undefined ? (
                <MiniGauge pct={kpi.pct} color={kpi.color} />
              ) : (
                <div className={styles.kpiMiniSparkBar}>
                  <div
                    className={styles.kpiMiniSparkFill}
                    style={{
                      background: `linear-gradient(90deg, ${kpi.color}55, ${kpi.color}cc)`,
                    }}
                  />
                </div>
              )}
            </div>
            <div className={styles.kpiMiniValue}>{kpi.value}</div>
            <div className={styles.kpiMiniLabel}>{kpi.label}</div>
            <div className={styles.kpiMiniSub}>{kpi.subLabel}</div>
            <div
              className={styles.kpiMiniAccent}
              style={{ background: `linear-gradient(90deg, ${kpi.color}, ${kpi.color}00)` }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
