import { Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { useAuth } from '../../../auth';
import { useCustomers } from '../../../customers';
import { useProducts } from '../../../products';
import { useSalesOrders } from '../../../sales';
import { DashboardOrderStatusChart, DashboardRevenueChart } from '../../components';
import { useDashboardData } from '../../hooks/useDashboardQueries';
import { DashboardAttentionSection } from './components/DashboardAttentionSection';
import { DashboardCommercialSection } from './components/DashboardCommercialSection';
import { DashboardHeaderActions } from './components/DashboardHeaderActions';
import { DashboardPerformanceSection } from './components/DashboardPerformanceSection';
import { DashboardWelcomePanel } from './components/DashboardWelcomePanel';
import { useDashboardPageData } from './hooks/useDashboardPageData';
import type { DashboardRange } from './dashboardPage.types';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dashboardQuery = useDashboardData();
  const ordersQuery = useSalesOrders();
  const customersQuery = useCustomers();
  const productsQuery = useProducts();
  const [range, setRange] = useState<DashboardRange>('7_DAYS');
  const [refreshing, setRefreshing] = useState(false);

  const orders = ordersQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const {
    activeCustomers,
    attentionOrders,
    buildExportCsv,
    buildExportFilename,
    confirmedOrders,
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
    ordersQuery.isLoading ||
    customersQuery.isLoading ||
    productsQuery.isLoading;
  const isError =
    dashboardQuery.isError ||
    ordersQuery.isError ||
    customersQuery.isError ||
    productsQuery.isError;
  const error =
    dashboardQuery.error ||
    ordersQuery.error ||
    customersQuery.error ||
    productsQuery.error;

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await Promise.all([
        dashboardQuery.refetch(),
        ordersQuery.refetch(),
        customersQuery.refetch(),
        productsQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  function handleExport() {
    const csv = buildExportCsv();
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    );
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = buildExportFilename();
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.dashboardPage}>
      <PageHeader
        title="Business Overview"
        subtitle="Monitor sales, inventory health and receivables from one operational workspace."
        extra={
          <DashboardHeaderActions
            canExport={filteredOrders.length > 0}
            onExport={handleExport}
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
              confirmedOrders={confirmedOrders}
              dashboard={dashboardQuery.data}
              filteredOrders={filteredOrders}
              lowStockProducts={lowStockProducts}
              products={products}
              range={range}
            />

            <section className={styles.section}>
              <div className={styles.sectionHeading}>
                <div>
                  <Typography.Title level={3}>Sales analytics</Typography.Title>
                  <Typography.Text type="secondary">
                    Revenue and order mix for the selected range
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
