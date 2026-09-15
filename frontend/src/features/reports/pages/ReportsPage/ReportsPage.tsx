import {
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
  Space,
  Tabs,
} from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { formatCurrency, toNumber } from '../../../../lib/format';
import { newestFirst } from '../../../../lib/tableSorting';
import { PERMISSIONS, canViewCustomerBalance, hasPermission, useAuth } from '../../../auth';
import { useCustomers, type Customer } from '../../../customers';
import { useDashboardData } from '../../../dashboard';
import { useProducts, type ProductRow } from '../../../products';
import { useSalesReport } from '../../hooks/useSalesReportQueries';
import type { SalesReportOrder } from '../../types/salesReport.types';
import type { SalesOrderStatus } from '../../../sales';
import { InventoryReportTab } from './components/InventoryReportTab';
import { ReceivablesReportTab } from './components/ReceivablesReportTab';
import { ReportStatStrip } from './components/ReportStatStrip';
import { SalesReportTab, type CollectionFilter } from './components/SalesReportTab';
import { SalesReportOrderDrawer } from './components/SalesReportOrderDrawer';
import { exportReport, type ReportExportFormat, type ReportTab } from './reportsExport';
import styles from './ReportsPage.module.css';



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
  const [salesStatuses, setSalesStatuses] = useState<SalesOrderStatus[]>([]);
  const [salesCustomers, setSalesCustomers] = useState<number[]>([]);
  const [collectionFilters, setCollectionFilters] = useState<CollectionFilter[]>([]);
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

  const customers = canViewReceivables ? newestFirst<Customer>(customersQuery.data ?? []) : [];
  const products = canViewInventoryProducts ? newestFirst<ProductRow>(productsQuery.data ?? []) : [];
  const reportOrders = canViewOrders ? newestFirst<SalesReportOrder>(salesReportQuery.data?.orders ?? []) : [];
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
    return newestFirst(reportOrders.filter((order) => {
      const matchesKeyword = !keyword
        || order.code.toLowerCase().includes(keyword)
        || (order.customerName ?? '').toLowerCase().includes(keyword);
      const matchesStatus = salesStatuses.length === 0 || salesStatuses.includes(order.status);
      const matchesCustomer = salesCustomers.length === 0 || salesCustomers.includes(order.customerId);
      const matchesCollection = collectionFilters.length === 0 || (
        order.receivableRecognized && (
          (collectionFilters.includes('UNPAID') && toNumber(order.collectedAmount) <= 0 && toNumber(order.remainingReceivable) > 0) ||
          (collectionFilters.includes('PARTIAL') && toNumber(order.collectedAmount) > 0 && toNumber(order.remainingReceivable) > 0) ||
          (collectionFilters.includes('PAID') && toNumber(order.remainingReceivable) <= 0)
        )
      );
      return matchesKeyword && matchesStatus && matchesCustomer && matchesCollection;
    }));
  }, [collectionFilters, reportOrders, salesCustomers, salesKeyword, salesStatuses]);
  const hasSalesTableFilters = Boolean(
    salesKeyword || salesStatuses.length > 0 || salesCustomers.length > 0 || collectionFilters.length > 0
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
                    <SalesReportTab
                      averageOrderValue={averageOrderValue}
                      collectionFilters={collectionFilters}
                      completedCount={completedCount}
                      filteredOrders={filteredReportOrders}
                      hasFilters={hasSalesTableFilters}
                      onSelectOrder={setSelectedReportOrder}
                      reportCustomers={reportCustomers}
                      reportOrders={reportOrders}
                      salesCustomers={salesCustomers}
                      salesKeyword={salesKeyword}
                      salesOrderCount={salesOrderCount}
                      salesRevenue={salesRevenue}
                      salesStatuses={salesStatuses}
                      setCollectionFilters={setCollectionFilters}
                      setSalesCustomers={setSalesCustomers}
                      setSalesKeyword={setSalesKeyword}
                      setSalesStatuses={setSalesStatuses}
                    />
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
                    <InventoryReportTab
                      inventoryValue={inventoryValue}
                      lowStockCount={lowStockCount}
                      products={products}
                      totalUnits={totalUnits}
                    />
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
                    <ReceivablesReportTab
                      creditExposure={creditExposure}
                      customers={customers}
                      debtorCount={debtorCount}
                      highRiskCount={highRiskCustomers.length}
                      totalReceivables={totalReceivables}
                    />
                  ),
                }] : []),
              ]}
              />
            ) : (
              <Card className="panel-card" title={t('reports.title')}>
                <ReportStatStrip items={[
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

      <SalesReportOrderDrawer
        onClose={() => setSelectedReportOrder(null)}
        order={selectedReportOrder}
      />
    </div>
  );
}
