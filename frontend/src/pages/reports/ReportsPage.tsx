import { Card, Empty, Space, Table, Typography } from 'antd';
import { PageHeader } from '../../components/common/PageHeader';
import { QueryState } from '../../components/common/QueryState';
import { SummaryCard } from '../../components/common/SummaryCard';
import { useCustomers } from '../../features/customers';
import { useProducts } from '../../features/products';
import {
  useDashboardData,
  useSalesOrders,
} from '../../hooks/useAppQueries';
import { formatCurrency, toNumber } from '../../lib/format';
import {
  InventoryStockChart,
  OrderStatusChart,
  RevenueByOrderChart,
} from './components';
import styles from './ReportsPage.module.css';

export function ReportsPage() {
  const dashboardQuery = useDashboardData();
  const customersQuery = useCustomers();
  const productsQuery = useProducts();
  const ordersQuery = useSalesOrders();

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title="Reports"
        subtitle="Revenue, receivable, and inventory reporting in a SaaS-friendly layout."
      />

      <QueryState
        isLoading={
          dashboardQuery.isLoading ||
          customersQuery.isLoading ||
          productsQuery.isLoading ||
          ordersQuery.isLoading
        }
        isError={
          dashboardQuery.isError ||
          customersQuery.isError ||
          productsQuery.isError ||
          ordersQuery.isError
        }
        error={
          dashboardQuery.error ||
          customersQuery.error ||
          productsQuery.error ||
          ordersQuery.error
        }
        hasData={Boolean(dashboardQuery.data)}
      >
        {dashboardQuery.data ? (
          <>
            <div className={styles.sectionBlock}>
              <div className="metrics-grid metrics-grid-3">
                <div>
                  <SummaryCard
                    title="Revenue Report"
                    value={formatCurrency(dashboardQuery.data.summary.revenueThisMonth)}
                    note="Recognized revenue in current period"
                  />
                </div>
                <div>
                  <SummaryCard
                    title="Receivable Report"
                    value={formatCurrency(dashboardQuery.data.summary.totalReceivable)}
                    note="Open customer receivables to follow up"
                  />
                </div>
                <div>
                  <SummaryCard
                    title="Inventory Report"
                    value={`${productsQuery.data?.length || 0} SKUs`}
                    note="Tracked products in stock visibility"
                  />
                </div>
              </div>
            </div>

            <div className={styles.sectionBlock}>
              <div className={styles.chartGrid}>
                <RevenueByOrderChart orders={ordersQuery.data ?? []} />
                <OrderStatusChart orders={ordersQuery.data ?? []} />
              </div>
            </div>

            <div className={styles.sectionBlock}>
              <InventoryStockChart products={productsQuery.data ?? []} />
            </div>

            <div className={styles.sectionBlock}>
              <div className="insight-grid">
                <Card title="Revenue by Sales Order" className="panel-card compact-panel-card">
                  <Table
                    rowKey="id"
                    pagination={false}
                    size="small"
                    dataSource={ordersQuery.data ?? []}
                    columns={[
                      { title: 'Order', dataIndex: 'code' },
                      { title: 'Status', dataIndex: 'status' },
                      {
                        title: 'Revenue',
                        dataIndex: 'totalAmount',
                        render: (value) => formatCurrency(value),
                      },
                      {
                        title: 'Debt',
                        dataIndex: 'debtAmount',
                        render: (value) => formatCurrency(value),
                      },
                    ]}
                    locale={{
                      emptyText: (
                        <div className="panel-empty">
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No sales orders to report"
                          />
                        </div>
                      ),
                    }}
                  />
                </Card>
                <Card title="Receivable by Customer" className="panel-card compact-panel-card">
                  <Table
                    rowKey="id"
                    pagination={false}
                    size="small"
                    dataSource={[...(customersQuery.data ?? [])].sort(
                      (a, b) => toNumber(b.debtBalance) - toNumber(a.debtBalance),
                    )}
                    columns={[
                      { title: 'Customer', dataIndex: 'name' },
                      {
                        title: 'Debt',
                        dataIndex: 'debtBalance',
                        render: (value) => formatCurrency(value),
                      },
                      {
                        title: 'Credit Limit',
                        dataIndex: 'creditLimit',
                        render: (value) => formatCurrency(value),
                      },
                    ]}
                    locale={{ emptyText: 'No receivable data yet' }}
                  />
                </Card>
              </div>
            </div>

            <div className={styles.sectionBlock}>
              <Card title="Inventory Exposure" className="panel-card table-panel-card">
                <Table
                  rowKey="id"
                  size="small"
                  dataSource={productsQuery.data ?? []}
                  columns={[
                    { title: 'Product', dataIndex: 'name' },
                    { title: 'On Hand', dataIndex: 'stock' },
                    { title: 'Minimum Stock', dataIndex: 'minStock' },
                    {
                      title: 'Status',
                      render: (_, record) => (
                        <Typography.Text
                          style={{ color: record.isLowStock ? '#d46b08' : '#389e0d' }}
                        >
                          {record.isLowStock ? 'Low Stock' : 'Healthy'}
                        </Typography.Text>
                      ),
                    },
                  ]}
                  locale={{ emptyText: 'No inventory exposure data yet' }}
                />
              </Card>
            </div>
          </>
        ) : null}
      </QueryState>
    </Space>
  );
}
