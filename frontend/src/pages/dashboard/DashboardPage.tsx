import { Card, Empty, List, Progress, Space, Table, Typography } from 'antd';
import { PageHeader } from '../../components/common/PageHeader';
import { QueryState } from '../../components/common/QueryState';
import { SummaryCard } from '../../components/common/SummaryCard';
import { useDashboardData } from '../../hooks/useAppQueries';
import { formatCurrency, formatNumber, toNumber } from '../../lib/format';

export function DashboardPage() {
  const dashboardQuery = useDashboardData();

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title="Business Dashboard"
        subtitle="Daily operating snapshot for sales, stock health, and receivable exposure."
      />

      <QueryState isLoading={dashboardQuery.isLoading} isError={dashboardQuery.isError} error={dashboardQuery.error} hasData={Boolean(dashboardQuery.data)}>
        {dashboardQuery.data ? (
          <>
            <div className="section-block">
              <div className="metrics-grid">
                <div>
                  <SummaryCard title="Revenue Today" value={formatCurrency(dashboardQuery.data.summary.revenueToday)} note="Sales confirmed today" />
                </div>
                <div>
                  <SummaryCard title="Revenue This Month" value={formatCurrency(dashboardQuery.data.summary.revenueThisMonth)} note="Month-to-date recognized revenue" />
                </div>
                <div>
                  <SummaryCard title="Receivable Debt" value={formatCurrency(dashboardQuery.data.summary.totalReceivable)} note="Outstanding customer receivables" />
                </div>
                <div>
                  <SummaryCard title="Payable Debt" value={formatCurrency(dashboardQuery.data.summary.payableDebt)} note="Temporary mock metric, ready for AP API later" />
                </div>
                <div>
                  <SummaryCard title="Low Stock Items" value={formatNumber(dashboardQuery.data.summary.lowStockItems)} note="Products at or below minimum stock" />
                </div>
                <div>
                  <SummaryCard title="Tracked Products" value={formatNumber(dashboardQuery.data.summary.productCount)} note="Active SKUs in catalog" />
                </div>
              </div>
            </div>

            <div className="section-block">
              <div className="insight-grid">
                <Card title="Top Customers by Debt" className="panel-card compact-panel-card">
                  {dashboardQuery.data.topCustomersByDebt.length ? (
                    <List
                      dataSource={dashboardQuery.data.topCustomersByDebt}
                      renderItem={(item, index) => (
                        <List.Item>
                          <div style={{ width: '100%' }}>
                            <div className="flex-between">
                              <Space direction="vertical" size={2}>
                                <Typography.Text strong>{item.customerName}</Typography.Text>
                                <Typography.Text type="secondary">Rank #{index + 1}</Typography.Text>
                              </Space>
                              <Typography.Text strong>{formatCurrency(item.debtBalance)}</Typography.Text>
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div className="panel-empty">
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No customer debt yet" />
                    </div>
                  )}
                </Card>
                <Card title="Top Selling Products" className="panel-card compact-panel-card">
                  {dashboardQuery.data.topSellingProducts.length ? (
                    <List
                      dataSource={dashboardQuery.data.topSellingProducts}
                      renderItem={(item) => (
                        <List.Item>
                          <div style={{ width: '100%' }}>
                            <Space direction="vertical" size={6} style={{ width: '100%' }}>
                              <div className="flex-between">
                                <Typography.Text strong>{item.productName}</Typography.Text>
                                <Typography.Text>{item.totalQuantity} units</Typography.Text>
                              </div>
                              <Progress percent={Math.min(100, Math.round((item.totalQuantity / Math.max(1, dashboardQuery.data.topSellingProducts[0]?.totalQuantity || 1)) * 100))} showInfo={false} strokeColor="#1f6feb" />
                              <Typography.Text type="secondary">{formatCurrency(item.revenue)}</Typography.Text>
                            </Space>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div className="panel-empty">
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No completed sales yet" />
                    </div>
                  )}
                </Card>
              </div>
            </div>

            <div className="section-block">
              <Card title="Working Capital Signals" className="panel-card table-panel-card">
                <Table
                  pagination={false}
                  size="small"
                  rowKey="label"
                  dataSource={[
                    { label: 'Receivable debt coverage', value: formatCurrency(dashboardQuery.data.summary.totalReceivable), status: 'Monitor collection plan' },
                    { label: 'Payable debt estimate', value: formatCurrency(dashboardQuery.data.summary.payableDebt), status: 'Temporary mock until payables API exists' },
                    { label: 'Low stock exposure', value: `${toNumber(dashboardQuery.data.summary.lowStockItems)} SKUs`, status: 'Replenish before next sales push' },
                  ]}
                  columns={[
                    { title: 'Metric', dataIndex: 'label' },
                    { title: 'Current', dataIndex: 'value' },
                    { title: 'Note', dataIndex: 'status' },
                  ]}
                  locale={{ emptyText: 'No working capital signals yet' }}
                />
              </Card>
            </div>
          </>
        ) : null}
      </QueryState>
    </Space>
  );
}
