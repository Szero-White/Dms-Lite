import { Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { downloadCsvContent } from '../../../../lib/csvExport';
import { downloadXlsx } from '../../../../lib/xlsxExport';
import { QueryState } from '../../../../components/common/QueryState';
import { PERMISSIONS, canAccessPath, hasPermission, useAuth } from '../../../auth';
import { useCustomers } from '../../../customers';
import { useProducts } from '../../../products';
import { useSalesReport } from '../../../reports/hooks/useSalesReportQueries';
import { useSalesOrders } from '../../../sales';
import { DashboardOrderStatusChart, DashboardRevenueChart } from '../../components';
import { useDashboardData } from '../../hooks/useDashboardQueries';
import { DashboardAttentionSection } from './components/DashboardAttentionSection';
import { DashboardCommercialSection } from './components/DashboardCommercialSection';
import { DashboardHeaderActions } from './components/DashboardHeaderActions';
import {
  buildDashboardExportCsv,
  buildDashboardExportFilename,
  buildDashboardExportSheet,
} from './dashboardExport';
import { DashboardPerformanceSection } from './components/DashboardPerformanceSection';
import { DashboardWelcomePanel } from './components/DashboardWelcomePanel';
import { useDashboardPageData } from './hooks/useDashboardPageData';
import type { DashboardRange } from './dashboardPage.types';
import { getRangeStart } from './dashboardPage.utils';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canViewCustomers = hasPermission(user, PERMISSIONS.CUSTOMER_VIEW);
  const canViewOrders = hasPermission(user, PERMISSIONS.SALES_ORDER_VIEW);
  const canViewInventoryProducts = hasPermission(user, PERMISSIONS.PRODUCT_VIEW) && hasPermission(user, PERMISSIONS.INVENTORY_VIEW);
  const canCreateOrder = hasPermission(user, PERMISSIONS.SALES_ORDER_CREATE)
    && canAccessPath(user, '/sales-orders/new');
  const canReceiveStock = hasPermission(user, PERMISSIONS.INVENTORY_MANAGE);
  const canRecordPayment = hasPermission(user, PERMISSIONS.PAYMENT_CREATE);
  const canManageCustomers = hasPermission(user, PERMISSIONS.CUSTOMER_MANAGE);
  const [range, setRange] = useState<DashboardRange>('7_DAYS');
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const salesReportRange = useMemo(() => ({
    from: getRangeStart(range).toISOString(),
  }), [range]);
  const dashboardQuery = useDashboardData();
  const ordersQuery = useSalesOrders({ enabled: canViewOrders });
  const salesReportQuery = useSalesReport({
    enabled: canViewOrders,
    ...salesReportRange,
  });
  const customersQuery = useCustomers({ enabled: canViewCustomers });
  const productsQuery = useProducts({ enabled: canViewInventoryProducts });

  const orders = canViewOrders ? ordersQuery.data ?? [] : [];
  const analyticsOrders = canViewOrders ? salesReportQuery.data?.orders ?? [] : [];
  const customers = canViewCustomers ? customersQuery.data ?? [] : [];
  const products = canViewInventoryProducts ? productsQuery.data ?? [] : [];
  const {
    activeCustomers,
    attentionOrders,
    customersMap,
    analyticsOrders: dashboardAnalyticsOrders,
    healthyProducts,
    latestOrder,
    lowStockProducts,
    outOfStockProducts,
    rangeDays,
    recentOrders,
  } = useDashboardPageData({
    analyticsOrders,
    customers,
    orders,
    products,
    range,
  });

  const isLoading =
    dashboardQuery.isLoading ||
    (canViewOrders && (ordersQuery.isLoading || salesReportQuery.isLoading)) ||
    (canViewCustomers && customersQuery.isLoading) ||
    (canViewInventoryProducts && productsQuery.isLoading);
  const isError =
    dashboardQuery.isError ||
    (canViewOrders && (ordersQuery.isError || salesReportQuery.isError)) ||
    (canViewCustomers && customersQuery.isError) ||
    (canViewInventoryProducts && productsQuery.isError);
  const error =
    dashboardQuery.error ||
    (canViewOrders && (ordersQuery.error || salesReportQuery.error)) ||
    (canViewCustomers && customersQuery.error) ||
    (canViewInventoryProducts && productsQuery.error);

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await Promise.all([
        dashboardQuery.refetch(),
        canViewOrders ? ordersQuery.refetch() : Promise.resolve(),
        canViewOrders ? salesReportQuery.refetch() : Promise.resolve(),
        canViewCustomers ? customersQuery.refetch() : Promise.resolve(),
        canViewInventoryProducts ? productsQuery.refetch() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleExport(format: 'csv' | 'xlsx') {
    if (format === 'csv') {
      downloadCsvContent(buildDashboardExportFilename(range, 'csv'), buildDashboardExportCsv({ orders: dashboardAnalyticsOrders, range, t }));
      return;
    }

    setExporting(true);
    try {
      await downloadXlsx(buildDashboardExportFilename(range, 'xlsx'), [buildDashboardExportSheet({ orders: dashboardAnalyticsOrders, range, t })]);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className={styles.dashboardPage}>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        extra={
          <DashboardHeaderActions
            canExport={dashboardAnalyticsOrders.length > 0}
            exporting={exporting}
            onExport={(format) => {
              void handleExport(format);
            }}
            onRangeChange={setRange}
            onRefresh={() => {
              void handleRefresh();
            }}
            range={range}
            refreshing={refreshing}
          />
        }
      />

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        hasData={Boolean(dashboardQuery.data)}
        onRetry={() => {
          void handleRefresh();
        }}
      >
        {dashboardQuery.data ? (
          <>
            <DashboardWelcomePanel
              latestOrderCreatedAt={latestOrder?.createdAt}
              onAddCustomer={canManageCustomers ? () => navigate('/customers') : undefined}
              onCreateOrder={canCreateOrder ? () => navigate('/sales-orders/new') : undefined}
              onReceiveStock={canReceiveStock ? () => navigate('/inventory') : undefined}
              onRecordPayment={canRecordPayment ? () => navigate('/payments') : undefined}
              userDisplayName={user?.fullName || user?.username || 'team'}
            />

            <DashboardPerformanceSection
              activeCustomers={activeCustomers}
              canViewCustomers={canViewCustomers}
              canViewInventory={canViewInventoryProducts}
              canViewOrders={canViewOrders}
              dashboard={dashboardQuery.data}
              analyticsOrders={dashboardAnalyticsOrders}
              lowStockProducts={lowStockProducts}
              products={products}
              range={range}
            />

            {canViewOrders ? (
            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <div>
                  <Typography.Title level={3}>{t('dashboard.salesAnalytics.title')}</Typography.Title>
                  <Typography.Text type="secondary">
                    {t('dashboard.salesAnalytics.subtitle')}
                  </Typography.Text>
                </div>
              </div>
              <div className={styles.chartGrid}>
                <DashboardRevenueChart orders={dashboardAnalyticsOrders} rangeDays={rangeDays} />
                <DashboardOrderStatusChart orders={dashboardAnalyticsOrders} />
              </div>
            </section>
            ) : null}

            <DashboardCommercialSection dashboard={dashboardQuery.data} />

            {canViewInventoryProducts || canViewOrders ? (
              <DashboardAttentionSection
                attentionOrders={attentionOrders}
                customersMap={customersMap}
                healthyProducts={healthyProducts}
                lowStockProducts={lowStockProducts}
                onOpenInventory={() => navigate('/inventory')}
                onReviewOrders={() => navigate('/sales-orders')}
                onViewActivity={() => navigate('/sales-orders')}
                outOfStockProducts={outOfStockProducts}
                products={products}
                recentOrders={recentOrders}
                showInventory={canViewInventoryProducts}
                showOrders={canViewOrders}
              />
            ) : null}
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
