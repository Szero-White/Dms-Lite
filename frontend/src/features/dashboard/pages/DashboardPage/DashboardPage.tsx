import {
  DollarOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  Card,
  Empty,
  List,
  Tag,
  Typography,
} from 'antd';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { SummaryCard } from '../../../../components/common/SummaryCard/SummaryCard';
import {
  formatCurrency,
  formatNumber,
  toNumber,
} from '../../../../lib/format';
import { useSalesOrders } from '../../../sales';
import {
  DashboardOrderStatusChart,
  DashboardRevenueChart,
} from '../../components';
import { useDashboardData } from '../../hooks/useDashboardQueries';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const dashboardQuery = useDashboardData();
  const ordersQuery = useSalesOrders();

  const isLoading =
    dashboardQuery.isLoading ||
    ordersQuery.isLoading;

  const isError =
    dashboardQuery.isError ||
    ordersQuery.isError;

  const error =
    dashboardQuery.error ||
    ordersQuery.error;

  return (
    <div className={styles.dashboardPage}>
      <PageHeader
        title="Dashboard"
        subtitle="Daily operating snapshot for sales, stock health, and receivable exposure."
      />

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        hasData={Boolean(dashboardQuery.data)}
      >
        {dashboardQuery.data ? (
          <>
            <div className="metrics-grid">
              <SummaryCard
                title="Revenue Today"
                value={formatCurrency(
                  dashboardQuery.data.summary.revenueToday,
                )}
                note="Sales confirmed today"
                icon={<DollarOutlined />}
                variant="blue"
                visual="dashboard"
              />

              <SummaryCard
                title="Revenue This Month"
                value={formatCurrency(
                  dashboardQuery.data.summary.revenueThisMonth,
                )}
                note="Month-to-date recognized revenue"
                icon={<ShoppingCartOutlined />}
                variant="green"
                visual="dashboard"
              />

              <SummaryCard
                title="Receivable Debt"
                value={formatCurrency(
                  dashboardQuery.data.summary.totalReceivable,
                )}
                note="Outstanding customer receivables"
                icon={<WalletOutlined />}
                variant="orange"
                visual="dashboard"
              />

              <SummaryCard
                title="Payable Debt"
                value={formatCurrency(
                  dashboardQuery.data.summary.payableDebt,
                )}
                note="Estimated supplier obligations"
                icon={<InboxOutlined />}
                variant="purple"
                visual="dashboard"
              />

              <SummaryCard
                title="Low Stock Items"
                value={formatNumber(
                  dashboardQuery.data.summary.lowStockItems,
                )}
                note="Products requiring replenishment"
                icon={<WarningOutlined />}
                variant="red"
                visual="dashboard"
              />

              <SummaryCard
                title="Tracked Products"
                value={formatNumber(
                  dashboardQuery.data.summary.productCount,
                )}
                note="Active SKUs in catalog"
                icon={<ShoppingCartOutlined />}
                variant="cyan"
                visual="dashboard"
              />
            </div>

            <div className={styles.chartGrid}>
              <DashboardRevenueChart
                orders={ordersQuery.data ?? []}
              />

              <DashboardOrderStatusChart
                orders={ordersQuery.data ?? []}
              />
            </div>

            <div className={styles.insightGrid}>
              <Card
                title="Top Customers by Debt"
                className={`panel-card ${styles.panel}`}
              >
                {dashboardQuery.data.topCustomersByDebt.length ? (
                  <List
                    dataSource={
                      dashboardQuery.data.topCustomersByDebt
                    }
                    renderItem={(item, index) => (
                      <List.Item>
                        <div className={styles.listRow}>
                          <div className={styles.rank}>
                            {index + 1}
                          </div>

                          <div className={styles.listContent}>
                            <Typography.Text strong>
                              {item.customerName}
                            </Typography.Text>

                            <Typography.Text type="secondary">
                              Outstanding receivable
                            </Typography.Text>
                          </div>

                          <Typography.Text
                            strong
                            className={styles.amount}
                          >
                            {formatCurrency(item.debtBalance)}
                          </Typography.Text>
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <div className="panel-empty">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No customer debt yet"
                    />
                  </div>
                )}
              </Card>

              <Card
                title="Top Selling Products"
                className={`panel-card ${styles.panel}`}
              >
                {dashboardQuery.data.topSellingProducts.length ? (
                  <List
                    dataSource={
                      dashboardQuery.data.topSellingProducts
                    }
                    renderItem={(item, index) => (
                      <List.Item>
                        <div className={styles.listRow}>
                          <div className={styles.rank}>
                            {index + 1}
                          </div>

                          <div className={styles.listContent}>
                            <Typography.Text strong>
                              {item.productName}
                            </Typography.Text>

                            <Typography.Text type="secondary">
                              {item.totalQuantity} units sold
                            </Typography.Text>
                          </div>

                          <Typography.Text strong>
                            {formatCurrency(item.revenue)}
                          </Typography.Text>
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <div className="panel-empty">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No completed sales yet"
                    />
                  </div>
                )}
              </Card>
            </div>

            <Card
              title="Operational Alerts"
              className="panel-card"
            >
              <div className={styles.alertGrid}>
                <div className={styles.alertItem}>
                  <div
                    className={`${styles.alertIcon} ${styles.alertIconWarning}`}
                  >
                    <WalletOutlined />
                  </div>

                  <div className={styles.alertContent}>
                    <Typography.Text type="secondary">
                      Receivable exposure
                    </Typography.Text>

                    <Typography.Title level={4}>
                      {formatCurrency(
                        dashboardQuery.data.summary
                          .totalReceivable,
                      )}
                    </Typography.Title>
                  </div>

                  <Tag color="orange">Monitor</Tag>
                </div>

                <div className={styles.alertItem}>
                  <div
                    className={`${styles.alertIcon} ${styles.alertIconDanger}`}
                  >
                    <WarningOutlined />
                  </div>

                  <div className={styles.alertContent}>
                    <Typography.Text type="secondary">
                      Inventory health
                    </Typography.Text>

                    <Typography.Title level={4}>
                      {formatNumber(
                        dashboardQuery.data.summary
                          .lowStockItems,
                      )}{' '}
                      low-stock SKUs
                    </Typography.Title>
                  </div>

                  <Tag
                    color={
                      toNumber(
                        dashboardQuery.data.summary
                          .lowStockItems,
                      ) > 0
                        ? 'red'
                        : 'green'
                    }
                  >
                    {toNumber(
                      dashboardQuery.data.summary.lowStockItems,
                    ) > 0
                      ? 'Action needed'
                      : 'Healthy'}
                  </Tag>
                </div>

                <div className={styles.alertItem}>
                  <div className={styles.alertIcon}>
                    <ShoppingCartOutlined />
                  </div>

                  <div className={styles.alertContent}>
                    <Typography.Text type="secondary">
                      Product coverage
                    </Typography.Text>

                    <Typography.Title level={4}>
                      {formatNumber(
                        dashboardQuery.data.summary.productCount,
                      )}{' '}
                      active products
                    </Typography.Title>
                  </div>

                  <Tag color="blue">Tracked</Tag>
                </div>
              </div>
            </Card>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
