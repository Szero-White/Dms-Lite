import {
  BarChartOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  DownOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilterOutlined,
  InboxOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Descriptions,
  Drawer,
  Dropdown,
  Input,
  Popover,
  Progress,
  Select,
  Space,
  Table,
  Tooltip,
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
import { compareBoolean, compareDate, compareNumber, compareText, TABLE_SORT_DIRECTIONS } from '../../../../lib/tableSorting';
import { PERMISSIONS, canViewCustomerBalance, hasPermission, useAuth } from '../../../auth';
import { useCustomers } from '../../../customers';
import { useDashboardData } from '../../../dashboard';
import { useProducts } from '../../../products';
import { useSalesReport } from '../../hooks/useSalesReportQueries';
import type { SalesReportOrder } from '../../types/salesReport.types';
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
  const canViewReceivables = canViewCustomers && canViewCustomerBalance(user);
  const availableTabs = [
    ...(canViewOrders ? ['sales' as const] : []),
    ...(canViewInventoryProducts ? ['inventory' as const] : []),
    ...(canViewReceivables ? ['receivables' as const] : []),
  ];
  const dashboardQuery = useDashboardData();
  const customersQuery = useCustomers({ enabled: canViewReceivables });
  const productsQuery = useProducts({ enabled: canViewInventoryProducts });
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [dateRange, setDateRange] = useState<[number, number] | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selectedReportOrder, setSelectedReportOrder] = useState<SalesReportOrder | null>(null);
  const [salesKeyword, setSalesKeyword] = useState('');
  const [salesStatus, setSalesStatus] = useState('ALL');
  const [salesCustomer, setSalesCustomer] = useState<number | 'ALL'>('ALL');
  const [collectionFilters, setCollectionFilters] = useState<string[]>(['ALL']);
  const resolvedActiveTab = availableTabs.includes(activeTab) ? activeTab : availableTabs[0] ?? 'sales';

  const salesReportRange = useMemo(
    () => dateRange
      ? {
          from: new Date(dateRange[0]).toISOString(),
          to: new Date(dateRange[1]).toISOString(),
        }
      : {},
    [dateRange],
  );
  const salesReportQuery = useSalesReport({
    enabled: canViewOrders,
    ...salesReportRange,
  });

  const customers = canViewReceivables ? customersQuery.data ?? [] : [];
  const products = canViewInventoryProducts ? productsQuery.data ?? [] : [];
  const reportOrders = canViewOrders ? salesReportQuery.data?.orders ?? [] : [];
  const salesSummary = salesReportQuery.data?.summary;
  const reportCustomers = useMemo(() => {
    const byId = new Map<number, string>();
    reportOrders.forEach((order) => byId.set(order.customerId, order.customerName ?? `#${order.customerId}`));
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [reportOrders]);
  const filteredReportOrders = useMemo(() => {
    const keyword = salesKeyword.trim().toLowerCase();
    return reportOrders.filter((order) => {
      const matchesKeyword = !keyword
        || order.code.toLowerCase().includes(keyword)
        || (order.customerName ?? '').toLowerCase().includes(keyword);
      const matchesStatus = salesStatus === 'ALL' || order.status === salesStatus;
      const matchesCustomer = salesCustomer === 'ALL' || order.customerId === salesCustomer;
      const matchesCollection = collectionFilters.includes('ALL') || (
        order.receivableRecognized && (
          (collectionFilters.includes('UNPAID') && toNumber(order.collectedAmount) <= 0 && toNumber(order.remainingReceivable) > 0) ||
          (collectionFilters.includes('PARTIAL') && toNumber(order.collectedAmount) > 0 && toNumber(order.remainingReceivable) > 0) ||
          (collectionFilters.includes('PAID') && toNumber(order.remainingReceivable) <= 0)
        )
      );
      return matchesKeyword && matchesStatus && matchesCustomer && matchesCollection;
    });
  }, [collectionFilters, reportOrders, salesCustomer, salesKeyword, salesStatus]);
  const hasSalesTableFilters = Boolean(
    salesKeyword || salesStatus !== 'ALL' || salesCustomer !== 'ALL' || !collectionFilters.includes('ALL')
  );
  const salesRevenue = toNumber(salesSummary?.recognizedRevenue);
  const averageOrderValue = toNumber(salesSummary?.averageCompletedOrderValue);
  const completedCount = salesSummary?.completedOrders ?? 0;
  const salesOrderCount = salesSummary?.totalOrders ?? 0;

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
      canViewReceivables ? customersQuery.refetch() : Promise.resolve(),
      canViewInventoryProducts ? productsQuery.refetch() : Promise.resolve(),
      canViewOrders ? salesReportQuery.refetch() : Promise.resolve(),
    ]);
  }

  async function handleExport(format: ReportExportFormat) {
    setExporting(true);

    try {
      await exportReport(format, {
        activeTab: resolvedActiveTab,
        customers,
        salesOrders: resolvedActiveTab === 'sales' ? filteredReportOrders : reportOrders,
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
            {canViewOrders ? (
              <DatePicker.RangePicker
                allowClear
                onChange={(vals) => {
                  if (!vals?.[0] || !vals[1]) { setDateRange(null); return; }
                  setDateRange([vals[0].startOf('day').valueOf(), vals[1].endOf('day').valueOf()]);
                }}
              />
            ) : null}
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
              <Button type="primary" icon={<DownloadOutlined />} loading={exporting} disabled={availableTabs.length === 0}>
                {t('common.export')} <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        )}
      />

      <QueryState
        isLoading={dashboardQuery.isLoading || (canViewReceivables && customersQuery.isLoading) || (canViewInventoryProducts && productsQuery.isLoading) || (canViewOrders && salesReportQuery.isLoading)}
        isError={dashboardQuery.isError || (canViewReceivables && customersQuery.isError) || (canViewInventoryProducts && productsQuery.isError) || (canViewOrders && salesReportQuery.isError)}
        error={dashboardQuery.error || (canViewReceivables && customersQuery.error) || (canViewInventoryProducts && productsQuery.error) || (canViewOrders && salesReportQuery.error)}
        hasData={Boolean(dashboardQuery.data)}
        emptyTitle={t('reports.title')}
        emptyDescription={t('reports.empty.description')}
        onRetry={refreshReports}
      >
        {dashboardQuery.data ? (
          <div className={styles.reportContent}>
            {availableTabs.length > 0 ? (
              <Tabs
              className={styles.reportTabs}
              activeKey={resolvedActiveTab}
              onChange={(key) => setActiveTab(key as ReportTab)}
              items={[
                ...(canViewOrders ? [{
                  key: 'sales',
                  label: (
                    <span className={styles.tabLabel}>
                      <ShoppingCartOutlined /> {t('reports.tabs.sales')}
                    </span>
                  ),
                  children: (
                    <div className={styles.tabContent}>                      <StatStrip items={[
                        { icon: <DollarOutlined />, label: t('reports.metric.revenue'), value: formatCurrency(salesRevenue), color: '#6366f1' },
                        { icon: <ShoppingCartOutlined />, label: t('reports.metric.orders'), value: salesOrderCount, color: '#3b82f6' },
                        { icon: <BarChartOutlined />, label: t('reports.metric.avgOrder'), value: formatCurrency(averageOrderValue), color: '#8b5cf6' },
                        { icon: <CheckCircleOutlined />, label: t('reports.metric.completed'), value: completedCount, color: '#10b981' },
                      ]} />

                      <div className={styles.chartGrid}>
                        <RevenueByOrderChart orders={reportOrders} />
                        <OrderStatusChart orders={reportOrders} />
                      </div>

                      <Card title={t('reports.title')} className="panel-card">
                        <div className={styles.salesTableFilters}>
                          <Input
                            allowClear
                            className={styles.salesSearch}
                            prefix={<SearchOutlined />}
                            placeholder={t('reports.filters.searchPlaceholder')}
                            value={salesKeyword}
                            onChange={(event) => setSalesKeyword(event.target.value)}
                          />
                          <Select
                            className={styles.salesFilter}
                            value={salesStatus}
                            onChange={setSalesStatus}
                            options={[
                              { value: 'ALL', label: t('reports.filters.allStatuses') },
                              { value: 'DRAFT', label: t('status.sales.DRAFT') },
                              { value: 'COMPLETED', label: t('status.sales.COMPLETED') },
                              { value: 'CANCELLED', label: t('status.sales.CANCELLED') },
                            ]}
                          />
                          <Select
                            showSearch
                            optionFilterProp="label"
                            className={styles.salesCustomerFilter}
                            value={salesCustomer}
                            onChange={setSalesCustomer}
                            options={[
                              { value: 'ALL', label: t('reports.filters.allCustomers') },
                              ...reportCustomers.map((customer) => ({ value: customer.id, label: customer.name })),
                            ]}
                          />
                          <Popover
                            trigger="click"
                            placement="bottomLeft"
                            content={(
                              <div className={styles.collectionFilterMenu}>
                                <Typography.Text strong>{t('reports.filters.collectionStatus')}</Typography.Text>
                                <Checkbox.Group
                                  className={styles.collectionFilterGroup}
                                  value={collectionFilters}
                                  options={[
                                    { value: 'ALL', label: t('reports.filters.collectionAll') },
                                    { value: 'UNPAID', label: t('reports.filters.collectionUnpaid') },
                                    { value: 'PARTIAL', label: t('reports.filters.collectionPartial') },
                                    { value: 'PAID', label: t('reports.filters.collectionPaid') },
                                  ]}
                                  onChange={(values) => {
                                    const next = values.map(String);
                                    const previousAll = collectionFilters.includes('ALL');
                                    const nextAll = next.includes('ALL');
                                    if (nextAll && !previousAll) {
                                      setCollectionFilters(['ALL']);
                                      return;
                                    }
                                    const specific = next.filter((value) => value !== 'ALL');
                                    setCollectionFilters(specific.length > 0 ? specific : ['ALL']);
                                  }}
                                />
                              </div>
                            )}
                          >
                            <Button icon={<FilterOutlined />}>
                              {t('reports.filters.collectionStatus')}
                              {!collectionFilters.includes('ALL') ? ` (${collectionFilters.length})` : ''}
                            </Button>
                          </Popover>
                          <Button
                            disabled={!hasSalesTableFilters}
                            onClick={() => {
                              setSalesKeyword('');
                              setSalesStatus('ALL');
                              setSalesCustomer('ALL');
                              setCollectionFilters(['ALL']);
                            }}
                          >
                            {t('common.clearFilters')}
                          </Button>
                        </div>
                        {hasSalesTableFilters ? (
                          <div className={styles.salesFilterChips}>
                            {salesKeyword ? <Tag closable onClose={() => setSalesKeyword('')}>{t('reports.filters.searchChip', { keyword: salesKeyword })}</Tag> : null}
                            {salesStatus !== 'ALL' ? <Tag closable onClose={() => setSalesStatus('ALL')}>{t(`status.sales.${salesStatus}`)}</Tag> : null}
                            {salesCustomer !== 'ALL' ? <Tag closable onClose={() => setSalesCustomer('ALL')}>{reportCustomers.find((customer) => customer.id === salesCustomer)?.name ?? salesCustomer}</Tag> : null}
                            {!collectionFilters.includes('ALL') ? collectionFilters.map((filter) => (
                              <Tag key={filter} closable onClose={() => {
                                const next = collectionFilters.filter((value) => value !== filter);
                                setCollectionFilters(next.length > 0 ? next : ['ALL']);
                              }}>
                                {t(`reports.filters.collection.${filter}`)}
                              </Tag>
                            )) : null}
                          </div>
                        ) : null}
                        <Table
                          rowKey="id"
                          size="small"
                          scroll={{ x: 1180 }}
                          sortDirections={TABLE_SORT_DIRECTIONS}
                          showSorterTooltip={false}
                          dataSource={filteredReportOrders}
                          locale={{ emptyText: t('reports.empty.noSalesOrders') }}
                          columns={[
                            { title: t('reports.table.order'), dataIndex: 'code', width: 160, sorter: (first, second) => compareText(first.code, second.code) },
                            {
                              title: t('reports.table.customer'),
                              width: 230,
                              sorter: (first, second) => compareText(first.customerName, second.customerName),
                              render: (_, order) => order.customerName ?? '--',
                            },
                            { title: t('reports.table.reportDate'), dataIndex: 'reportDate', width: 170, defaultSortOrder: 'descend', sorter: (first, second) => compareDate(first.reportDate, second.reportDate), render: (value) => formatDateTime(value) },
                            { title: t('reports.table.status'), dataIndex: 'status', width: 130, sorter: (first, second) => compareText(first.status, second.status), render: (v) => <SalesOrderStatusTag status={v} /> },
                            { title: t('reports.table.orderTotal'), dataIndex: 'totalAmount', width: 150, align: 'right', sorter: (first, second) => compareNumber(first.totalAmount, second.totalAmount), render: (value) => formatCurrency(value) },
                            { title: t('reports.table.collected'), dataIndex: 'collectedAmount', width: 150, align: 'right', sorter: (first, second) => compareNumber(first.collectedAmount, second.collectedAmount), render: (value, order) => order.receivableRecognized ? formatCurrency(value) : t('reports.value.notApplicable') },
                            { title: t('reports.table.remainingDebt'), dataIndex: 'remainingReceivable', width: 170, align: 'right', sorter: (first, second) => compareNumber(first.remainingReceivable, second.remainingReceivable), render: (value, order) => order.receivableRecognized ? formatCurrency(value) : t('reports.value.notRecognized') },
                            {
                              title: t('reports.table.collectionProgress'),
                              width: 180,
                              sorter: (first, second) => compareNumber(first.collectionProgress, second.collectionProgress),
                              render: (_, order) => {
                                if (!order.receivableRecognized || order.collectionProgress === null) {
                                  return t('reports.value.notApplicable');
                                }

                                return (
                                  <div className={styles.collectionProgress}>
                                    <Progress percent={order.collectionProgress} size="small" showInfo={false} />
                                    <span>{order.collectionProgress}%</span>
                                  </div>
                                );
                              },
                            },
                            {
                              title: '',
                              width: 56,
                              align: 'center',
                              fixed: 'right',
                              render: (_, order) => (
                                <Tooltip title={t('reports.action.viewOrder')}>
                                  <Button
                                    type="text"
                                    icon={<EyeOutlined />}
                                    aria-label={t('reports.action.viewOrder')}
                                    onClick={() => setSelectedReportOrder(order)}
                                  />
                                </Tooltip>
                              ),
                            },
                          ]}
                        />
                      </Card>
                    </div>
                  ),
                }] : []),
                ...(canViewInventoryProducts ? [{
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
                        <Table rowKey="id" size="small" scroll={{ x: 820 }}
                          sortDirections={TABLE_SORT_DIRECTIONS}
                          showSorterTooltip={false}
                          dataSource={products}
                          locale={{ emptyText: t('reports.empty.noInventory') }}
                          columns={[
                            { title: t('reports.table.sku'), dataIndex: 'sku', sorter: (first, second) => compareText(first.sku, second.sku) },
                            { title: t('reports.table.product'), dataIndex: 'name', sorter: (first, second) => compareText(first.name, second.name) },
                            { title: t('reports.table.onHand'), dataIndex: 'stock', align: 'right', sorter: (first, second) => compareNumber(first.stock, second.stock) },
                            { title: t('reports.table.minimum'), dataIndex: 'minStock', align: 'right', sorter: (first, second) => compareNumber(first.minStock, second.minStock) },
                            { title: t('reports.table.costValue'), align: 'right', sorter: (first, second) => compareNumber(toNumber(first.costPrice) * toNumber(first.stock), toNumber(second.costPrice) * toNumber(second.stock)), render: (_, r) => formatCurrency(toNumber(r.costPrice) * toNumber(r.stock)) },
                            { title: t('reports.table.status'), sorter: (first, second) => compareBoolean(first.isLowStock, second.isLowStock) || compareBoolean(first.active, second.active), render: (_, r) => <ProductStatusTag active={r.active} isLowStock={r.isLowStock} /> },
                          ]}
                        />
                      </Card>
                    </div>
                  ),
                }] : []),
                ...(canViewReceivables ? [{
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
                        <Table rowKey="id" size="small" scroll={{ x: 900 }}
                          sortDirections={TABLE_SORT_DIRECTIONS}
                          showSorterTooltip={false}
                          dataSource={[...customers].sort((a, b) => toNumber(b.debtBalance) - toNumber(a.debtBalance))}
                          locale={{ emptyText: t('reports.empty.noReceivables') }}
                          columns={[
                            { title: t('reports.table.customer'), dataIndex: 'name', sorter: (first, second) => compareText(first.name, second.name) },
                            { title: t('reports.table.term'), dataIndex: 'paymentTermDays', sorter: (first, second) => compareNumber(first.paymentTermDays, second.paymentTermDays), render: (v) => t('reports.table.days', { count: v }) },
                            { title: t('reports.table.debt'), dataIndex: 'debtBalance', align: 'right', defaultSortOrder: 'descend', sorter: (first, second) => compareNumber(first.debtBalance, second.debtBalance), render: (value) => formatCurrency(value) },
                            { title: t('reports.table.creditLimit'), dataIndex: 'creditLimit', align: 'right', sorter: (first, second) => compareNumber(first.creditLimit, second.creditLimit), render: (value) => formatCurrency(value) },
                            {
                              title: t('reports.table.utilization'), width: 220,
                              sorter: (first, second) => {
                                const firstLimit = toNumber(first.creditLimit);
                                const secondLimit = toNumber(second.creditLimit);
                                const firstUsage = firstLimit > 0 ? toNumber(first.debtBalance) / firstLimit : 0;
                                const secondUsage = secondLimit > 0 ? toNumber(second.debtBalance) / secondLimit : 0;
                                return firstUsage - secondUsage;
                              },
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
                }] : []),
              ]}
              />
            ) : (
              <Card className="panel-card" title={t('reports.title')}>
                <StatStrip items={[
                  { icon: <DollarOutlined />, label: t('reports.metric.revenue'), value: formatCurrency(dashboardQuery.data.summary.revenueThisMonth), color: '#6366f1' },
                  { icon: <DollarOutlined />, label: t('reports.metric.receivables'), value: formatCurrency(dashboardQuery.data.summary.totalReceivable), color: '#f97316' },
                  { icon: <InboxOutlined />, label: t('reports.metric.trackedSkus'), value: dashboardQuery.data.summary.productCount, color: '#3b82f6' },
                  { icon: <WarningOutlined />, label: t('reports.metric.lowStock'), value: dashboardQuery.data.summary.lowStockItems, color: '#ef4444' },
                ]} />
              </Card>
            )}
          </div>
        ) : null}
      </QueryState>

      <Drawer
        title={selectedReportOrder ? t('reports.detail.title', { code: selectedReportOrder.code }) : t('reports.detail.fallbackTitle')}
        width={560}
        open={Boolean(selectedReportOrder)}
        onClose={() => setSelectedReportOrder(null)}
      >
        {selectedReportOrder ? (
          <div className={styles.reportOrderDetail}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t('reports.table.customer')}>
                {selectedReportOrder.customerName ?? '--'}
              </Descriptions.Item>
              <Descriptions.Item label={t('reports.table.reportDate')}>
                {formatDateTime(selectedReportOrder.reportDate)}
              </Descriptions.Item>
              <Descriptions.Item label={t('reports.table.created')}>
                {formatDateTime(selectedReportOrder.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label={t('reports.table.status')}>
                <SalesOrderStatusTag status={selectedReportOrder.status} />
              </Descriptions.Item>
              <Descriptions.Item label={t('reports.table.orderTotal')}>
                {formatCurrency(selectedReportOrder.totalAmount)}
              </Descriptions.Item>
              <Descriptions.Item label={t('reports.table.collected')}>
                {selectedReportOrder.receivableRecognized
                  ? formatCurrency(selectedReportOrder.collectedAmount)
                  : t('reports.value.notApplicable')}
              </Descriptions.Item>
              <Descriptions.Item label={t('reports.table.remainingDebt')}>
                {selectedReportOrder.receivableRecognized
                  ? formatCurrency(selectedReportOrder.remainingReceivable)
                  : t('reports.value.notRecognized')}
              </Descriptions.Item>
              <Descriptions.Item label={t('reports.table.collectionProgress')}>
                <div className={styles.collectionProgressDetail}>
                  {selectedReportOrder.receivableRecognized && selectedReportOrder.collectionProgress !== null ? (
                    <Progress percent={selectedReportOrder.collectionProgress} />
                  ) : (
                    <Typography.Text type="secondary">
                      {selectedReportOrder.status === 'CANCELLED'
                        ? t('reports.detail.receivableCancelled')
                        : t('reports.detail.receivableNotRecognized')}
                    </Typography.Text>
                  )}
                </div>
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
