import {
  BarChartOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  DownOutlined,
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
  Dropdown,
  Progress,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import {
  ProductStatusTag,
  SalesOrderStatusTag,
} from '../../../../components/common/StatusTag';
import { formatCurrency, formatDateTime, formatNumber, toNumber } from '../../../../lib/format';
import { PERMISSIONS, hasPermission, useAuth } from '../../../auth';
import { useCustomers } from '../../../customers';
import { useDashboardData } from '../../../dashboard';
import { useProducts } from '../../../products';
import { useSalesOrders } from '../../../sales';
import {
  InventoryStockChart,
  OrderStatusChart,
  RevenueByOrderChart,
} from '../../components';
import { exportReport, type ReportExportFormat, type ReportTab } from './reportsExport';
import styles from './ReportsPage.module.css';


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
  const { t } = useTranslation();
  const { user } = useAuth();
  const canViewCustomers = hasPermission(user, PERMISSIONS.CUSTOMER_VIEW);
  const canViewOrders = hasPermission(user, PERMISSIONS.SALES_ORDER_VIEW);
  const canViewInventoryProducts = hasPermission(user, PERMISSIONS.PRODUCT_VIEW) && hasPermission(user, PERMISSIONS.INVENTORY_VIEW);
  const dashboardQuery = useDashboardData();
  const customersQuery = useCustomers({ enabled: canViewCustomers });
  const productsQuery = useProducts({ enabled: canViewInventoryProducts });
  const ordersQuery = useSalesOrders({ enabled: canViewOrders });
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [dateRange, setDateRange] = useState<[number, number] | null>(null);
  const [exporting, setExporting] = useState(false);

  const customers = canViewCustomers ? customersQuery.data ?? [] : [];
  const products = canViewInventoryProducts ? productsQuery.data ?? [] : [];
  const orders = canViewOrders ? ordersQuery.data ?? [] : [];

  const filteredOrders = useMemo(
    () => orders.filter((o) => {
      if (!dateRange) return true;
      const ts = new Date(o.createdAt).getTime();
      return ts >= dateRange[0] && ts <= dateRange[1];
    }),
    [dateRange, orders],
  );

  const recognizedOrders  = filteredOrders.filter((o) => o.status === 'COMPLETED');
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
    void Promise.all([
      dashboardQuery.refetch(),
      canViewCustomers ? customersQuery.refetch() : Promise.resolve(),
      canViewInventoryProducts ? productsQuery.refetch() : Promise.resolve(),
      canViewOrders ? ordersQuery.refetch() : Promise.resolve(),
    ]);
  }

  async function handleExport(format: ReportExportFormat) {
    setExporting(true);

    try {
      await exportReport(format, {
        activeTab,
        customers,
        filteredOrders,
        products,
        t,
      });
    } finally {
      setExporting(false);
    }
  }
  return (
    <div className={styles.page}>
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        extra={(
          <Space>
            <DatePicker.RangePicker
              allowClear
              onChange={(vals) => {
                if (!vals?.[0] || !vals[1]) { setDateRange(null); return; }
                setDateRange([vals[0].startOf('day').valueOf(), vals[1].endOf('day').valueOf()]);
              }}
            />
            <Button icon={<ReloadOutlined />} onClick={refreshReports}>{t('reports.action.refresh')}</Button>
            <Dropdown
              menu={{
                items: [
                  { key: 'csv', label: t('common.exportCsv') },
                  { key: 'xlsx', label: t('common.exportXlsx') },
                ],
                onClick: ({ key }) => {
                  void handleExport(key as ReportExportFormat);
                },
              }}
            >
              <Button type="primary" icon={<DownloadOutlined />} loading={exporting}>
                {t('common.export')} <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        )}
      />

      <QueryState
        isLoading={dashboardQuery.isLoading || (canViewCustomers && customersQuery.isLoading) || (canViewInventoryProducts && productsQuery.isLoading) || (canViewOrders && ordersQuery.isLoading)}
        isError={dashboardQuery.isError || (canViewCustomers && customersQuery.isError) || (canViewInventoryProducts && productsQuery.isError) || (canViewOrders && ordersQuery.isError)}
        error={dashboardQuery.error || (canViewCustomers && customersQuery.error) || (canViewInventoryProducts && productsQuery.error) || (canViewOrders && ordersQuery.error)}
        hasData={Boolean(dashboardQuery.data)}
        emptyTitle={t('reports.title')}
        emptyDescription={t('reports.empty.description')}
        onRetry={refreshReports}
      >
        {dashboardQuery.data ? (
          <div className={styles.reportContent}>
            <Tabs
              className={styles.reportTabs}
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as ReportTab)}
              items={[                {
                  key: 'sales',
                  label: (
                    <span className={styles.tabLabel}>
                      <ShoppingCartOutlined /> {t('reports.tabs.sales')}
                    </span>
                  ),
                  children: (
                    <div className={styles.tabContent}>                      <StatStrip items={[
                        { icon: <DollarOutlined />, label: t('reports.metric.revenue'), value: formatCurrency(salesRevenue), color: '#6366f1' },
                        { icon: <ShoppingCartOutlined />, label: t('reports.metric.orders'), value: filteredOrders.length, color: '#3b82f6' },
                        { icon: <BarChartOutlined />, label: t('reports.metric.avgOrder'), value: formatCurrency(averageOrderValue), color: '#8b5cf6' },
                        { icon: <CheckCircleOutlined />, label: t('reports.metric.completed'), value: completedCount, color: '#10b981' },
                      ]} />

                      <div className={styles.chartGrid}>
                        <RevenueByOrderChart orders={filteredOrders} />
                        <OrderStatusChart orders={filteredOrders} />
                      </div>

                      <Card title={t('reports.title')} className="panel-card">
                        <Table rowKey="id" size="small" sticky scroll={{ x: 760 }}
                          dataSource={[...filteredOrders].sort((a, b) => toNumber(b.totalAmount) - toNumber(a.totalAmount)).slice(0, 10)}
                          locale={{ emptyText: t('reports.empty.noSalesOrders') }}
                          columns={[
                            { title: t('reports.table.order'), dataIndex: 'code' },
                            { title: t('reports.table.created'), dataIndex: 'createdAt', render: (value) => formatDateTime(value) },
                            { title: t('reports.table.status'), dataIndex: 'status', render: (v) => <SalesOrderStatusTag status={v} /> },
                            { title: t('reports.table.revenue'), dataIndex: 'totalAmount', align: 'right', render: (value) => formatCurrency(value) },
                            { title: t('reports.table.debt'), dataIndex: 'debtAmount', align: 'right', render: (value) => formatCurrency(value) },
                          ]}
                        />
                      </Card>
                    </div>
                  ),
                },                {
                  key: 'inventory',
                  label: (
                    <span className={styles.tabLabel}>
                      <InboxOutlined /> {t('reports.tabs.inventory')}
                    </span>
                  ),
                  children: (
                    <div className={styles.tabContent}>
                      <StatStrip items={[
                        { icon: <InboxOutlined />, label: t('reports.metric.trackedSkus'), value: products.length, color: '#6366f1' },
                        { icon: <BarChartOutlined />, label: t('reports.metric.totalUnits'), value: formatNumber(totalUnits), color: '#3b82f6' },
                        { icon: <DollarOutlined />, label: t('reports.metric.inventoryValue'), value: formatCurrency(inventoryValue), color: '#8b5cf6' },
                        { icon: <WarningOutlined />, label: t('reports.metric.lowStock'), value: lowStockCount, color: lowStockCount > 0 ? '#f59e0b' : '#10b981' },
                      ]} />

                      <InventoryStockChart products={products} />

                      <Card title={t('reports.title')} className="panel-card">
                        <Table rowKey="id" size="small" sticky scroll={{ x: 820 }}
                          dataSource={products}
                          locale={{ emptyText: t('reports.empty.noInventory') }}
                          columns={[
                            { title: t('reports.table.sku'), dataIndex: 'sku' },
                            { title: t('reports.table.product'), dataIndex: 'name' },
                            { title: t('reports.table.onHand'), dataIndex: 'stock', align: 'right' },
                            { title: t('reports.table.minimum'), dataIndex: 'minStock', align: 'right' },
                            { title: t('reports.table.costValue'), align: 'right', render: (_, r) => formatCurrency(toNumber(r.costPrice) * toNumber(r.stock)) },
                            { title: t('reports.table.status'), render: (_, r) => <ProductStatusTag active={r.active} isLowStock={r.isLowStock} /> },
                          ]}
                        />
                      </Card>
                    </div>
                  ),
                },                {
                  key: 'receivables',
                  label: (
                    <span className={styles.tabLabel}>
                      <TeamOutlined /> {t('reports.tabs.receivables')}
                    </span>
                  ),
                  children: (
                    <div className={styles.tabContent}>
                      <StatStrip items={[
                        { icon: <DollarOutlined />, label: t('reports.metric.receivables'), value: formatCurrency(totalReceivables), color: '#ef4444' },
                        { icon: <TeamOutlined />, label: t('reports.metric.debtorAccounts'), value: debtorCount, color: '#f97316' },
                        { icon: <BarChartOutlined />, label: t('reports.metric.creditExposure'), value: formatCurrency(creditExposure), color: '#6366f1' },
                        { icon: <WarningOutlined />, label: t('reports.metric.highRisk'), value: highRiskCustomers.length, color: highRiskCustomers.length > 0 ? '#ef4444' : '#10b981' },
                      ]} />                      {debtorCount > 0 && (
                        <Card title={t('reports.title')} className="panel-card">
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
                                      <span className={styles.debtBarTerm}>{t('reports.table.termShort', { count: c.paymentTermDays })}</span>
                                      {limitPct >= 80 && (
                                        <Tag color={limitPct >= 100 ? 'error' : 'warning'} style={{ margin: 0 }}>
                                          {t('reports.table.ofLimit', { percent: limitPct })}
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

                      <Card title={t('reports.title')} className="panel-card">
                        <Table rowKey="id" size="small" sticky scroll={{ x: 900 }}
                          dataSource={[...customers].sort((a, b) => toNumber(b.debtBalance) - toNumber(a.debtBalance))}
                          locale={{ emptyText: t('reports.empty.noReceivables') }}
                          columns={[
                            { title: t('reports.table.customer'), dataIndex: 'name' },
                            { title: t('reports.table.term'), dataIndex: 'paymentTermDays', render: (v) => t('reports.table.days', { count: v }) },
                            { title: t('reports.table.debt'), dataIndex: 'debtBalance', align: 'right', render: (value) => formatCurrency(value) },
                            { title: t('reports.table.creditLimit'), dataIndex: 'creditLimit', align: 'right', render: (value) => formatCurrency(value) },
                            {
                              title: t('reports.table.utilization'), width: 220,
                              render: (_, r) => {
                                const lim = toNumber(r.creditLimit);
                                const pct = lim > 0 ? Math.round((toNumber(r.debtBalance) / lim) * 100) : 0;
                                return (
                                  <div className={styles.creditUsage}>
                                    <Progress percent={Math.min(pct, 100)} showInfo={false} size="small"
                                      status={pct >= 100 ? 'exception' : pct >= 80 ? 'normal' : 'success'} />
                                    <Tag color={pct >= 100 ? 'error' : pct >= 80 ? 'warning' : 'success'}>
                                      {lim > 0 ? `${pct}%` : t('reports.table.noLimit')}
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
