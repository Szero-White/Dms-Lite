import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
  TrophyOutlined,
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

const STATUS_CONFIG = {
  DRAFT:     { label: 'Draft',     color: '#f59e0b', bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)', gradient: 'linear-gradient(135deg,#fff7ed 0%,#fef3c7 100%)', glow: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.35)', countColor: '#92400e', labelColor: '#b45309', icon: <ClockCircleOutlined /> },
  CONFIRMED: { label: 'Confirmed', color: '#6366f1', bg: 'linear-gradient(135deg,#6366f1,#818cf8)', gradient: 'linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%)', glow: 'rgba(99,102,241,0.16)', border: 'rgba(99,102,241,0.35)', countColor: '#3730a3', labelColor: '#4f46e5', icon: <CheckCircleOutlined /> },
  COMPLETED: { label: 'Completed', color: '#10b981', bg: 'linear-gradient(135deg,#10b981,#34d399)', gradient: 'linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%)', glow: 'rgba(16,185,129,0.16)', border: 'rgba(16,185,129,0.35)', countColor: '#065f46', labelColor: '#059669', icon: <TrophyOutlined /> },
  CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: 'linear-gradient(135deg,#ef4444,#f87171)', gradient: 'linear-gradient(135deg,#fff1f2 0%,#ffe4e6 100%)', glow: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.32)', countColor: '#991b1b', labelColor: '#dc2626', icon: <StopOutlined /> },
} as const;

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
    () => new Map(customers.map((c) => [c.id, c])),
    [customers],
  );
  const productsMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );
  const orders = ordersQuery.data ?? [];

  const statusCounts = useMemo(() => ({
    DRAFT:     orders.filter((o) => o.status === 'DRAFT').length,
    CONFIRMED: orders.filter((o) => o.status === 'CONFIRMED').length,
    COMPLETED: orders.filter((o) => o.status === 'COMPLETED').length,
    CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
  }), [orders]);

  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status !== 'CANCELLED')
      .reduce((s, o) => s + toNumber(o.totalAmount), 0),
    [orders],
  );
  const outstandingDebt = useMemo(
    () => orders.reduce((s, o) => s + toNumber(o.debtAmount), 0),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return orders.filter((order) => {
      const cName = customersMap.get(order.customerId)?.name ?? '';
      const matchesKeyword = !kw || order.code.toLowerCase().includes(kw) || cName.toLowerCase().includes(kw);
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      const matchesCustomer = customerFilter === 'ALL' || order.customerId === customerFilter;
      const ts = new Date(order.createdAt).getTime();
      const matchesDate = !dateRange || (
        ts >= new Date(`${dateRange[0]}T00:00:00`).getTime() &&
        ts <= new Date(`${dateRange[1]}T23:59:59`).getTime()
      );
      return matchesKeyword && matchesStatus && matchesCustomer && matchesDate;
    });
  }, [customerFilter, customersMap, dateRange, keyword, orders, statusFilter]);

  const hasFilters = Boolean(keyword || statusFilter !== 'ALL' || customerFilter !== 'ALL' || dateRange);

  function clearFilters() {
    setKeyword('');
    setStatusFilter('ALL');
    setCustomerFilter('ALL');
    setDateRange(null);
    setDatePickerKey((c) => c + 1);
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/sales-orders/new')}>
            Create Order
          </Button>
        )}
      />

      {/* ── Pipeline strip ── */}
      <div className={styles.pipeline}>
        {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([status, cfg]) => {
          const count = statusCounts[status];
          const total = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;
          const pct = Math.round((count / total) * 100);
          return (
            <button
              key={status}
              type="button"
              className={`${styles.pipelineCard} ${statusFilter === status ? styles.pipelineActive : ''}`}
              onClick={() => setStatusFilter(statusFilter === status ? 'ALL' : status)}
              style={{
                '--card-gradient': cfg.gradient,
                '--card-glow': cfg.glow,
                '--card-border': cfg.border,
                '--card-count': cfg.countColor,
                '--card-label': cfg.labelColor,
                '--card-dot': cfg.color,
                '--card-text': cfg.color,
              } as React.CSSProperties}
            >
              {/* Top row: icon + percentage pill */}
              <div className={styles.pipelineCardTop}>
                <div className={styles.pipelineIcon} style={{ background: cfg.bg }}>
                  {cfg.icon}
                </div>
                <div className={styles.pipelineBarPill}>
                  <span />
                  {pct}%
                </div>
              </div>

              {/* Body: big count + label */}
              <div className={styles.pipelineBody}>
                <span className={styles.pipelineCount} style={{ color: cfg.countColor }}>{count}</span>
                <span className={styles.pipelineLabel} style={{ color: cfg.labelColor }}>{cfg.label}</span>
              </div>

              {/* Bottom accent bar */}
              <div className={styles.pipelineBar}>
                <div
                  className={styles.pipelineBarFill}
                  style={{ width: `${Math.max(pct, 8)}%`, background: cfg.bg }}
                />
              </div>
            </button>
          );
        })}

        {/* Revenue + debt summary — dark indigo premium card */}
        <div className={styles.pipelineSummary}>
          <div className={styles.pipelineSummaryItem}>
            <div className={`${styles.pipelineSummaryIconWrap} ${styles.revenue}`}>
              <DollarOutlined />
            </div>
            <div>
              <span className={styles.pipelineSummaryVal}>{formatCurrency(totalRevenue)}</span>
              <span className={styles.pipelineSummaryLbl}>Total revenue</span>
            </div>
          </div>
          <div className={styles.pipelineSummaryDivider} />
          <div className={styles.pipelineSummaryItem}>
            <div className={`${styles.pipelineSummaryIconWrap} ${styles.debt}`}>
              <DollarOutlined />
            </div>
            <div>
              <span className={`${styles.pipelineSummaryVal} ${styles.debtVal}`}>
                {formatCurrency(outstandingDebt)}
              </span>
              <span className={styles.pipelineSummaryLbl}>Outstanding debt</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table card ── */}
      <Card className={`panel-card ${styles.tableCard}`}>
        <div className={styles.toolbar}>
          <div className={styles.filterControls}>
            <Input
              allowClear
              className={styles.search}
              prefix={<SearchOutlined />}
              placeholder="Search order code or customer"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
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
                ...customers.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <DatePicker.RangePicker
              key={datePickerKey}
              className={styles.dateFilter}
              format="YYYY-MM-DD"
              onChange={(dates, strs) => setDateRange(dates ? [strs[0], strs[1]] : null)}
            />
          </div>
          <Button disabled={!hasFilters} onClick={clearFilters}>Clear filters</Button>
        </div>

        {hasFilters && (
          <div className={styles.filterChips}>
            {keyword && <Tag closable onClose={() => setKeyword('')}>Search: {keyword}</Tag>}
            {statusFilter !== 'ALL' && <Tag closable onClose={() => setStatusFilter('ALL')}>Status: {statusFilter}</Tag>}
            {customerFilter !== 'ALL' && (
              <Tag closable onClose={() => setCustomerFilter('ALL')}>
                Customer: {customersMap.get(customerFilter)?.name || customerFilter}
              </Tag>
            )}
            {dateRange && (
              <Tag closable onClose={() => { setDateRange(null); setDatePickerKey((c) => c + 1); }}>
                Date: {dateRange[0]} – {dateRange[1]}
              </Tag>
            )}
          </div>
        )}

        <QueryState
          isLoading={ordersQuery.isLoading || customersQuery.isLoading || productsQuery.isLoading}
          isError={ordersQuery.isError || customersQuery.isError || productsQuery.isError}
          error={ordersQuery.error || customersQuery.error || productsQuery.error}
          hasData={filteredOrders.length > 0}
          emptyTitle={hasFilters ? 'No orders match these filters' : 'No sales orders yet'}
          emptyDescription={hasFilters ? 'Clear or adjust filters.' : 'Create the first sales order.'}
          emptyAction={hasFilters
            ? <Button onClick={clearFilters}>Clear filters</Button>
            : <Button type="primary" onClick={() => navigate('/sales-orders/new')}>Create Order</Button>}
          onRetry={() => { ordersQuery.refetch(); customersQuery.refetch(); productsQuery.refetch(); }}
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
                    <Avatar size={30} style={{ background: 'var(--gradient-primary)', color: '#fff', fontWeight: 700 }}>
                      {getInitials(customersMap.get(record.customerId)?.name || 'C')}
                    </Avatar>
                    <div>
                      <strong>{customersMap.get(record.customerId)?.name || `#${record.customerId}`}</strong>
                      <span>ID #{record.customerId}</span>
                    </div>
                  </div>
                ),
              },
              { title: 'Created', dataIndex: 'createdAt', width: 160, render: (v) => formatDateTime(v) },
              { title: 'Status', width: 130, render: (_, r) => <SalesOrderStatusTag status={r.status} /> },
              { title: 'Total', dataIndex: 'totalAmount', align: 'right', width: 150, render: (v) => <span className={styles.money}>{formatCurrency(v)}</span> },
              { title: 'Paid',  dataIndex: 'paidAmount',  align: 'right', width: 150, render: (v) => <span className={styles.money}>{formatCurrency(v)}</span> },
              {
                title: 'Debt', dataIndex: 'debtAmount', align: 'right', width: 150,
                render: (v) => <span className={`${styles.money} ${toNumber(v) > 0 ? styles.debt : ''}`}>{formatCurrency(v)}</span>,
              },
              {
                title: '', fixed: 'right', width: 56,
                render: (_, record) => (
                  <Dropdown trigger={['click']} menu={{
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
                  }}>
                    <Button type="text" icon={<MoreOutlined />} aria-label={`Actions for ${record.code}`} />
                  </Dropdown>
                ),
              },
            ]}
          />
        </QueryState>
      </Card>

      {/* ── Detail drawer ── */}
      <Drawer
        title={selectedOrder ? `Order ${selectedOrder.code}` : 'Order Details'}
        width={720}
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
      >
        {selectedOrder && (
          <div className={styles.drawerContent}>
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Customer">
                {customersMap.get(selectedOrder.customerId)?.name || `#${selectedOrder.customerId}`}
              </Descriptions.Item>
              <Descriptions.Item label="Status"><SalesOrderStatusTag status={selectedOrder.status} /></Descriptions.Item>
              <Descriptions.Item label="Total">{formatCurrency(selectedOrder.totalAmount)}</Descriptions.Item>
              <Descriptions.Item label="Paid">{formatCurrency(selectedOrder.paidAmount)}</Descriptions.Item>
              <Descriptions.Item label="Debt">{formatCurrency(selectedOrder.debtAmount)}</Descriptions.Item>
              <Descriptions.Item label="Warehouse">#{selectedOrder.warehouseId}</Descriptions.Item>
            </Descriptions>
            <div>
              <Typography.Title level={5}>Order Items</Typography.Title>
              <Table size="small" pagination={false}
                rowKey={(item, i) => item.id ?? `${item.productId}-${i}`}
                dataSource={selectedOrder.items ?? []}
                columns={[
                  { title: 'Product', render: (_, item) => productsMap.get(item.productId)?.name || `#${item.productId}` },
                  { title: 'Qty', dataIndex: 'quantity', align: 'right' },
                  { title: 'Unit Price', dataIndex: 'unitPrice', align: 'right', render: formatCurrency },
                  { title: 'Discount', dataIndex: 'discountAmount', align: 'right', render: formatCurrency },
                  { title: 'Line Total', dataIndex: 'lineTotal', align: 'right', render: formatCurrency },
                ]}
              />
            </div>
            <div>
              <Typography.Title level={5}>Timeline</Typography.Title>
              <Timeline items={[
                { color: 'blue', children: `Created ${formatDateTime(selectedOrder.createdAt)}` },
                ...(selectedOrder.confirmedAt ? [{ color: 'green', children: `Confirmed ${formatDateTime(selectedOrder.confirmedAt)}` }] : []),
                { color: selectedOrder.status === 'CANCELLED' ? 'red' : 'gray', children: `Status: ${selectedOrder.status}` },
              ]} />
            </div>
            {selectedOrder.status === 'DRAFT' && (
              <Space>
                <Button type="primary" loading={confirmMutation.isPending} onClick={() => confirmOrder(selectedOrder)}>Confirm Order</Button>
                <Button danger loading={cancelMutation.isPending} onClick={() => cancelOrder(selectedOrder)}>Cancel Order</Button>
              </Space>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
