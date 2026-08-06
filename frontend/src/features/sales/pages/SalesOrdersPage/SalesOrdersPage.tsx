import {
  CheckCircleOutlined,
  FileTextOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
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
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { PERMISSIONS, canViewOrderFinancials, hasPermission, useAuth } from '../../../auth';
import { SalesOrderStatusTag } from '../../../../components/common/StatusTag';
import { useCustomers } from '../../../customers';
import { useProductList } from '../../../products';
import {
  useCancelSalesOrder,
  useConfirmSalesOrder,
  useSalesOrders,
} from '../../hooks/useSalesQueries';
import { useCreateInvoiceFromSalesOrder } from '../../../invoice';
import {
  formatCurrency,
  formatDateTime,
  toNumber,
} from '../../../../lib/format';
import type { SalesOrder } from '../../types/sales.types';
import { SalesOrdersPulseBar } from './components/SalesOrdersPulseBar';
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
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const canCreateSalesOrder = hasPermission(user, PERMISSIONS.SALES_ORDER_CREATE);
  const canViewCustomers = hasPermission(user, PERMISSIONS.CUSTOMER_VIEW);
  const canViewProducts = hasPermission(user, PERMISSIONS.PRODUCT_VIEW);
  const canViewSalesOrderFinancials = canViewOrderFinancials(user);
  const canConfirmSalesOrder = hasPermission(user, PERMISSIONS.SALES_ORDER_CONFIRM);
  const canCancelSalesOrder = hasPermission(user, PERMISSIONS.SALES_ORDER_CANCEL);
  const { modal } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const ordersQuery = useSalesOrders();
  const customersQuery = useCustomers({ enabled: canViewCustomers });
  const productsQuery = useProductList({ enabled: canViewProducts });
  const confirmMutation = useConfirmSalesOrder();
  const cancelMutation = useCancelSalesOrder();
  const createInvoiceMutation = useCreateInvoiceFromSalesOrder();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [customerFilter, setCustomerFilter] = useState<number | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [datePickerKey, setDatePickerKey] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const highlightOrderId = (location.state as { highlightOrderId?: number } | null)?.highlightOrderId;

  const customers = canViewCustomers ? customersQuery.data ?? [] : [];
  const products = canViewProducts ? productsQuery.data ?? [] : [];
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

  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => o.status === 'CONFIRMED').length;
  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status !== 'CANCELLED')
      .reduce((s, o) => s + toNumber(o.totalAmount), 0),
    [orders],
  );
  const outstandingDebt = useMemo(
    () => orders.reduce((s, o) => s + toNumber(o.debtAmount), 0),
    [orders],
  );
  const paidAmount = useMemo(
    () => orders.reduce((s, o) => s + toNumber(o.paidAmount), 0),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return orders.filter((order) => {
      const cName = canViewCustomers ? customersMap.get(order.customerId)?.name ?? '' : '';
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
  }, [canViewCustomers, customerFilter, customersMap, dateRange, keyword, orders, statusFilter]);

  const hasFilters = Boolean(keyword || statusFilter !== 'ALL' || customerFilter !== 'ALL' || dateRange);

  useEffect(() => {
    if (!highlightOrderId || selectedOrder || !orders.length) {
      return;
    }

    const highlightedOrder = orders.find((order) => order.id === highlightOrderId);
    if (highlightedOrder) {
      setSelectedOrder(highlightedOrder);
    }
  }, [highlightOrderId, orders, selectedOrder]);

  function clearFilters() {
    setKeyword('');
    setStatusFilter('ALL');
    setCustomerFilter('ALL');
    setDateRange(null);
    setDatePickerKey((c) => c + 1);
  }

  function confirmOrder(order: SalesOrder) {
    if (!canConfirmSalesOrder) {
      return;
    }

    modal.confirm({
      title: t('sales.confirm.title', { code: order.code }),
      content: t('sales.confirm.content'),
      okText: t('sales.confirm.ok'),
      onOk: () => confirmMutation.mutateAsync(order.id),
    });
  }

  function cancelOrder(order: SalesOrder) {
    if (!canCancelSalesOrder) {
      return;
    }

    modal.confirm({
      title: t('sales.cancel.title', { code: order.code }),
      content: t('sales.cancel.content'),
      okText: t('sales.cancel.ok'),
      okButtonProps: { danger: true },
      onOk: () => cancelMutation.mutateAsync(order.id),
    });
  }

  function handleCreateInvoice(salesOrderId: number) {
    modal.confirm({
      title: t('sales.invoice.confirmTitle'),
      content: t('sales.invoice.confirmContent'),
      okText: t('sales.invoice.confirmOk'),
      onOk: () => {
        createInvoiceMutation.mutate(salesOrderId, {
          onSuccess: (invoice) => {
            modal.success({
              title: t('sales.invoice.successTitle'),
              content: t('sales.invoice.successContent', { number: invoice.invoiceNumber }),
              onOk: () => navigate(`/invoices/${invoice.id}`),
            });
          },
          onError: (error: unknown) => {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const errorMessage = axiosError.response?.data?.message || (error as Error).message || t('sales.invoice.errorContent');
            modal.error({
              title: t('sales.invoice.errorTitle'),
              content: errorMessage,
            });
          },
        });
      },
    });
  }



  return (
    <div className={styles.page}>
      <PageHeader
        title={t('sales.title')}
        subtitle={t('sales.subtitle')}
        extra={canCreateSalesOrder ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/sales-orders/new')}>
            {t('sales.action.createOrder')}
          </Button>
        ) : null}
      />

      {/* Sales Orders Pulse Bar */}
      <SalesOrdersPulseBar
        activeOrders={activeOrders}
        cancelledCount={statusCounts.CANCELLED}
        completedCount={statusCounts.COMPLETED}
        confirmedCount={statusCounts.CONFIRMED}
        draftCount={statusCounts.DRAFT}
        onStatusFilterChange={setStatusFilter}
        outstandingDebt={outstandingDebt}
        paidAmount={paidAmount}
        showFinancials={canViewSalesOrderFinancials}
        statusFilter={statusFilter}
        totalOrders={totalOrders}
        totalRevenue={totalRevenue}
      />
      {/* Table card */}
      <Card className={`panel-card ${styles.tableCard}`}>
        <div className={styles.toolbar}>
          <div className={styles.filterControls}>
            <Input
              allowClear
              className={styles.search}
              prefix={<SearchOutlined />}
              placeholder={t('sales.filters.searchPlaceholder')}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Select
              className={styles.filter}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: t('sales.filters.allStatuses') },
                { value: 'DRAFT', label: t('status.sales.DRAFT') },
                { value: 'CONFIRMED', label: t('status.sales.CONFIRMED') },
                { value: 'COMPLETED', label: t('status.sales.COMPLETED') },
                { value: 'CANCELLED', label: t('status.sales.CANCELLED') },
              ]}
            />
            {canViewCustomers ? (
              <Select
                showSearch
                optionFilterProp="label"
                className={styles.customerFilter}
                value={customerFilter}
                onChange={setCustomerFilter}
                options={[
                  { value: 'ALL', label: t('sales.filters.allCustomers') },
                  ...customers.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            ) : null}
            <DatePicker.RangePicker
              key={datePickerKey}
              className={styles.dateFilter}
              format="YYYY-MM-DD"
              onChange={(dates, strs) => setDateRange(dates ? [strs[0], strs[1]] : null)}
            />
          </div>
          <Button disabled={!hasFilters} onClick={clearFilters}>{t('common.clearFilters')}</Button>
        </div>

        {hasFilters && (
          <div className={styles.filterChips}>
            {keyword && <Tag closable onClose={() => setKeyword('')}>{t('sales.filters.searchChip', { keyword })}</Tag>}
            {statusFilter !== 'ALL' && <Tag closable onClose={() => setStatusFilter('ALL')}>{t('sales.filters.statusChip', { status: t(`status.sales.${statusFilter}`) })}</Tag>}
            {customerFilter !== 'ALL' && (
              <Tag closable onClose={() => setCustomerFilter('ALL')}>
                {t('sales.filters.customerChip', { customer: customersMap.get(customerFilter)?.name || customerFilter })}
              </Tag>
            )}
            {dateRange && (
              <Tag closable onClose={() => { setDateRange(null); setDatePickerKey((c) => c + 1); }}>
                {t('sales.filters.dateChip', { start: dateRange[0], end: dateRange[1] })}
              </Tag>
            )}
          </div>
        )}

        <QueryState
          isLoading={ordersQuery.isLoading || (canViewCustomers && customersQuery.isLoading) || (canViewProducts && productsQuery.isLoading)}
          isError={ordersQuery.isError || (canViewCustomers && customersQuery.isError) || (canViewProducts && productsQuery.isError)}
          error={ordersQuery.error || (canViewCustomers && customersQuery.error) || (canViewProducts && productsQuery.error)}
          hasData={filteredOrders.length > 0}
          emptyTitle={hasFilters ? t('sales.empty.filteredTitle') : t('sales.empty.title')}
          emptyDescription={hasFilters ? t('sales.empty.filteredDescription') : t('sales.empty.description')}
          emptyAction={hasFilters
            ? <Button onClick={clearFilters}>{t('common.clearFilters')}</Button>
            : canCreateSalesOrder
              ? <Button type="primary" onClick={() => navigate('/sales-orders/new')}>{t('sales.action.createOrder')}</Button>
              : null}
          onRetry={() => {
            ordersQuery.refetch();
            if (canViewCustomers) {
              customersQuery.refetch();
            }
            if (canViewProducts) {
              productsQuery.refetch();
            }
          }}
        >
          <Table
            rowKey="id"
            sticky
            scroll={{ x: 1120 }}
            dataSource={filteredOrders}
            columns={[
              {
                title: t('sales.column.order'),
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
                title: t('sales.column.customer'),
                width: 220,
                render: (_, record) => (
                  <div className={styles.customerCell}>
                    <Avatar size={30} style={{ background: 'var(--gradient-primary)', color: '#fff', fontWeight: 700 }}>
                      {getInitials(customersMap.get(record.customerId)?.name || `#${record.customerId}`)}
                    </Avatar>
                    <div>
                      <strong>{customersMap.get(record.customerId)?.name || `#${record.customerId}`}</strong>
                      <span>ID #{record.customerId}</span>
                    </div>
                  </div>
                ),
              },
              { title: t('sales.column.created'), dataIndex: 'createdAt', width: 160, render: (v) => formatDateTime(v, i18n.language) },
              { title: t('common.status'), width: 130, render: (_, r) => <SalesOrderStatusTag status={r.status} /> },
              ...(canViewSalesOrderFinancials ? [
                { title: t('sales.column.total'), dataIndex: 'totalAmount', align: 'right' as const, width: 150, render: (v: string | number | null) => <span className={styles.money}>{formatCurrency(v)}</span> },
                { title: t('sales.column.paid'), dataIndex: 'paidAmount', align: 'right' as const, width: 150, render: (v: string | number | null) => <span className={styles.money}>{formatCurrency(v)}</span> },
                {
                  title: t('sales.column.debt'), dataIndex: 'debtAmount', align: 'right' as const, width: 150,
                  render: (v: string | number | null) => <span className={`${styles.money} ${toNumber(v) > 0 ? styles.debt : ''}`}>{formatCurrency(v)}</span>,
                },
              ] : []),
              {
                title: '', fixed: 'right', width: 56,
                render: (_, record) => (
                  <Dropdown trigger={['click']} menu={{
                    items: [
                      { key: 'view', label: t('sales.action.viewDetails') },
                      ...(record.status === 'DRAFT' && canConfirmSalesOrder ? [
                        { key: 'confirm', label: t('sales.action.confirmOrder'), icon: <CheckCircleOutlined /> },
                      ] : []),
                      ...(record.status === 'DRAFT' && canCancelSalesOrder ? [
                        { key: 'cancel', label: t('sales.action.cancelOrder'), icon: <StopOutlined />, danger: true },
                      ] : []),
                      ...(record.status === 'COMPLETED' ? [
                        { key: 'createInvoice', label: t('sales.invoice.createAction'), icon: <FileTextOutlined /> },
                      ] : []),
                    ],
                    onClick: ({ key }) => {
                      if (key === 'view') setSelectedOrder(record);
                      if (key === 'confirm') confirmOrder(record);
                      if (key === 'cancel') cancelOrder(record);
                      if (key === 'createInvoice') handleCreateInvoice(record.id);
                    },
                  }}>
                    <Button type="text" icon={<MoreOutlined />} aria-label={t('sales.action.actionsFor', { code: record.code })} />
                  </Dropdown>
                ),
              },
            ]}
          />
        </QueryState>
      </Card>
      {/* Detail drawer */}
      <Drawer
        title={selectedOrder ? t('sales.drawer.orderTitle', { code: selectedOrder.code }) : t('sales.drawer.detailsTitle')}
        width={720}
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
      >
        {selectedOrder && (
          <div className={styles.drawerContent}>
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label={t('sales.column.customer')}>
                {customersMap.get(selectedOrder.customerId)?.name || `#${selectedOrder.customerId}`}
              </Descriptions.Item>
              <Descriptions.Item label={t('common.status')}><SalesOrderStatusTag status={selectedOrder.status} /></Descriptions.Item>
              {canViewSalesOrderFinancials ? (
                <>
                  <Descriptions.Item label={t('sales.column.total')}>{formatCurrency(selectedOrder.totalAmount)}</Descriptions.Item>
                  <Descriptions.Item label={t('sales.column.paid')}>{formatCurrency(selectedOrder.paidAmount)}</Descriptions.Item>
                  <Descriptions.Item label={t('sales.column.debt')}>{formatCurrency(selectedOrder.debtAmount)}</Descriptions.Item>
                </>
              ) : null}
              <Descriptions.Item label={t('sales.drawer.warehouse')}>#{selectedOrder.warehouseId}</Descriptions.Item>
            </Descriptions>
            <div>
              <Typography.Title level={5}>{t('sales.drawer.orderItems')}</Typography.Title>
              <Table size="small" pagination={false}
                rowKey={(item, i) => item.id ?? `${item.productId}-${i}`}
                dataSource={selectedOrder.items ?? []}
                columns={[
                  { title: t('sales.drawer.product'), render: (_, item) => productsMap.get(item.productId)?.name || `#${item.productId}` },
                  { title: t('inventory.history.qty'), dataIndex: 'quantity', align: 'right' },
                  ...(canViewSalesOrderFinancials ? [
                    { title: t('sales.drawer.unitPrice'), dataIndex: 'unitPrice', align: 'right' as const, render: (value) => formatCurrency(value) },
                    { title: t('sales.drawer.discount'), dataIndex: 'discountAmount', align: 'right' as const, render: (value) => formatCurrency(value) },
                    { title: t('sales.drawer.lineTotal'), dataIndex: 'lineTotal', align: 'right' as const, render: (value) => formatCurrency(value) },
                  ] : []),
                ]}
              />
            </div>
            <div>
              <Typography.Title level={5}>{t('sales.drawer.timeline')}</Typography.Title>
              <Timeline items={[
                { color: 'blue', children: t('sales.timeline.created', { time: formatDateTime(selectedOrder.createdAt, i18n.language) }) },
                ...(selectedOrder.confirmedAt ? [{ color: 'green', children: t('sales.timeline.confirmed', { time: formatDateTime(selectedOrder.confirmedAt, i18n.language) }) }] : []),
                { color: selectedOrder.status === 'CANCELLED' ? 'red' : 'gray', children: t('sales.timeline.status', { status: t(`status.sales.${selectedOrder.status}`) }) },
              ]} />
            </div>
            {selectedOrder.status === 'DRAFT' && (
              <Space>
                <Button type="primary" loading={confirmMutation.isPending} onClick={() => confirmOrder(selectedOrder)}>{t('sales.confirm.ok')}</Button>
                <Button danger loading={cancelMutation.isPending} onClick={() => cancelOrder(selectedOrder)}>{t('sales.cancel.ok')}</Button>
              </Space>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
