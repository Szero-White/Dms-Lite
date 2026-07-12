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
  Space,
  Tag,
  Typography,
} from 'antd';

import {
  DashboardOrderStatusChart,
  DashboardRevenueChart,
} from '../../components/charts';

import { PageHeader } from '../../components/common/PageHeader';
import { QueryState } from '../../components/common/QueryState';
import { SummaryCard } from '../../components/common/SummaryCard/SummaryCard';

import {
  useDashboardData,
  useSalesOrders,
} from '../../hooks/useAppQueries';

import {
  formatCurrency,
  formatNumber,
  toNumber,
} from '../../lib/format';

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
    <Space
      direction="vertical"
      size={28}
      style={{ width: '100%' }}
    >
      <PageHeader
        title="Business Dashboard"
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
            {/* =================================================
                KPI CARDS
                ================================================= */}
            <div className="metrics-grid">
              <SummaryCard
                title="Revenue Today"
                value={formatCurrency(
                  dashboardQuery.data.summary.revenueToday,
                )}
                note="Sales confirmed today"
                icon={<DollarOutlined />}
                variant="blue"
              />

              <SummaryCard
                title="Revenue This Month"
                value={formatCurrency(
                  dashboardQuery.data.summary
                    .revenueThisMonth,
                )}
                note="Month-to-date recognized revenue"
                icon={<ShoppingCartOutlined />}
                variant="green"
              />

              <SummaryCard
                title="Receivable Debt"
                value={formatCurrency(
                  dashboardQuery.data.summary
                    .totalReceivable,
                )}
                note="Outstanding customer receivables"
                icon={<WalletOutlined />}
                variant="orange"
              />

              <SummaryCard
                title="Payable Debt"
                value={formatCurrency(
                  dashboardQuery.data.summary.payableDebt,
                )}
                note="Estimated supplier obligations"
                icon={<InboxOutlined />}
                variant="purple"
              />

              <SummaryCard
                title="Low Stock Items"
                value={formatNumber(
                  dashboardQuery.data.summary
                    .lowStockItems,
                )}
                note="Products requiring replenishment"
                icon={<WarningOutlined />}
                progress={Math.min(
                  100,
                  toNumber(
                    dashboardQuery.data.summary
                      .lowStockItems,
                  ) * 20,
                )}
                variant="red"
              />

              <SummaryCard
                title="Tracked Products"
                value={formatNumber(
                  dashboardQuery.data.summary.productCount,
                )}
                note="Active SKUs in catalog"
                icon={<ShoppingCartOutlined />}
                variant="blue"
              />
            </div>

            {/* =================================================
                CHARTS
                ================================================= */}
            <div className="dashboard-chart-grid">
              <DashboardRevenueChart
                orders={ordersQuery.data ?? []}
              />

              <DashboardOrderStatusChart
                orders={ordersQuery.data ?? []}
              />
            </div>

            {/* =================================================
                RANKING PANELS
                ================================================= */}
            <div className="dashboard-insight-grid">
              <Card
                title="Top Customers by Debt"
                className="panel-card dashboard-panel"
              >
                {dashboardQuery.data.topCustomersByDebt
                  .length ? (
                  <List
                    dataSource={
                      dashboardQuery.data
                        .topCustomersByDebt
                    }
                    renderItem={(item, index) => (
                      <List.Item>
                        <div className="dashboard-list-row">
                          <div className="dashboard-rank">
                            {index + 1}
                          </div>

                          <div className="dashboard-list-content">
                            <Typography.Text strong>
                              {item.customerName}
                            </Typography.Text>

                            <Typography.Text type="secondary">
                              Outstanding receivable
                            </Typography.Text>
                          </div>

                          <Typography.Text
                            strong
                            className="dashboard-amount"
                          >
                            {formatCurrency(
                              item.debtBalance,
                            )}
                          </Typography.Text>
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <div className="panel-empty">
                    <Empty
                      image={
                        Empty.PRESENTED_IMAGE_SIMPLE
                      }
                      description="No customer debt yet"
                    />
                  </div>
                )}
              </Card>

              <Card
                title="Top Selling Products"
                className="panel-card dashboard-panel"
              >
                {dashboardQuery.data.topSellingProducts
                  .length ? (
                  <List
                    dataSource={
                      dashboardQuery.data
                        .topSellingProducts
                    }
                    renderItem={(item, index) => (
                      <List.Item>
                        <div className="dashboard-list-row">
                          <div className="dashboard-rank">
                            {index + 1}
                          </div>

                          <div className="dashboard-list-content">
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
                      image={
                        Empty.PRESENTED_IMAGE_SIMPLE
                      }
                      description="No completed sales yet"
                    />
                  </div>
                )}
              </Card>
            </div>

            {/* =================================================
                OPERATIONAL ALERTS
                Thay cho Business Health bị lặp số liệu
                ================================================= */}
            <Card
              title="Operational Alerts"
              className="panel-card"
            >
              <div className="operational-alert-grid">
                <div className="operational-alert-item">
                  <div className="operational-alert-icon operational-alert-icon-warning">
                    <WalletOutlined />
                  </div>

                  <div className="operational-alert-content">
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

                <div className="operational-alert-item">
                  <div className="operational-alert-icon operational-alert-icon-danger">
                    <WarningOutlined />
                  </div>

                  <div className="operational-alert-content">
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
                      dashboardQuery.data.summary
                        .lowStockItems,
                    ) > 0
                      ? 'Action needed'
                      : 'Healthy'}
                  </Tag>
                </div>

                <div className="operational-alert-item">
                  <div className="operational-alert-icon">
                    <ShoppingCartOutlined />
                  </div>

                  <div className="operational-alert-content">
                    <Typography.Text type="secondary">
                      Product coverage
                    </Typography.Text>

                    <Typography.Title level={4}>
                      {formatNumber(
                        dashboardQuery.data.summary
                          .productCount,
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
    </Space>
  );
}