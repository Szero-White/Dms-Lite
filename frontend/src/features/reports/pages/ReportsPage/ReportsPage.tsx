import {
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Progress,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { SummaryCard } from '../../../../components/common/SummaryCard';
import {
  ProductStatusTag,
  SalesOrderStatusTag,
} from '../../../../components/common/StatusTag';
import {
  formatCurrency,
  formatDateTime,
  toNumber,
} from '../../../../lib/format';
import { useCustomers } from '../../../customers';
import { useDashboardData } from '../../../dashboard';
import { useProducts } from '../../../products';
import { useSalesOrders } from '../../../sales';
import {
  InventoryStockChart,
  OrderStatusChart,
  RevenueByOrderChart,
} from '../../components';
import styles from './ReportsPage.module.css';

type ReportTab = 'sales' | 'inventory' | 'receivables';

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const content = rows
    .map((row) => row
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const dashboardQuery = useDashboardData();
  const customersQuery = useCustomers();
  const productsQuery = useProducts();
  const ordersQuery = useSalesOrders();
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [dateRange, setDateRange] = useState<[number, number] | null>(null);

  const customers = customersQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];
  const filteredOrders = useMemo(
    () => orders.filter((order) => {
      if (!dateRange) {
        return true;
      }

      const createdAt = new Date(order.createdAt).getTime();
      return createdAt >= dateRange[0] && createdAt <= dateRange[1];
    }),
    [dateRange, orders],
  );
  const recognizedOrders = filteredOrders.filter((order) => order.status !== 'CANCELLED');
  const salesRevenue = recognizedOrders.reduce(
    (total, order) => total + toNumber(order.totalAmount),
    0,
  );
  const averageOrderValue = recognizedOrders.length
    ? salesRevenue / recognizedOrders.length
    : 0;
  const inventoryValue = products.reduce(
    (total, product) => total + toNumber(product.costPrice) * toNumber(product.stock),
    0,
  );
  const totalUnits = products.reduce(
    (total, product) => total + toNumber(product.stock),
    0,
  );
  const totalReceivables = customers.reduce(
    (total, customer) => total + toNumber(customer.debtBalance),
    0,
  );
  const creditExposure = customers.reduce(
    (total, customer) => total + toNumber(customer.creditLimit),
    0,
  );
  const highRiskCustomers = customers.filter((customer) => {
    const limit = toNumber(customer.creditLimit);
    return limit > 0 && toNumber(customer.debtBalance) / limit >= 0.8;
  });

  function refreshReports() {
    void Promise.all([
      dashboardQuery.refetch(),
      customersQuery.refetch(),
      productsQuery.refetch(),
      ordersQuery.refetch(),
    ]);
  }

  function exportActiveReport() {
    if (activeTab === 'sales') {
      downloadCsv('dms-sales-report.csv', [
        ['Order', 'Created At', 'Status', 'Total', 'Paid', 'Debt'],
        ...filteredOrders.map((order) => [
          order.code,
          order.createdAt,
          order.status,
          toNumber(order.totalAmount),
          toNumber(order.paidAmount),
          toNumber(order.debtAmount),
        ]),
      ]);
      return;
    }

    if (activeTab === 'inventory') {
      downloadCsv('dms-inventory-report.csv', [
        ['SKU', 'Product', 'On Hand', 'Minimum', 'Cost Price', 'Status'],
        ...products.map((product) => [
          product.sku,
          product.name,
          product.stock,
          product.minStock,
          toNumber(product.costPrice),
          product.isLowStock ? 'LOW STOCK' : 'HEALTHY',
        ]),
      ]);
      return;
    }

    downloadCsv('dms-receivables-report.csv', [
      ['Customer', 'Phone', 'Debt Balance', 'Credit Limit', 'Payment Term Days'],
      ...customers.map((customer) => [
        customer.name,
        customer.phone ?? '',
        toNumber(customer.debtBalance),
        toNumber(customer.creditLimit),
        customer.paymentTermDays,
      ]),
    ]);
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Reports"
        subtitle="Analyze sales, inventory and receivable performance."
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
        emptyTitle="No report data available"
        emptyDescription="Operational reports will appear after business data is available."
        onRetry={refreshReports}
      >
        {dashboardQuery.data ? (
          <div className={styles.reportContent}>
            <Card className={`panel-card ${styles.toolbarCard}`}>
              <div className={styles.toolbar}>
                <div>
                  <Typography.Text strong>Reporting period</Typography.Text>
                  <Typography.Text type="secondary">
                    Date range applies to sales orders; inventory and receivables are current snapshots.
                  </Typography.Text>
                </div>
                <Space wrap>
                  <DatePicker.RangePicker
                    allowClear
                    onChange={(values) => {
                      if (!values?.[0] || !values[1]) {
                        setDateRange(null);
                        return;
                      }

                      setDateRange([
                        values[0].startOf('day').valueOf(),
                        values[1].endOf('day').valueOf(),
                      ]);
                    }}
                  />
                  <Button icon={<ReloadOutlined />} onClick={refreshReports}>Refresh</Button>
                  <Button type="primary" icon={<DownloadOutlined />} onClick={exportActiveReport}>
                    Export CSV
                  </Button>
                </Space>
              </div>
            </Card>

            <Tabs
              className={styles.reportTabs}
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as ReportTab)}
              items={[
                {
                  key: 'sales',
                  label: 'Sales',
                  children: (
                    <div className={styles.tabContent}>
                      <div className={styles.metricsGrid}>
                        <SummaryCard title="Revenue" value={formatCurrency(salesRevenue)} note="Non-cancelled sales orders in period" />
                        <SummaryCard title="Orders" value={filteredOrders.length} note="Sales orders created in period" />
                        <SummaryCard title="Average Order" value={formatCurrency(averageOrderValue)} note="Average value of non-cancelled orders" />
                        <SummaryCard title="Completed" value={filteredOrders.filter((order) => order.status === 'COMPLETED').length} note="Orders completed in selected period" />
                      </div>
                      <div className={styles.chartGrid}>
                        <RevenueByOrderChart orders={filteredOrders} />
                        <OrderStatusChart orders={filteredOrders} />
                      </div>
                      <Card title="Top Sales Orders" className="panel-card">
                        <Table
                          rowKey="id"
                          size="small"
                          sticky
                          scroll={{ x: 760 }}
                          dataSource={[...filteredOrders]
                            .sort((first, second) => toNumber(second.totalAmount) - toNumber(first.totalAmount))
                            .slice(0, 10)}
                          columns={[
                            { title: 'Order', dataIndex: 'code' },
                            { title: 'Created', dataIndex: 'createdAt', render: (value) => formatDateTime(value) },
                            { title: 'Status', dataIndex: 'status', render: (value) => <SalesOrderStatusTag status={value} /> },
                            { title: 'Revenue', dataIndex: 'totalAmount', align: 'right', render: (value) => formatCurrency(value) },
                            { title: 'Debt', dataIndex: 'debtAmount', align: 'right', render: (value) => formatCurrency(value) },
                          ]}
                          locale={{ emptyText: 'No sales orders in this reporting period' }}
                        />
                      </Card>
                    </div>
                  ),
                },
                {
                  key: 'inventory',
                  label: 'Inventory',
                  children: (
                    <div className={styles.tabContent}>
                      <div className={styles.metricsGrid}>
                        <SummaryCard title="Tracked SKUs" value={products.length} note="Products included in inventory visibility" />
                        <SummaryCard title="Total Units" value={totalUnits} note="Units currently on hand" />
                        <SummaryCard title="Inventory Value" value={formatCurrency(inventoryValue)} note="Estimated value at product cost" />
                        <SummaryCard title="Low Stock" value={products.filter((product) => product.isLowStock).length} note="Products at or below minimum stock" />
                      </div>
                      <InventoryStockChart products={products} />
                      <Card title="Inventory Exposure" className="panel-card">
                        <Table
                          rowKey="id"
                          size="small"
                          sticky
                          scroll={{ x: 820 }}
                          dataSource={products}
                          columns={[
                            { title: 'SKU', dataIndex: 'sku' },
                            { title: 'Product', dataIndex: 'name' },
                            { title: 'On Hand', dataIndex: 'stock', align: 'right' },
                            { title: 'Minimum', dataIndex: 'minStock', align: 'right' },
                            { title: 'Cost Value', align: 'right', render: (_, record) => formatCurrency(toNumber(record.costPrice) * toNumber(record.stock)) },
                            { title: 'Status', render: (_, record) => <ProductStatusTag active={record.active} isLowStock={record.isLowStock} /> },
                          ]}
                          locale={{ emptyText: 'No inventory exposure data yet' }}
                        />
                      </Card>
                    </div>
                  ),
                },
                {
                  key: 'receivables',
                  label: 'Receivables',
                  children: (
                    <div className={styles.tabContent}>
                      <div className={styles.metricsGrid}>
                        <SummaryCard title="Receivables" value={formatCurrency(totalReceivables)} note="Total outstanding customer debt" />
                        <SummaryCard title="Debtor Accounts" value={customers.filter((customer) => toNumber(customer.debtBalance) > 0).length} note="Customers with open balances" />
                        <SummaryCard title="Credit Exposure" value={formatCurrency(creditExposure)} note="Configured customer credit limits" />
                        <SummaryCard title="High Risk" value={highRiskCustomers.length} note="Customers using at least 80% of credit" />
                      </div>
                      <Card title="Receivable by Customer" className="panel-card">
                        <Table
                          rowKey="id"
                          size="small"
                          sticky
                          scroll={{ x: 900 }}
                          dataSource={[...customers].sort(
                            (first, second) => toNumber(second.debtBalance) - toNumber(first.debtBalance),
                          )}
                          columns={[
                            { title: 'Customer', dataIndex: 'name' },
                            { title: 'Payment Term', dataIndex: 'paymentTermDays', render: (value) => `${value} days` },
                            { title: 'Debt', dataIndex: 'debtBalance', align: 'right', render: (value) => formatCurrency(value) },
                            { title: 'Credit Limit', dataIndex: 'creditLimit', align: 'right', render: (value) => formatCurrency(value) },
                            {
                              title: 'Credit Utilization',
                              width: 220,
                              render: (_, record) => {
                                const limit = toNumber(record.creditLimit);
                                const percent = limit > 0
                                  ? Math.round((toNumber(record.debtBalance) / limit) * 100)
                                  : 0;

                                return (
                                  <div className={styles.creditUsage}>
                                    <Progress
                                      percent={Math.min(percent, 100)}
                                      showInfo={false}
                                      size="small"
                                      status={percent >= 100 ? 'exception' : percent >= 80 ? 'normal' : 'success'}
                                    />
                                    <Tag color={percent >= 100 ? 'error' : percent >= 80 ? 'warning' : 'success'}>
                                      {limit > 0 ? `${percent}%` : 'No limit'}
                                    </Tag>
                                  </div>
                                );
                              },
                            },
                          ]}
                          locale={{ emptyText: 'No receivable data yet' }}
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
