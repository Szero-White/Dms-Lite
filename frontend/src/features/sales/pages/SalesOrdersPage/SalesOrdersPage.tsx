import {
  CheckCircleOutlined,
  FilterOutlined,
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
  Checkbox,
  DatePicker,
  Descriptions,
  Drawer,
  Dropdown,
  Popover,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { PERMISSIONS, canAccessPath, canViewOrderFinancials, hasPermission, useAuth } from '../../../auth';
import { SalesOrderStatusTag } from '../../../../components/common/StatusTag';
import { useCustomers } from '../../../customers';
import { useProductList } from '../../../products';
import {
  useCancelSalesOrder,
  useConfirmSalesOrder,
  useSalesOrderDetail,
  useSalesOrders,
} from '../../hooks/useSalesQueries';
import {
  formatCurrency,
  formatDateTime,
  toNumber,
} from '../../../../lib/format';
import { TABLE_SORT_DIRECTIONS } from '../../../../lib/tableSorting';
import type { SalesOrder, SalesOrderStatus } from '../../types/sales.types';
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
  const canCreateSalesOrder = hasPermission(user, PERMISSIONS.SALES_ORDER_CREATE)
    && canAccessPath(user, '/sales-orders/new');
  const canViewCustomers = hasPermission(user, PERMISSIONS.CUSTOMER_VIEW);
  const canViewProducts = hasPermission(user, PERMISSIONS.PRODUCT_VIEW);
  const canViewSalesOrderFinancials = canViewOrderFinancials(user);
  const canConfirmSalesOrder = hasPermission(user, PERMISSIONS.SALES_ORDER_CONFIRM);
  const canCancelSalesOrder = hasPermission(user, PERMISSIONS.SALES_ORDER_CANCEL);
  const { modal } = App.useApp();
  const navigate = useNavigate();
  const ordersQuery = useSalesOrders();
  const customersQuery = useCustomers({ enabled: canViewCustomers });
  const productsQuery = useProductList({ enabled: canViewProducts });
  const confirmMutation = useConfirmSalesOrder();
  const cancelMutation = useCancelSalesOrder();
  const [keyword, setKeyword] = useState('');
  const [statusFilters, setStatusFilters] = useState<Array<SalesOrderStatus | 'ALL'>>(['ALL']);
  const [customerFilter, setCustomerFilter] = useState<number | 'ALL'>('ALL');
  const [collectionFilters, setCollectionFilters] = useState<string[]>(['ALL']);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [datePickerKey, setDatePickerKey] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const selectedOrderDetailQuery = useSalesOrderDetail(selectedOrder?.id);
  const selectedOrderDetail = selectedOrderDetailQuery.data ?? selectedOrder;

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
    COMPLETED: orders.filter((o) => o.status === 'COMPLETED').length,
    CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
  }), [orders]);

  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => o.status === 'DRAFT').length;

  const filteredOrders = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return orders.filter((order) => {
      const cName = order.customerName ?? customersMap.get(order.customerId)?.name ?? '';
      const matchesKeyword = !kw || order.code.toLowerCase().includes(kw) || cName.toLowerCase().includes(kw);
      const matchesStatus = statusFilters.includes('ALL') || statusFilters.includes(order.status);
      const matchesCustomer = customerFilter === 'ALL' || order.customerId === customerFilter;
      const matchesCollection = collectionFilters.includes('ALL') || (
        order.status === 'COMPLETED' && (
          (collectionFilters.includes('UNPAID') && toNumber(order.paidAmount) <= 0 && toNumber(order.debtAmount) > 0) ||
          (collectionFilters.includes('PARTIAL') && toNumber(order.paidAmount) > 0 && toNumber(order.debtAmount) > 0) ||
          (collectionFilters.includes('PAID') && toNumber(order.debtAmount) <= 0)
        )
      );
      const ts = new Date(order.createdAt).getTime();
      const matchesDate = !dateRange || (
        ts >= new Date(`${dateRange[0]}T00:00:00`).getTime() &&
        ts <= new Date(`${dateRange[1]}T23:59:59`).getTime()
      );
      return matchesKeyword && matchesStatus && matchesCustomer && matchesCollection && matchesDate;
    }).sort((first, second) => {
      const createdDifference =
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
      return createdDifference || second.id - first.id;
    });
  }, [collectionFilters, customerFilter, customersMap, dateRange, keyword, orders, statusFilters]);

  const hasFilters = Boolean(
    keyword || !statusFilters.includes('ALL') || customerFilter !== 'ALL' || dateRange || !collectionFilters.includes('ALL')
  );

  function clearFilters() {
    setKeyword('');
    setStatusFilters(['ALL']);
    setCustomerFilter('ALL');
    setCollectionFilters(['ALL']);
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
        draftCount={statusCounts.DRAFT}
        onStatusFiltersChange={setStatusFilters}
        statusFilters={statusFilters}
        totalOrders={totalOrders}
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
            <Popover
              trigger="click"
              placement="bottomLeft"
              content={(
                <div className={styles.collectionFilterMenu}>
                  <Typography.Text strong>{t('sales.filters.orderStatus')}</Typography.Text>
                  <Checkbox.Group
                    className={styles.collectionFilterGroup}
                    value={statusFilters}
                    options={[
                      { value: 'ALL', label: t('sales.filters.allStatuses') },
                      { value: 'DRAFT', label: t('status.sales.DRAFT') },
                      { value: 'COMPLETED', label: t('status.sales.COMPLETED') },
                      { value: 'CANCELLED', label: t('status.sales.CANCELLED') },
                    ]}
                    onChange={(values) => {
                      const next = values.map(String) as Array<SalesOrderStatus | 'ALL'>;
                      const previousAll = statusFilters.includes('ALL');
                      const nextAll = next.includes('ALL');
                      if (nextAll && !previousAll) {
                        setStatusFilters(['ALL']);
                        return;
                      }
                      const specific = next.filter((value): value is SalesOrderStatus => value !== 'ALL');
                      setStatusFilters(specific.length > 0 ? specific : ['ALL']);
                    }}
                  />
                </div>
              )}
            >
              <Button className={styles.filter} icon={<FilterOutlined />}>
                {t('sales.filters.orderStatus')}
                {!statusFilters.includes('ALL') ? ` (${statusFilters.length})` : ''}
              </Button>
            </Popover>
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
            {canViewSalesOrderFinancials ? (
              <Popover
                trigger="click"
                placement="bottomLeft"
                content={(
                  <div className={styles.collectionFilterMenu}>
                    <Typography.Text strong>{t('sales.filters.collectionStatus')}</Typography.Text>
                    <Checkbox.Group
                      className={styles.collectionFilterGroup}
                      value={collectionFilters}
                      options={[
                        { value: 'ALL', label: t('sales.filters.collectionAll') },
                        { value: 'UNPAID', label: t('sales.filters.collectionUnpaid') },
                        { value: 'PARTIAL', label: t('sales.filters.collectionPartial') },
                        { value: 'PAID', label: t('sales.filters.collectionPaid') },
                      ]}
                      onChange={(values) => {
                        const next = values.map(String);
                        const previousAll = collectionFilters.includes('ALL');
                        const nextAll = next.includes('ALL');
                        if (nextAll && !previousAll) {
                          setCollectionFilters(['ALL']);
                          return;
                        }
                        const specific = next.filter((value) => value !== 'ALL');
                        setCollectionFilters(specific.length > 0 ? specific : ['ALL']);
                      }}
                    />
                  </div>
                )}
              >
                <Button icon={<FilterOutlined />}>
                  {t('sales.filters.collectionStatus')}
                  {!collectionFilters.includes('ALL') ? ` (${collectionFilters.length})` : ''}
                </Button>
              </Popover>
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
            {!statusFilters.includes('ALL') && statusFilters.map((status) => (
              <Tag
                key={status}
                closable
                onClose={() => {
                  const next = statusFilters.filter((value) => value !== status);
                  setStatusFilters(next.length > 0 ? next : ['ALL']);
                }}
              >
                {t('sales.filters.statusChip', { status: t(`status.sales.${status}`) })}
              </Tag>
            ))}
            {customerFilter !== 'ALL' && (
              <Tag closable onClose={() => setCustomerFilter('ALL')}>
                {t('sales.filters.customerChip', { customer: customersMap.get(customerFilter)?.name || customerFilter })}
              </Tag>
            )}
            {!collectionFilters.includes('ALL') && collectionFilters.map((filter) => (
              <Tag
                key={filter}
                closable
                onClose={() => {
                  const next = collectionFilters.filter((value) => value !== filter);
                  setCollectionFilters(next.length > 0 ? next : ['ALL']);
                }}
              >
                {t(`sales.filters.collection.${filter}`)}
              </Tag>
            ))}
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
            scroll={{ x: 1120 }}
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={false}
            dataSource={filteredOrders}
            columns={[
              {
                title: t('sales.column.order'),
                dataIndex: 'code',
                fixed: 'left',
                width: 150,
                sorter: (first, second) => first.code.localeCompare(second.code),
                render: (value, record) => (
                  <Button type="link" className={styles.orderLink} onClick={() => setSelectedOrder(record)}>
                    {value}
                  </Button>
                ),
              },
              {
                title: t('sales.column.customer'),
                width: 220,
                sorter: (first, second) => {
                  const firstName = first.customerName ?? customersMap.get(first.customerId)?.name ?? '';
                  const secondName = second.customerName ?? customersMap.get(second.customerId)?.name ?? '';
                  return firstName.localeCompare(secondName);
                },
                render: (_, record) => {
                  const customerName = record.customerName
                    ?? customersMap.get(record.customerId)?.name
                    ?? '--';
                  return (
                    <div className={styles.customerCell}>
                      <Avatar size={30} style={{ background: 'var(--gradient-primary)', color: '#fff', fontWeight: 700 }}>
                        {getInitials(customerName)}
                      </Avatar>
                      <div>
                        <strong>{customerName}</strong>
                      </div>
                    </div>
                  );
                },
              },
              {
                title: t('sales.column.created'),
                dataIndex: 'createdAt',
                width: 160,
                defaultSortOrder: 'descend' as const,
                sorter: (first, second) =>
                  new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime(),
                render: (v) => formatDateTime(v, i18n.language),
              },
              {
                title: t('common.status'),
                width: 130,
                sorter: (first, second) => first.status.localeCompare(second.status),
                render: (_, r) => <SalesOrderStatusTag status={r.status} />,
              },
              ...(canViewSalesOrderFinancials ? [
                {
                  title: t('sales.column.total'),
                  dataIndex: 'totalAmount',
                  align: 'right' as const,
                  width: 150,
                  sorter: (first: SalesOrder, second: SalesOrder) =>
                    toNumber(first.totalAmount) - toNumber(second.totalAmount),
                  render: (v: string | number | null) => (
                    <span className={styles.money}>{formatCurrency(v)}</span>
                  ),
                },
                {
                  title: t('sales.column.paid'),
                  dataIndex: 'paidAmount',
                  align: 'right' as const,
                  width: 150,
                  sorter: (first: SalesOrder, second: SalesOrder) =>
                    toNumber(first.paidAmount) - toNumber(second.paidAmount),
                  render: (_, record) => (
                    <span className={styles.money}>
                      {record.status === 'COMPLETED'
                        ? formatCurrency(record.paidAmount)
                        : t('sales.financial.notApplicable')}
                    </span>
                  ),
                },
                {
                  title: t('sales.column.debt'),
                  dataIndex: 'debtAmount',
                  align: 'right' as const,
                  width: 180,
                  sorter: (first: SalesOrder, second: SalesOrder) =>
                    toNumber(first.debtAmount) - toNumber(second.debtAmount),
                  render: (_, record) => {
                    if (record.status === 'COMPLETED') {
                      return <span className={`${styles.money} ${toNumber(record.debtAmount) > 0 ? styles.debt : ''}`}>{formatCurrency(record.debtAmount)}</span>;
                    }

                    if (record.status === 'DRAFT') {
                      return <span className={styles.money}>{t('sales.financial.projectedReceivable', { amount: formatCurrency(record.totalAmount) })}</span>;
                    }

                    return <span className={styles.money}>{t('sales.financial.notIncurred')}</span>;
                  },
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
                    ],
                    onClick: ({ key }) => {
                      if (key === 'view') setSelectedOrder(record);
                      if (key === 'confirm') confirmOrder(record);
                      if (key === 'cancel') cancelOrder(record);
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
        title={selectedOrderDetail ? t('sales.drawer.orderTitle', { code: selectedOrderDetail.code }) : t('sales.drawer.detailsTitle')}
        width={720}
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
      >
        {selectedOrderDetail && (
          <div className={styles.drawerContent}>
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label={t('sales.column.customer')}>
                {selectedOrderDetail.customerName
                  ?? customersMap.get(selectedOrderDetail.customerId)?.name
                  ?? '--'}
              </Descriptions.Item>
              <Descriptions.Item label={t('common.status')}><SalesOrderStatusTag status={selectedOrderDetail.status} /></Descriptions.Item>
              {canViewSalesOrderFinancials ? (
                <>
                  <Descriptions.Item label={t('sales.column.total')}>{formatCurrency(selectedOrderDetail.totalAmount)}</Descriptions.Item>
                  <Descriptions.Item label={t('sales.column.paid')}>
                    {selectedOrderDetail.status === 'COMPLETED'
                      ? formatCurrency(selectedOrderDetail.paidAmount)
                      : t('sales.financial.notApplicable')}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('sales.column.debt')}>
                    {selectedOrderDetail.status === 'COMPLETED'
                      ? formatCurrency(selectedOrderDetail.debtAmount)
                      : selectedOrderDetail.status === 'DRAFT'
                        ? t('sales.financial.projectedReceivable', { amount: formatCurrency(selectedOrderDetail.totalAmount) })
                        : t('sales.financial.notIncurred')}
                  </Descriptions.Item>
                </>
              ) : null}
              <Descriptions.Item label={t('sales.drawer.warehouse')}>
                {selectedOrderDetail.warehouseName ?? '--'}
              </Descriptions.Item>
            </Descriptions>
            <div>
              <Typography.Title level={5}>{t('sales.drawer.orderItems')}</Typography.Title>
              <Table size="small" pagination={false}
                rowKey={(item, i) => item.id ?? `${item.productId}-${i}`}
                dataSource={selectedOrderDetail.items ?? []}
                sortDirections={TABLE_SORT_DIRECTIONS}
                showSorterTooltip={false}
                columns={[
                  { title: t('sales.drawer.product'), sorter: (first, second) => (productsMap.get(first.productId)?.name ?? '').localeCompare(productsMap.get(second.productId)?.name ?? ''), render: (_, item) => productsMap.get(item.productId)?.name || '--' },
                  { title: t('inventory.history.qty'), dataIndex: 'quantity', align: 'right', sorter: (first, second) => first.quantity - second.quantity },
                  ...(canViewSalesOrderFinancials ? [
                    { title: t('sales.drawer.unitPrice'), dataIndex: 'unitPrice', align: 'right' as const, sorter: (first, second) => toNumber(first.unitPrice) - toNumber(second.unitPrice), render: (value) => formatCurrency(value) },
                    { title: t('sales.drawer.discount'), dataIndex: 'discountAmount', align: 'right' as const, sorter: (first, second) => toNumber(first.discountAmount) - toNumber(second.discountAmount), render: (value) => formatCurrency(value) },
                    { title: t('sales.drawer.lineTotal'), dataIndex: 'lineTotal', align: 'right' as const, sorter: (first, second) => toNumber(first.lineTotal) - toNumber(second.lineTotal), render: (value) => formatCurrency(value) },
                  ] : []),
                ]}
              />
            </div>
            <div>
              <Typography.Title level={5}>{t('sales.drawer.timeline')}</Typography.Title>
              <Timeline items={[
                { color: 'blue', children: t('sales.timeline.created', { time: formatDateTime(selectedOrderDetail.createdAt, i18n.language) }) },
                ...(selectedOrderDetail.confirmedAt ? [{ color: 'green', children: t('sales.timeline.confirmed', { time: formatDateTime(selectedOrderDetail.confirmedAt, i18n.language) }) }] : []),
                { color: selectedOrderDetail.status === 'CANCELLED' ? 'red' : 'gray', children: t('sales.timeline.status', { status: t(`status.sales.${selectedOrderDetail.status}`) }) },
              ]} />
            </div>
            {selectedOrderDetail.status === 'DRAFT' && (canConfirmSalesOrder || canCancelSalesOrder) ? (
              <Space>
                {canConfirmSalesOrder ? (
                  <Button type="primary" loading={confirmMutation.isPending} onClick={() => confirmOrder(selectedOrderDetail)}>
                    {t('sales.confirm.ok')}
                  </Button>
                ) : null}
                {canCancelSalesOrder ? (
                  <Button danger loading={cancelMutation.isPending} onClick={() => cancelOrder(selectedOrderDetail)}>
                    {t('sales.cancel.ok')}
                  </Button>
                ) : null}
              </Space>
            ) : null}
          </div>
        )}
      </Drawer>
    </div>
  );
}
