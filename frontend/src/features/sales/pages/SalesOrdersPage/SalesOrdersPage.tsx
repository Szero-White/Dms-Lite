import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  App,
  Avatar,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Dropdown,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { SummaryCard } from '../../../../components/common/SummaryCard';
import { SalesOrderStatusTag } from '../../../../components/common/StatusTag';
import { useCustomers } from '../../../customers';
import { useProducts } from '../../../products';
import {
  useCancelSalesOrder,
  useConfirmSalesOrder,
  useSalesOrders,
} from '../../hooks/useSalesQueries';
import {
  formatCurrency,
  formatDateTime,
  toNumber,
} from '../../../../lib/format';
import type { SalesOrder } from '../../types/sales.types';
import styles from './SalesOrdersPage.module.css';

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function SalesOrdersPage() {
  const { modal } = App.useApp();
  const navigate = useNavigate();
  const ordersQuery = useSalesOrders();
  const customersQuery = useCustomers();
  const productsQuery = useProducts();
  const confirmMutation = useConfirmSalesOrder();
  const cancelMutation = useCancelSalesOrder();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [customerFilter, setCustomerFilter] = useState<number | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [datePickerKey, setDatePickerKey] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  const customers = customersQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const customersMap = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );
  const productsMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const orders = ordersQuery.data ?? [];
  const filteredOrders = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return orders.filter((order) => {
      const customerName = customersMap.get(order.customerId)?.name ?? '';
      const matchesKeyword = !normalizedKeyword ||
        order.code.toLowerCase().includes(normalizedKeyword) ||
        customerName.toLowerCase().includes(normalizedKeyword);
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      const matchesCustomer = customerFilter === 'ALL' || order.customerId === customerFilter;
      const createdAt = new Date(order.createdAt).getTime();
      const matchesDate = !dateRange || (
        createdAt >= new Date(`${dateRange[0]}T00:00:00`).getTime() &&
        createdAt <= new Date(`${dateRange[1]}T23:59:59`).getTime()
      );

      return matchesKeyword && matchesStatus && matchesCustomer && matchesDate;
    });
  }, [customerFilter, customersMap, dateRange, keyword, orders, statusFilter]);
  const outstandingDebt = orders.reduce(
    (total, order) => total + toNumber(order.debtAmount),
    0,
  );
  const hasFilters = Boolean(
    keyword || statusFilter !== 'ALL' || customerFilter !== 'ALL' || dateRange,
  );

  function clearFilters() {
    setKeyword('');
    setStatusFilter('ALL');
    setCustomerFilter('ALL');
    setDateRange(null);
    setDatePickerKey((current) => current + 1);
  }

  function confirmOrder(order: SalesOrder) {
    modal.confirm({
      title: `Confirm ${order.code}?`,
      content: 'Confirming this order applies the existing inventory and receivable workflow.',
      okText: 'Confirm Order',
      onOk: () => confirmMutation.mutateAsync(order.id),
    });
  }

  function cancelOrder(order: SalesOrder) {
    modal.confirm({
      title: `Cancel ${order.code}?`,
      content: 'This action uses the existing cancellation workflow and cannot be undone here.',
      okText: 'Cancel Order',
      okButtonProps: { danger: true },
      onOk: () => cancelMutation.mutateAsync(order.id),
    });
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Sales Orders"
        subtitle="Track order progress, revenue and fulfillment."
        extra={(
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/sales-orders/new')}
          >
            Create Order
          </Button>
        )}
      />

      <div className={styles.metricsGrid}>
        <SummaryCard
          title="Total Orders"
          value={orders.length}
          note="All sales orders in the current dataset"
          icon={<ShoppingCartOutlined />}
          variant="blue"
          visual="dashboard"
        />
        <SummaryCard
          title="Draft Orders"
          value={orders.filter((order) => order.status === 'DRAFT').length}
          note="Orders awaiting confirmation or cancellation"
          icon={<ClockCircleOutlined />}
          variant="orange"
          visual="dashboard"
        />
        <SummaryCard
          title="Confirmed Orders"
          value={orders.filter((order) => order.status === 'CONFIRMED').length}
          note="Orders currently confirmed"
          icon={<CheckCircleOutlined />}
          variant="green"
          visual="dashboard"
        />
        <SummaryCard
          title="Outstanding Debt"
          value={formatCurrency(outstandingDebt)}
          note="Open debt across all orders"
          icon={<DollarOutlined />}
          variant="red"
          visual="dashboard"
        />
      </div>

      <Card className={`panel-card ${styles.tableCard}`}>
        <div className={styles.toolbar}>
          <div className={styles.filterControls}>
            <Input
              allowClear
              className={styles.search}
              prefix={<SearchOutlined />}
              placeholder="Search order code or customer"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <Select
              className={styles.filter}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: 'All statuses' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'CONFIRMED', label: 'Confirmed' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
            <Select
              showSearch
              optionFilterProp="label"
              className={styles.customerFilter}
              value={customerFilter}
              onChange={setCustomerFilter}
              options={[
                { value: 'ALL', label: 'All customers' },
                ...customers.map((customer) => ({
                  value: customer.id,
                  label: customer.name,
                })),
              ]}
            />
            <DatePicker.RangePicker
              key={datePickerKey}
              className={styles.dateFilter}
              format="YYYY-MM-DD"
              onChange={(dates, dateStrings) =>
                setDateRange(dates ? [dateStrings[0], dateStrings[1]] : null)
              }
            />
          </div>
          <Button disabled={!hasFilters} onClick={clearFilters}>Clear filters</Button>
        </div>

        {hasFilters ? (
          <div className={styles.filterChips} aria-label="Active filters">
            {keyword ? <Tag closable onClose={() => setKeyword('')}>Search: {keyword}</Tag> : null}
            {statusFilter !== 'ALL' ? (
              <Tag closable onClose={() => setStatusFilter('ALL')}>Status: {statusFilter}</Tag>
            ) : null}
            {customerFilter !== 'ALL' ? (
              <Tag closable onClose={() => setCustomerFilter('ALL')}>
                Customer: {customersMap.get(customerFilter)?.name || customerFilter}
              </Tag>
            ) : null}
            {dateRange ? (
              <Tag
                closable
                onClose={() => {
                  setDateRange(null);
                  setDatePickerKey((current) => current + 1);
                }}
              >
                Date: {dateRange[0]} - {dateRange[1]}
              </Tag>
            ) : null}
          </div>
        ) : null}

        <QueryState
          isLoading={ordersQuery.isLoading || customersQuery.isLoading || productsQuery.isLoading}
          isError={ordersQuery.isError || customersQuery.isError || productsQuery.isError}
          error={ordersQuery.error || customersQuery.error || productsQuery.error}
          hasData={filteredOrders.length > 0}
          emptyTitle={hasFilters ? 'No orders match these filters' : 'No sales orders yet'}
          emptyDescription={hasFilters
            ? 'Clear or adjust the active filters to view more orders.'
            : 'Create the first sales order to begin order processing.'}
          emptyAction={hasFilters ? (
            <Button onClick={clearFilters}>Clear filters</Button>
          ) : (
            <Button type="primary" onClick={() => navigate('/sales-orders/new')}>Create Order</Button>
          )}
          onRetry={() => {
            ordersQuery.refetch();
            customersQuery.refetch();
            productsQuery.refetch();
          }}
        >
          <Table
            rowKey="id"
            sticky
            scroll={{ x: 1120 }}
            dataSource={filteredOrders}
            columns={[
              {
                title: 'Order',
                dataIndex: 'code',
                fixed: 'left',
                width: 150,
                render: (value, record) => (
                  <Button type="link" className={styles.orderLink} onClick={() => setSelectedOrder(record)}>
                    {value}
                  </Button>
                ),
              },
              {
                title: 'Customer',
                width: 220,
                render: (_, record) => (
                  <div className={styles.customerCell}>
                    <Avatar size={30}>
                      {getInitials(customersMap.get(record.customerId)?.name || 'Customer')}
                    </Avatar>
                    <div>
                      <strong>{customersMap.get(record.customerId)?.name || `Customer #${record.customerId}`}</strong>
                      <span>Customer #{record.customerId}</span>
                    </div>
                  </div>
                ),
              },
              {
                title: 'Created At',
                dataIndex: 'createdAt',
                width: 170,
                render: (value) => formatDateTime(value),
              },
              {
                title: 'Status',
                width: 120,
                render: (_, record) => <SalesOrderStatusTag status={record.status} />,
              },
              {
                title: 'Total',
                dataIndex: 'totalAmount',
                align: 'right',
                width: 150,
                render: (value) => <span className={styles.money}>{formatCurrency(value)}</span>,
              },
              {
                title: 'Paid',
                dataIndex: 'paidAmount',
                align: 'right',
                width: 150,
                render: (value) => <span className={styles.money}>{formatCurrency(value)}</span>,
              },
              {
                title: 'Debt',
                dataIndex: 'debtAmount',
                align: 'right',
                width: 150,
                render: (value) => (
                  <span className={`${styles.money} ${toNumber(value) > 0 ? styles.debt : ''}`}>
                    {formatCurrency(value)}
                  </span>
                ),
              },
              {
                title: '',
                fixed: 'right',
                width: 64,
                render: (_, record) => (
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: [
                        { key: 'view', label: 'View details' },
                        ...(record.status === 'DRAFT' ? [
                          { key: 'confirm', label: 'Confirm order', icon: <CheckCircleOutlined /> },
                          { key: 'cancel', label: 'Cancel order', icon: <StopOutlined />, danger: true },
                        ] : []),
                      ],
                      onClick: ({ key }) => {
                        if (key === 'view') setSelectedOrder(record);
                        if (key === 'confirm') confirmOrder(record);
                        if (key === 'cancel') cancelOrder(record);
                      },
                    }}
                  >
                    <Button
                      type="text"
                      icon={<MoreOutlined />}
                      aria-label={`Actions for ${record.code}`}
                    />
                  </Dropdown>
                ),
              },
            ]}
          />
        </QueryState>
      </Card>

      <Drawer
        title={selectedOrder ? `Order ${selectedOrder.code}` : 'Order Details'}
        width={720}
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
      >
        {selectedOrder ? (
          <div className={styles.drawerContent}>
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Customer">
                {customersMap.get(selectedOrder.customerId)?.name || `Customer #${selectedOrder.customerId}`}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <SalesOrderStatusTag status={selectedOrder.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Total">{formatCurrency(selectedOrder.totalAmount)}</Descriptions.Item>
              <Descriptions.Item label="Paid">{formatCurrency(selectedOrder.paidAmount)}</Descriptions.Item>
              <Descriptions.Item label="Debt">{formatCurrency(selectedOrder.debtAmount)}</Descriptions.Item>
              <Descriptions.Item label="Warehouse">#{selectedOrder.warehouseId}</Descriptions.Item>
            </Descriptions>

            <div>
              <Typography.Title level={5}>Order Items</Typography.Title>
              <Table
                size="small"
                pagination={false}
                rowKey={(item, index) => item.id ?? `${item.productId}-${index}`}
                dataSource={selectedOrder.items ?? []}
                columns={[
                  {
                    title: 'Product',
                    render: (_, item) => productsMap.get(item.productId)?.name || `Product #${item.productId}`,
                  },
                  { title: 'Qty', dataIndex: 'quantity', align: 'right' },
                  { title: 'Unit Price', dataIndex: 'unitPrice', align: 'right', render: formatCurrency },
                  { title: 'Discount', dataIndex: 'discountAmount', align: 'right', render: formatCurrency },
                  { title: 'Line Total', dataIndex: 'lineTotal', align: 'right', render: formatCurrency },
                ]}
              />
            </div>

            <div>
              <Typography.Title level={5}>Status Summary</Typography.Title>
              <Timeline
                items={[
                  { color: 'blue', children: `Created ${formatDateTime(selectedOrder.createdAt)}` },
                  ...(selectedOrder.confirmedAt
                    ? [{ color: 'green', children: `Confirmed ${formatDateTime(selectedOrder.confirmedAt)}` }]
                    : []),
                  { color: selectedOrder.status === 'CANCELLED' ? 'red' : 'gray', children: `Current status: ${selectedOrder.status}` },
                ]}
              />
            </div>

            {selectedOrder.status === 'DRAFT' ? (
              <Space>
                <Button
                  type="primary"
                  loading={confirmMutation.isPending}
                  onClick={() => confirmOrder(selectedOrder)}
                >
                  Confirm Order
                </Button>
                <Button
                  danger
                  loading={cancelMutation.isPending}
                  onClick={() => cancelOrder(selectedOrder)}
                >
                  Cancel Order
                </Button>
              </Space>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
