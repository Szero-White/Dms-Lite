import {
  BarChartOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  DownloadOutlined,
  InboxOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Progress,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import {
  ProductStatusTag,
  SalesOrderStatusTag,
} from '../../../../components/common/StatusTag';
import {
  formatCurrency,
  formatDateTime,
  toNumber,
} from '../../../../lib/format';
import { useCustomers } from '../../../customers';
import { useDashboardData } from '../../../dashboard';
import { useProducts } from '../../../products';
import { useSalesOrders } from '../../../sales';
import {
  InventoryStockChart,
  OrderStatusChart,
  RevenueByOrderChart,
} from '../../components';
import styles from './ReportsPage.module.css';

type ReportTab = 'sales' | 'inventory' | 'receivables';

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const content = rows
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Compact inline stat used inside tab headers */
function StatStrip({ items }: {
  items: { icon: React.ReactNode; label: string; value: string | number; color?: string }[];
}) {
  return (
    <div className={styles.statStrip}>
      {items.map((item, i) => (
        <div key={i} className={styles.statStripItem}>
          <div className={styles.statStripIcon} style={{ color: item.color ?? 'var(--color-primary)' }}>
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

export function ReportsPage() {
  const dashboardQuery = useDashboardData();
  const customersQuery = useCustomers();
  const productsQuery = useProducts();
  const ordersQuery = useSalesOrders();
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [dateRange, setDateRange] = useState<[number, number] | null>(null);

  const customers = customersQuery.data ?? [];
  const products  = productsQuery.data ?? [];
  const orders    = ordersQuery.data ?? [];

  const filteredOrders = useMemo(
    () => orders.filter((o) => {
      if (!dateRange) return true;
      const ts = new Date(o.createdAt).getTime();
      return ts >= dateRange[0] && ts <= dateRange[1];
    }),
    [dateRange, orders],
  );

  const recognizedOrders  = filteredOrders.filter((o) => o.status !== 'CANCELLED');
  const salesRevenue       = recognizedOrders.reduce((s, o) => s + toNumber(o.totalAmount), 0);
  const averageOrderValue  = recognizedOrders.length ? salesRevenue / recognizedOrders.length : 0;
  const completedCount     = filteredOrders.filter((o) => o.status === 'COMPLETED').length;

  const inventoryValue = products.reduce((s, p) => s + toNumber(p.costPrice) * toNumber(p.stock), 0);
  const totalUnits     = products.reduce((s, p) => s + toNumber(p.stock), 0);
  const lowStockCount  = products.filter((p) => p.isLowStock).length;

  const totalReceivables  = customers.reduce((s, c) => s + toNumber(c.debtBalance), 0);
  const creditExposure    = customers.reduce((s, c) => s + toNumber(c.creditLimit), 0);
  const debtorCount       = customers.filter((c) => toNumber(c.debtBalance) > 0).length;
  const highRiskCustomers = customers.filter((c) => {
    const lim = toNumber(c.creditLimit);
    return lim > 0 && toNumber(c.debtBalance) / lim >= 0.8;
  });

  function refreshReports() {
    void Promise.all([dashboardQuery.refetch(), customersQuery.refetch(), productsQuery.refetch(), ordersQuery.refetch()]);
  }

  function exportActiveReport() {
    if (activeTab === 'sales') {
      downloadCsv('dms-sales-report.csv', [
        ['Order', 'Created At', 'Status', 'Total', 'Paid', 'Debt'],
        ...filteredOrders.map((o) => [o.code, o.createdAt, o.status, toNumber(o.totalAmount), toNumber(o.paidAmount), toNumber(o.debtAmount)]),
      ]);
      return;
    }
    if (activeTab === 'inventory') {
      downloadCsv('dms-inventory-report.csv', [
        ['SKU', 'Product', 'On Hand', 'Minimum', 'Cost Price', 'Status'],
        ...products.map((p) => [p.sku, p.name, p.stock, p.minStock, toNumber(p.costPrice), p.isLowStock ? 'LOW STOCK' : 'HEALTHY']),
      ]);
      return;
    }
    downloadCsv('dms-receivables-report.csv', [
      ['Customer', 'Phone', 'Debt Balance', 'Credit Limit', 'Payment Term Days'],
      ...customers.map((c) => [c.name, c.phone ?? '', toNumber(c.debtBalance), toNumber(c.creditLimit), c.paymentTermDays]),
    ]);
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Reports"
        subtitle="Analyze sales, inventory and receivable performance."
        extra={(
          <Space>
            <DatePicker.RangePicker
              allowClear
              onChange={(vals) => {
                if (!vals?.[0] || !vals[1]) { setDateRange(null); return; }
                setDateRange([vals[0].startOf('day').valueOf(), vals[1].endOf('day').valueOf()]);
              }}
            />
            <Button icon={<ReloadOutlined />} onClick={refreshReports}>Refresh</Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={exportActiveReport}>Export CSV</Button>
          </Space>
        )}
      />

      <QueryState
        isLoading={dashboardQuery.isLoading || customersQuery.isLoading || productsQuery.isLoading || ordersQuery.isLoading}
        isError={dashboardQuery.isError || customersQuery.isError || productsQuery.isError || ordersQuery.isError}
        error={dashboardQuery.error || customersQuery.error || productsQuery.error || ordersQuery.error}
        hasData={Boolean(dashboardQuery.data)}
        emptyTitle="No report data available"
        emptyDescription="Operational reports will appear after business data is available."
        onRetry={refreshReports}
      >
        {dashboardQuery.data ? (
          <div className={styles.reportContent}>
            <Tabs
              className={styles.reportTabs}
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as ReportTab)}
              items={[
                /* ──────── SALES TAB ──────── */
                {
                  key: 'sales',
                  label: (
                    <span className={styles.tabLabel}>
                      <ShoppingCartOutlined /> Sales
                    </span>
                  ),
                  children: (
                    <div className={styles.tabContent}>
                      {/* Stat strip replaces 4 boring cards */}
                      <StatStrip items={[
                        { icon: <DollarOutlined />, label: 'Revenue', value: formatCurrency(salesRevenue), color: '#6366f1' },
                        { icon: <ShoppingCartOutlined />, label: 'Orders', value: filteredOrders.length, color: '#3b82f6' },
                        { icon: <BarChartOutlined />, label: 'Avg. Order', value: formatCurrency(averageOrderValue), color: '#8b5cf6' },
                        { icon: <CheckCircleOutlined />, label: 'Completed', value: completedCount, color: '#10b981' },
                      ]} />

                      <div className={styles.chartGrid}>
                        <RevenueByOrderChart orders={filteredOrders} />
                        <OrderStatusChart orders={filteredOrders} />
                      </div>

                      <Card title="Top Sales Orders" className="panel-card">
                        <Table rowKey="id" size="small" sticky scroll={{ x: 760 }}
                          dataSource={[...filteredOrders].sort((a, b) => toNumber(b.totalAmount) - toNumber(a.totalAmount)).slice(0, 10)}
                          locale={{ emptyText: 'No sales orders in this period' }}
                          columns={[
                            { title: 'Order', dataIndex: 'code' },
                            { title: 'Created', dataIndex: 'createdAt', render: formatDateTime },
                            { title: 'Status', dataIndex: 'status', render: (v) => <SalesOrderStatusTag status={v} /> },
                            { title: 'Revenue', dataIndex: 'totalAmount', align: 'right', render: formatCurrency },
                            { title: 'Debt', dataIndex: 'debtAmount', align: 'right', render: formatCurrency },
                          ]}
                        />
                      </Card>
                    </div>
                  ),
                },
                /* ──────── INVENTORY TAB ──────── */
                {
                  key: 'inventory',
                  label: (
                    <span className={styles.tabLabel}>
                      <InboxOutlined /> Inventory
                    </span>
                  ),
                  children: (
                    <div className={styles.tabContent}>
                      <StatStrip items={[
                        { icon: <InboxOutlined />, label: 'Tracked SKUs', value: products.length, color: '#6366f1' },
                        { icon: <BarChartOutlined />, label: 'Total Units', value: totalUnits.toLocaleString('vi-VN'), color: '#3b82f6' },
                        { icon: <DollarOutlined />, label: 'Inventory Value', value: formatCurrency(inventoryValue), color: '#8b5cf6' },
                        { icon: <WarningOutlined />, label: 'Low Stock', value: lowStockCount, color: lowStockCount > 0 ? '#f59e0b' : '#10b981' },
                      ]} />

                      <InventoryStockChart products={products} />

                      <Card title="Inventory Exposure" className="panel-card">
                        <Table rowKey="id" size="small" sticky scroll={{ x: 820 }}
                          dataSource={products}
                          locale={{ emptyText: 'No inventory data yet' }}
                          columns={[
                            { title: 'SKU', dataIndex: 'sku' },
                            { title: 'Product', dataIndex: 'name' },
                            { title: 'On Hand', dataIndex: 'stock', align: 'right' },
                            { title: 'Minimum', dataIndex: 'minStock', align: 'right' },
                            { title: 'Cost Value', align: 'right', render: (_, r) => formatCurrency(toNumber(r.costPrice) * toNumber(r.stock)) },
                            { title: 'Status', render: (_, r) => <ProductStatusTag active={r.active} isLowStock={r.isLowStock} /> },
                          ]}
                        />
                      </Card>
                    </div>
                  ),
                },
                /* ──────── RECEIVABLES TAB ──────── */
                {
                  key: 'receivables',
                  label: (
                    <span className={styles.tabLabel}>
                      <TeamOutlined /> Receivables
                    </span>
                  ),
                  children: (
                    <div className={styles.tabContent}>
                      <StatStrip items={[
                        { icon: <DollarOutlined />, label: 'Receivables', value: formatCurrency(totalReceivables), color: '#ef4444' },
                        { icon: <TeamOutlined />, label: 'Debtor Accounts', value: debtorCount, color: '#f97316' },
                        { icon: <BarChartOutlined />, label: 'Credit Exposure', value: formatCurrency(creditExposure), color: '#6366f1' },
                        { icon: <WarningOutlined />, label: 'High Risk', value: highRiskCustomers.length, color: highRiskCustomers.length > 0 ? '#ef4444' : '#10b981' },
                      ]} />

                      {/* Horizontal debt bars for top customers */}
                      {debtorCount > 0 && (
                        <Card title="Receivable by Customer" className="panel-card">
                          <div className={styles.debtBarList}>
                            {[...customers]
                              .filter((c) => toNumber(c.debtBalance) > 0)
                              .sort((a, b) => toNumber(b.debtBalance) - toNumber(a.debtBalance))
                              .slice(0, 8)
                              .map((c, i) => {
                                const maxDebt = toNumber(
                                  [...customers].sort((a, b) => toNumber(b.debtBalance) - toNumber(a.debtBalance))[0]?.debtBalance ?? 0,
                                );
                                const pct = maxDebt > 0 ? (toNumber(c.debtBalance) / maxDebt) * 100 : 0;
                                const limitPct = toNumber(c.creditLimit) > 0
                                  ? Math.min(Math.round((toNumber(c.debtBalance) / toNumber(c.creditLimit)) * 100), 100)
                                  : 0;
                                return (
                                  <div key={c.id} className={styles.debtBarRow}>
                                    <div className={styles.debtBarMeta}>
                                      <span className={styles.debtBarRank}>{i + 1}</span>
                                      <span className={styles.debtBarName}>{c.name}</span>
                                      <span className={styles.debtBarTerm}>{c.paymentTermDays}d term</span>
                                      {limitPct >= 80 && (
                                        <Tag color={limitPct >= 100 ? 'error' : 'warning'} style={{ margin: 0 }}>
                                          {limitPct}% of limit
                                        </Tag>
                                      )}
                                      <span className={styles.debtBarAmt}>{formatCurrency(c.debtBalance)}</span>
                                    </div>
                                    <div className={styles.debtBarTrack}>
                                      <div
                                        className={styles.debtBarFill}
                                        style={{
                                          width: `${pct}%`,
                                          background: i === 0
                                            ? 'linear-gradient(90deg,#ef4444,#f97316)'
                                            : i === 1
                                              ? 'linear-gradient(90deg,#f97316,#fbbf24)'
                                              : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </Card>
                      )}

                      <Card title="Full Receivable Table" className="panel-card">
                        <Table rowKey="id" size="small" sticky scroll={{ x: 900 }}
                          dataSource={[...customers].sort((a, b) => toNumber(b.debtBalance) - toNumber(a.debtBalance))}
                          locale={{ emptyText: 'No receivable data yet' }}
                          columns={[
                            { title: 'Customer', dataIndex: 'name' },
                            { title: 'Term', dataIndex: 'paymentTermDays', render: (v) => `${v} days` },
                            { title: 'Debt', dataIndex: 'debtBalance', align: 'right', render: formatCurrency },
                            { title: 'Credit Limit', dataIndex: 'creditLimit', align: 'right', render: formatCurrency },
                            {
                              title: 'Utilization', width: 220,
                              render: (_, r) => {
                                const lim = toNumber(r.creditLimit);
                                const pct = lim > 0 ? Math.round((toNumber(r.debtBalance) / lim) * 100) : 0;
                                return (
                                  <div className={styles.creditUsage}>
                                    <Progress percent={Math.min(pct, 100)} showInfo={false} size="small"
                                      status={pct >= 100 ? 'exception' : pct >= 80 ? 'normal' : 'success'} />
                                    <Tag color={pct >= 100 ? 'error' : pct >= 80 ? 'warning' : 'success'}>
                                      {lim > 0 ? `${pct}%` : 'No limit'}
                                    </Tag>
                                  </div>
                                );
                              },
                            },
                          ]}
                        />
                      </Card>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        ) : null}
      </QueryState>
    </div>
  );
}
