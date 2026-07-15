import * as React from 'react';
import {
  AppstoreOutlined,
  CalendarOutlined,
  DownloadOutlined,
  DollarOutlined,
  InboxOutlined,
  PlusOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserAddOutlined,
  WarningOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Empty,
  List,
  Progress,
  Segmented,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { SummaryCard } from '../../../../components/common/SummaryCard/SummaryCard';
import { SalesOrderStatusTag } from '../../../../components/common/StatusTag';
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  toNumber,
} from '../../../../lib/format';
import { useAuth } from '../../../auth';
import { useCustomers } from '../../../customers';
import { useProducts } from '../../../products';
import { useSalesOrders } from '../../../sales';
import { DashboardOrderStatusChart, DashboardRevenueChart } from '../../components';
import { useDashboardData } from '../../hooks/useDashboardQueries';
import styles from './DashboardPage.module.css';

type DashboardRange = 'TODAY' | '7_DAYS' | '30_DAYS' | 'THIS_MONTH';

const rangeLabels: Record<DashboardRange, string> = {
  TODAY: 'Today',
  '7_DAYS': '7 days',
  '30_DAYS': '30 days',
  THIS_MONTH: 'This month',
};

function getRangeStart(range: DashboardRange) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === 'THIS_MONTH') start.setDate(1);
  else if (range === '7_DAYS') start.setDate(start.getDate() - 6);
  else if (range === '30_DAYS') start.setDate(start.getDate() - 29);
  return start;
}

function escapeCsv(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dashboardQuery = useDashboardData();
  const ordersQuery = useSalesOrders();
  const customersQuery = useCustomers();
  const productsQuery = useProducts();
  const [range, setRange] = useState<DashboardRange>('7_DAYS');
  const [refreshing, setRefreshing] = useState(false);

  const orders    = ordersQuery.data   ?? [];
  const customers = customersQuery.data ?? [];
  const products  = productsQuery.data  ?? [];

  const filteredOrders = useMemo(() => {
    const rangeStart = getRangeStart(range).getTime();
    return orders.filter((o) => new Date(o.createdAt).getTime() >= rangeStart);
  }, [orders, range]);

  const customersMap     = useMemo(() => new Map(customers.map((c) => [c.id, c.name])), [customers]);
  const attentionOrders  = filteredOrders.filter((o) => o.status === 'DRAFT');
  const confirmedOrders  = filteredOrders.filter((o) => ['CONFIRMED', 'COMPLETED'].includes(o.status));
  const healthyProducts  = products.filter((p) => p.active && !p.isLowStock && p.stock > 0);
  const lowStockProducts = products.filter((p) => p.isLowStock);
  const outOfStockProducts = products.filter((p) => p.stock <= 0);
  const activeCustomers  = customers.filter((c) => c.active).length;
  const latestOrder      = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const rangeDays = range === 'TODAY' ? 1 : range === '30_DAYS' ? 30 : range === 'THIS_MONTH' ? new Date().getDate() : 7;

  const isLoading = dashboardQuery.isLoading || ordersQuery.isLoading || customersQuery.isLoading || productsQuery.isLoading;
  const isError   = dashboardQuery.isError   || ordersQuery.isError   || customersQuery.isError   || productsQuery.isError;
  const error     = dashboardQuery.error     || ordersQuery.error     || customersQuery.error     || productsQuery.error;

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([dashboardQuery.refetch(), ordersQuery.refetch(), customersQuery.refetch(), productsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }

  function handleExport() {
    const rows = [
      ['Order code', 'Status', 'Customer', 'Total', 'Paid', 'Debt', 'Created at'],
      ...filteredOrders.map((o) => [
        o.code, o.status,
        customersMap.get(o.customerId) || `Customer #${o.customerId}`,
        toNumber(o.totalAmount), toNumber(o.paidAmount), toNumber(o.debtAmount), o.createdAt,
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a   = document.createElement('a');
    a.href = url;
    a.download = `dms-dashboard-${range.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.dashboardPage}>
      <PageHeader
        title="Business Overview"
        subtitle="Monitor sales, inventory health and receivables from one operational workspace."
        extra={(
          <Space wrap className={styles.headerActions}>
            <Segmented<DashboardRange>
              value={range}
              options={Object.entries(rangeLabels).map(([value, label]) => ({ value: value as DashboardRange, label }))}
              onChange={setRange}
            />
            <Button icon={<ReloadOutlined />} loading={refreshing} onClick={handleRefresh}>Refresh</Button>
            <Button icon={<DownloadOutlined />} disabled={!filteredOrders.length} onClick={handleExport}>Export</Button>
          </Space>
        )}
      />

      <QueryState isLoading={isLoading} isError={isError} error={error} hasData={Boolean(dashboardQuery.data)} onRetry={handleRefresh}>
        {dashboardQuery.data ? (
          <>
            {/* ── Welcome banner ── */}
            <section className={styles.welcomePanel}>
              <div>
                <Typography.Text className={styles.welcomeEyebrow}>Distribution workspace</Typography.Text>
                <Typography.Title level={2} className={styles.welcomeTitle}>
                  Welcome back, {user?.fullName || user?.username || 'team'}
                </Typography.Title>
                <Typography.Paragraph className={styles.welcomeDescription}>
                  {latestOrder
                    ? `Latest recorded order activity: ${formatDateTime(latestOrder.createdAt)}`
                    : 'No recorded sales order activity yet.'}
                </Typography.Paragraph>
              </div>
              <div className={styles.quickActions}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/sales-orders/new')}>Create Order</Button>
                <Button icon={<InboxOutlined />} onClick={() => navigate('/inventory')}>Receive Stock</Button>
                <Button icon={<WalletOutlined />} onClick={() => navigate('/payments')}>Record Payment</Button>
                <Button icon={<UserAddOutlined />} onClick={() => navigate('/customers')}>Add Customer</Button>
              </div>
            </section>

            {/* ── Key performance ── */}
            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <div>
                  <Typography.Title level={3}>Key performance</Typography.Title>
                  <Typography.Text type="secondary">Core operating metrics for the current business cycle</Typography.Text>
                </div>
                <Tag icon={<CalendarOutlined />}>{rangeLabels[range]}</Tag>
              </div>

              {/* 4 primary KPI cards */}
              <div className={styles.primaryMetrics}>
                <SummaryCard title="Revenue This Month" value={formatCurrency(dashboardQuery.data.summary.revenueThisMonth)} note="Month-to-date recognized revenue" icon={<DollarOutlined />} variant="blue" />
                <SummaryCard title="Total Receivables"  value={formatCurrency(dashboardQuery.data.summary.totalReceivable)}  note="Outstanding customer receivables"  icon={<WalletOutlined />} variant="orange" />
                <SummaryCard title="Confirmed / Completed" value={formatNumber(confirmedOrders.length)} note={`Orders in selected ${rangeLabels[range].toLowerCase()} range`} icon={<ShoppingCartOutlined />} variant="green" />
                <SummaryCard title="Low-stock Products" value={formatNumber(lowStockProducts.length)} note="Products requiring replenishment" icon={<WarningOutlined />} variant="red" />
              </div>

              {/* KPI mini-visual panel */}
              {(() => {
                const totalOrders = filteredOrders.length || 1;
                const confirmedPct = Math.round((confirmedOrders.length / totalOrders) * 100);
                const healthyPct   = products.length ? Math.round(((products.length - lowStockProducts.length) / products.length) * 100) : 100;
                const r = 18; const circ = 2 * Math.PI * r;
                function MiniGauge({ pct, color }: { pct: number; color: string }) {
                  return (
                    <svg width="48" height="48" viewBox="0 0 48 48" className={styles.miniGaugeSvg}>
                      <defs>
                        <linearGradient id={`grad-${color.replace('#','')}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
                          <stop offset="100%" stopColor={color} stopOpacity="0.08"/>
                        </linearGradient>
                      </defs>
                      <circle cx="24" cy="24" r={r} fill={`url(#grad-${color.replace('#','')})`} stroke="none"/>
                      <circle cx="24" cy="24" r={r} fill="none" stroke={`${color}22`} strokeWidth="4"/>
                      <circle
                        cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
                        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
                        strokeDashoffset={circ * 0.25}
                        strokeLinecap="round"
                      />
                      <text x="24" y="28" textAnchor="middle" fontSize="10" fontWeight="800" fill={color}>{pct}%</text>
                    </svg>
                  );
                }
                const kpis = [
                  {
                    label: 'Revenue Today', value: formatCurrency(dashboardQuery.data.summary.revenueToday),
                    color: '#6366f1', icon: <DollarOutlined />, showGauge: false,
                    subLabel: 'vs. this month',
                  },
                  {
                    label: 'Active SKUs', value: String(formatNumber(dashboardQuery.data.summary.productCount)),
                    color: '#06b6d4', icon: <AppstoreOutlined />, showGauge: false,
                    subLabel: `${lowStockProducts.length} low stock`,
                  },
                  {
                    label: 'Payable Debt', value: formatCurrency(dashboardQuery.data.summary.payableDebt),
                    color: '#8b5cf6', icon: <InboxOutlined />, showGauge: false,
                    subLabel: 'supplier obligations',
                  },
                  {
                    label: 'Active Customers', value: String(formatNumber(activeCustomers)),
                    color: '#10b981', icon: <TeamOutlined />, showGauge: true, pct: healthyPct,
                    subLabel: `${healthyPct}% inventory healthy`,
                  },
                  {
                    label: 'Orders Need Action', value: String(formatNumber(attentionOrders.length)),
                    color: '#f59e0b', icon: <ShoppingCartOutlined />, showGauge: true, pct: confirmedPct,
                    subLabel: `${confirmedPct}% confirmed`,
                  },
                ];
                return (
                  <div className={styles.kpiMiniPanel}>
                    {kpis.map((k, i) => (
                      <div key={i} className={styles.kpiMiniCard} style={{ '--kpi-color': k.color } as React.CSSProperties}>
                        <div className={styles.kpiMiniTop}>
                          <div className={styles.kpiMiniIconWrap} style={{ background: `${k.color}18`, color: k.color }}>
                            {k.icon}
                          </div>
                          {(k.showGauge && k.pct !== undefined) ? (
                            <MiniGauge pct={k.pct} color={k.color} />
                          ) : (
                            <div className={styles.kpiMiniSparkBar}>
                              <div className={styles.kpiMiniSparkFill} style={{ background: `linear-gradient(90deg, ${k.color}55, ${k.color}cc)` }} />
                            </div>
                          )}
                        </div>
                        <div className={styles.kpiMiniValue}>{k.value}</div>
                        <div className={styles.kpiMiniLabel}>{k.label}</div>
                        <div className={styles.kpiMiniSub}>{k.subLabel}</div>
                        <div className={styles.kpiMiniAccent} style={{ background: `linear-gradient(90deg, ${k.color}, ${k.color}00)` }} />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </section>

            {/* ── Sales analytics ── */}
            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <div>
                  <Typography.Title level={3}>Sales analytics</Typography.Title>
                  <Typography.Text type="secondary">Revenue and order mix for {rangeLabels[range].toLowerCase()}</Typography.Text>
                </div>
              </div>
              <div className={styles.chartGrid}>
                <DashboardRevenueChart orders={filteredOrders} rangeDays={rangeDays} />
                <DashboardOrderStatusChart orders={filteredOrders} />
              </div>
            </section>

            {/* ── Commercial exposure ── */}
            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <div>
                  <Typography.Title level={3}>Commercial exposure</Typography.Title>
                  <Typography.Text type="secondary">Customers and products with the greatest current impact</Typography.Text>
                </div>
              </div>
              <div className={styles.insightGrid}>
                <Card title="Top Customers by Debt" className={`panel-card ${styles.panel}`}>
                  {dashboardQuery.data.topCustomersByDebt.length ? (
                    <List
                      dataSource={dashboardQuery.data.topCustomersByDebt}
                      renderItem={(item, index) => (
                        <List.Item>
                          <div className={styles.listRow}>
                            <div className={styles.rank}>{index + 1}</div>
                            <div className={styles.listContent}>
                              <Typography.Text strong>{item.customerName}</Typography.Text>
                              <Typography.Text type="secondary">Outstanding receivable</Typography.Text>
                            </div>
                            <Typography.Text strong className={styles.amount}>{formatCurrency(item.debtBalance)}</Typography.Text>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div className="panel-empty">
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No customer debt yet" />
                    </div>
                  )}
                </Card>

                <Card title="Top Selling Products" className={`panel-card ${styles.panel}`}>
                  {dashboardQuery.data.topSellingProducts.length ? (
                    <List
                      dataSource={dashboardQuery.data.topSellingProducts}
                      renderItem={(item, index) => (
                        <List.Item>
                          <div className={styles.listRow}>
                            <div className={styles.rank}>{index + 1}</div>
                            <div className={styles.listContent}>
                              <Typography.Text strong>{item.productName}</Typography.Text>
                              <Typography.Text type="secondary">{item.totalQuantity} units sold</Typography.Text>
                            </div>
                            <Typography.Text strong>{formatCurrency(item.revenue)}</Typography.Text>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div className="panel-empty">
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No completed sales yet" />
                    </div>
                  )}
                </Card>
              </div>
            </section>

            {/* ── Needs attention ── */}
            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <div>
                  <Typography.Title level={3}>Needs attention</Typography.Title>
                  <Typography.Text type="secondary">Operational queues that can be acted on now</Typography.Text>
                </div>
              </div>
              <div className={styles.actionGrid}>
                <Card title="Inventory Health" className={`panel-card ${styles.actionCard}`}>
                  <div className={styles.healthSummary}>
                    <div><span>Healthy</span><strong>{healthyProducts.length}</strong></div>
                    <div><span>Low stock</span><strong>{lowStockProducts.length}</strong></div>
                    <div><span>Out of stock</span><strong>{outOfStockProducts.length}</strong></div>
                  </div>
                  <Progress
                    percent={products.length ? Math.round((healthyProducts.length / products.length) * 100) : 0}
                    showInfo={false}
                    strokeColor="var(--color-success)"
                  />
                  <List
                    dataSource={lowStockProducts.slice(0, 3)}
                    locale={{ emptyText: 'All tracked products are above minimum stock.' }}
                    renderItem={(product) => (
                      <List.Item>
                        <div className={styles.compactRow}>
                          <div><strong>{product.name}</strong><span>{product.sku}</span></div>
                          <Tag color="orange">{product.stock} on hand</Tag>
                        </div>
                      </List.Item>
                    )}
                  />
                  <Button type="link" onClick={() => navigate('/inventory')}>Open inventory</Button>
                </Card>

                <Card title="Orders Requiring Attention" className={`panel-card ${styles.actionCard}`}>
                  <List
                    dataSource={attentionOrders.slice(0, 4)}
                    locale={{ emptyText: 'No draft orders in the selected range.' }}
                    renderItem={(order) => (
                      <List.Item>
                        <div className={styles.compactRow}>
                          <div>
                            <strong>{order.code}</strong>
                            <span>{customersMap.get(order.customerId) || `Customer #${order.customerId}`}</span>
                          </div>
                          <Typography.Text strong>{formatCurrency(order.totalAmount)}</Typography.Text>
                        </div>
                      </List.Item>
                    )}
                  />
                  <Button type="link" onClick={() => navigate('/sales-orders')}>Review orders</Button>
                </Card>

                <Card title="Recent Business Activity" className={`panel-card ${styles.actionCard}`}>
                  <List
                    dataSource={[...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4)}
                    locale={{ emptyText: 'No recent order activity.' }}
                    renderItem={(order) => (
                      <List.Item>
                        <div className={styles.compactRow}>
                          <div><strong>{order.code}</strong><span>{formatDateTime(order.createdAt)}</span></div>
                          <SalesOrderStatusTag status={order.status} />
                        </div>
                      </List.Item>
                    )}
                  />
                  <Button type="link" onClick={() => navigate('/sales-orders')}>View activity</Button>
                </Card>
              </div>
            </section>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
