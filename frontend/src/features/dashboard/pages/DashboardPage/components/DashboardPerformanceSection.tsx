import * as React from 'react';
import {
  AppstoreOutlined,
  CalendarOutlined,
  DollarOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  WarningOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Tag, Typography } from 'antd';
import { SummaryCard } from '../../../../../components/common/SummaryCard/SummaryCard';
import { formatCurrency, formatNumber } from '../../../../../lib/format';
import type { DashboardSnapshot } from '../../../types/dashboard.types';
import type { ProductRow } from '../../../../products';
import type { SalesOrder } from '../../../../sales';
import type { DashboardRange } from '../dashboardPage.types';
import { rangeLabels } from '../dashboardPage.utils';
import styles from '../DashboardPage.module.css';

interface DashboardPerformanceSectionProps {
  activeCustomers: number;
  confirmedOrders: SalesOrder[];
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
  confirmedOrders,
  dashboard,
  filteredOrders,
  lowStockProducts,
  products,
  range,
}: DashboardPerformanceSectionProps) {
  const totalOrders = filteredOrders.length || 1;
  const confirmedPct = Math.round((confirmedOrders.length / totalOrders) * 100);
  const healthyPct = products.length
    ? Math.round(((products.length - lowStockProducts.length) / products.length) * 100)
    : 100;

  const kpis = [
    {
      color: '#6366f1',
      icon: <DollarOutlined />,
      label: 'Revenue Today',
      showGauge: false,
      subLabel: 'vs. this month',
      value: formatCurrency(dashboard.summary.revenueToday),
    },
    {
      color: '#06b6d4',
      icon: <AppstoreOutlined />,
      label: 'Active SKUs',
      showGauge: false,
      subLabel: `${lowStockProducts.length} low stock`,
      value: String(formatNumber(dashboard.summary.productCount)),
    },
    {
      color: '#8b5cf6',
      icon: <InboxOutlined />,
      label: 'Payable Debt',
      showGauge: false,
      subLabel: 'supplier obligations',
      value: formatCurrency(dashboard.summary.payableDebt),
    },
    {
      color: '#10b981',
      icon: <TeamOutlined />,
      label: 'Active Customers',
      pct: healthyPct,
      showGauge: true,
      subLabel: `${healthyPct}% inventory healthy`,
      value: String(formatNumber(activeCustomers)),
    },
    {
      color: '#f59e0b',
      icon: <ShoppingCartOutlined />,
      label: 'Orders Need Action',
      pct: confirmedPct,
      showGauge: true,
      subLabel: `${confirmedPct}% confirmed`,
      value: String(formatNumber(filteredOrders.filter((order) => order.status === 'DRAFT').length)),
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <div>
          <Typography.Title level={3}>Key performance</Typography.Title>
          <Typography.Text type="secondary">
            Core operating metrics for the current business cycle
          </Typography.Text>
        </div>
        <Tag icon={<CalendarOutlined />}>{rangeLabels[range]}</Tag>
      </div>

      <div className={styles.primaryMetrics}>
        <SummaryCard
          title="Revenue This Month"
          value={formatCurrency(dashboard.summary.revenueThisMonth)}
          note="Month-to-date recognized revenue"
          icon={<DollarOutlined />}
          variant="blue"
        />
        <SummaryCard
          title="Total Receivables"
          value={formatCurrency(dashboard.summary.totalReceivable)}
          note="Outstanding customer receivables"
          icon={<WalletOutlined />}
          variant="orange"
        />
        <SummaryCard
          title="Confirmed / Completed"
          value={formatNumber(confirmedOrders.length)}
          note={`Orders in selected ${rangeLabels[range].toLowerCase()} range`}
          icon={<ShoppingCartOutlined />}
          variant="green"
        />
        <SummaryCard
          title="Low-stock Products"
          value={formatNumber(lowStockProducts.length)}
          note="Products requiring replenishment"
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
