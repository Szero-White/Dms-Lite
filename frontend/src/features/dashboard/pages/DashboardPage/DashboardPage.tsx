import { Typography } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { downloadCsvContent } from '../../../../lib/csvExport';
import { downloadXlsx } from '../../../../lib/xlsxExport';
import { QueryState } from '../../../../components/common/QueryState';
import { PERMISSIONS, hasPermission, useAuth } from '../../../auth';
import { useCustomers } from '../../../customers';
import { useProducts } from '../../../products';
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
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canViewCustomers = hasPermission(user, PERMISSIONS.CUSTOMER_VIEW);
  const canViewOrders = hasPermission(user, PERMISSIONS.SALES_ORDER_VIEW);
  const canViewInventoryProducts = hasPermission(user, PERMISSIONS.PRODUCT_VIEW) && hasPermission(user, PERMISSIONS.INVENTORY_VIEW);
  const dashboardQuery = useDashboardData();
  const ordersQuery = useSalesOrders({ enabled: canViewOrders });
  const customersQuery = useCustomers({ enabled: canViewCustomers });
  const productsQuery = useProducts({ enabled: canViewInventoryProducts });
  const [range, setRange] = useState<DashboardRange>('7_DAYS');
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const orders = canViewOrders ? ordersQuery.data ?? [] : [];
  const customers = canViewCustomers ? customersQuery.data ?? [] : [];
  const products = canViewInventoryProducts ? productsQuery.data ?? [] : [];
  const {
    activeCustomers,
    attentionOrders,
    completedOrders,
    customersMap,
    filteredOrders,
    healthyProducts,
    latestOrder,
    lowStockProducts,
    outOfStockProducts,
    rangeDays,
    recentOrders,
  } = useDashboardPageData({
    customers,
    orders,
    products,
    range,
  });

  const isLoading =
    dashboardQuery.isLoading ||
    (canViewOrders && ordersQuery.isLoading) ||
    (canViewCustomers && customersQuery.isLoading) ||
    (canViewInventoryProducts && productsQuery.isLoading);
  const isError =
    dashboardQuery.isError ||
    (canViewOrders && ordersQuery.isError) ||
    (canViewCustomers && customersQuery.isError) ||
    (canViewInventoryProducts && productsQuery.isError);
  const error =
    dashboardQuery.error ||
    (canViewOrders && ordersQuery.error) ||
    (canViewCustomers && customersQuery.error) ||
    (canViewInventoryProducts && productsQuery.error);

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await Promise.all([
        dashboardQuery.refetch(),
        canViewOrders ? ordersQuery.refetch() : Promise.resolve(),
        canViewCustomers ? customersQuery.refetch() : Promise.resolve(),
        canViewInventoryProducts ? productsQuery.refetch() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleExport(format: 'csv' | 'xlsx') {
    if (format === 'csv') {
      downloadCsvContent(buildDashboardExportFilename(range, 'csv'), buildDashboardExportCsv({ customersMap, filteredOrders, range, t }));
      return;
    }

    setExporting(true);
    try {
      await downloadXlsx(buildDashboardExportFilename(range, 'xlsx'), [buildDashboardExportSheet({ customersMap, filteredOrders, range, t })]);
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
            canExport={filteredOrders.length > 0}
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
              onAddCustomer={() => navigate('/customers')}
              onCreateOrder={() => navigate('/sales-orders/new')}
              onReceiveStock={() => navigate('/inventory')}
              onRecordPayment={() => navigate('/payments')}
              userDisplayName={user?.fullName || user?.username || 'team'}
            />

            <DashboardPerformanceSection
              activeCustomers={activeCustomers}
              completedOrders={completedOrders}
              dashboard={dashboardQuery.data}
              filteredOrders={filteredOrders}
              lowStockProducts={lowStockProducts}
              products={products}
              range={range}
            />

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
                <DashboardRevenueChart orders={filteredOrders} rangeDays={rangeDays} />
                <DashboardOrderStatusChart orders={filteredOrders} />
              </div>
            </section>

            <DashboardCommercialSection dashboard={dashboardQuery.data} />

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
            />
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
