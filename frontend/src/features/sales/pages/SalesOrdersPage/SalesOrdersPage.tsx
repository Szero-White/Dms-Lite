import {
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  App,
  Avatar,
  Button,
  Card,
  DatePicker,
  Input,
  Table,
  Tag,
} from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { TableMultiSelectFilter } from '../../../../components/common/TableMultiSelectFilter';
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
import { newestFirst, TABLE_SORT_DIRECTIONS, TABLE_SORTER_TOOLTIP } from '../../../../lib/tableSorting';
import type { SalesOrder, SalesOrderStatus } from '../../types/sales.types';
import { SalesOrderCancellationModal } from './components/SalesOrderCancellationModal';
import { SalesOrderDetailDrawer } from './components/SalesOrderDetailDrawer';
import { SalesOrderRowActions } from './components/SalesOrderRowActions';
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


type CollectionFilter = 'UNPAID' | 'PARTIAL' | 'PAID';

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
  const [statusFilters, setStatusFilters] = useState<SalesOrderStatus[]>([]);
  const [customerFilters, setCustomerFilters] = useState<number[]>([]);
  const [collectionFilters, setCollectionFilters] = useState<CollectionFilter[]>([]);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [datePickerKey, setDatePickerKey] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SalesOrder | null>(null);
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
    const filtered = orders.filter((order) => {
      const cName = order.customerName ?? customersMap.get(order.customerId)?.name ?? '';
      const matchesKeyword = !kw || order.code.toLowerCase().includes(kw) || cName.toLowerCase().includes(kw);
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(order.status);
      const matchesCustomer = customerFilters.length === 0 || customerFilters.includes(order.customerId);
      const matchesCollection = collectionFilters.length === 0 || (
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
    });

    return newestFirst(filtered);
  }, [collectionFilters, customerFilters, customersMap, dateRange, keyword, orders, statusFilters]);

  const hasFilters = Boolean(
    keyword || statusFilters.length > 0 || customerFilters.length > 0 || dateRange || collectionFilters.length > 0
  );

  function clearFilters() {
    setKeyword('');
    setStatusFilters([]);
    setCustomerFilters([]);
    setCollectionFilters([]);
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

  function requestCancelOrder(order: SalesOrder) {
    if (!canCancelSalesOrder || order.status !== 'DRAFT') {
      return;
    }

    setCancelTarget(order);
  }

  async function submitCancellation(reason: string) {
    if (!cancelTarget) {
      return;
    }

    await cancelMutation.mutateAsync({ orderId: cancelTarget.id, reason });
    setCancelTarget(null);
  }


  return (
    <div className={styles.page}>
      <PageHeader
        variant="operations"
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
            <TableMultiSelectFilter
              ariaLabel={t('sales.filters.orderStatus')}
              className={styles.filter}
              value={statusFilters}
              onChange={setStatusFilters}
              placeholder={t('sales.filters.allStatuses')}
              options={[
                { value: 'DRAFT', label: t('status.sales.DRAFT') },
                { value: 'COMPLETED', label: t('status.sales.COMPLETED') },
                { value: 'CANCELLED', label: t('status.sales.CANCELLED') },
              ]}
            />
            {canViewCustomers ? (
              <TableMultiSelectFilter
                ariaLabel={t('sales.filters.allCustomers')}
                className={styles.customerFilter}
                value={customerFilters}
                onChange={setCustomerFilters}
                placeholder={t('sales.filters.allCustomers')}
                showSearch
                options={customers.map((customer) => ({
                  value: customer.id,
                  label: customer.name,
                }))}
              />
            ) : null}
            {canViewSalesOrderFinancials ? (
              <TableMultiSelectFilter
                ariaLabel={t('sales.filters.collectionStatus')}
                className={styles.filter}
                value={collectionFilters}
                onChange={setCollectionFilters}
                placeholder={t('sales.filters.collectionStatus')}
                options={[
                  { value: 'UNPAID', label: t('sales.filters.collectionUnpaid') },
                  { value: 'PARTIAL', label: t('sales.filters.collectionPartial') },
                  { value: 'PAID', label: t('sales.filters.collectionPaid') },
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
            {statusFilters.map((status) => (
              <Tag
                key={status}
                closable
                onClose={() => {
                  const next = statusFilters.filter((value) => value !== status);
                  setStatusFilters(next);
                }}
              >
                {t('sales.filters.statusChip', { status: t(`status.sales.${status}`) })}
              </Tag>
            ))}
            {customerFilters.map((customerId) => (
              <Tag key={customerId} closable onClose={() => setCustomerFilters((current) => current.filter((value) => value !== customerId))}>
                {t('sales.filters.customerChip', { customer: customersMap.get(customerId)?.name || customerId })}
              </Tag>
            ))}
            {collectionFilters.map((filter) => (
              <Tag
                key={filter}
                closable
                onClose={() => {
                  const next = collectionFilters.filter((value) => value !== filter);
                  setCollectionFilters(next);
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
            scroll={{ x: 1320 }}
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={TABLE_SORTER_TOOLTIP}
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
                      <Avatar size={30} style={{ background: 'var(--color-primary)', color: '#fff', fontWeight: 700 }}>
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
                title: t('common.actions'),
                key: 'actions',
                fixed: 'right',
                width: 142,
                align: 'right',
                render: (_, record) => (
                  <SalesOrderRowActions
                    order={record}
                    canConfirm={canConfirmSalesOrder}
                    canCancel={canCancelSalesOrder}
                    confirming={confirmMutation.isPending && confirmMutation.variables === record.id}
                    cancelling={cancelMutation.isPending && cancelMutation.variables?.orderId === record.id}
                    onView={setSelectedOrder}
                    onConfirm={confirmOrder}
                    onCancel={requestCancelOrder}
                  />
                ),
              },
            ]}
          />
        </QueryState>
      </Card>
      <SalesOrderDetailDrawer
        canCancel={canCancelSalesOrder}
        canConfirm={canConfirmSalesOrder}
        canViewFinancials={canViewSalesOrderFinancials}
        cancelling={cancelMutation.isPending}
        confirming={confirmMutation.isPending}
        customerName={
          selectedOrderDetail
            ? selectedOrderDetail.customerName
              ?? customersMap.get(selectedOrderDetail.customerId)?.name
            : undefined
        }
        getProductName={(productId) => productsMap.get(productId)?.name}
        onCancel={requestCancelOrder}
        onClose={() => setSelectedOrder(null)}
        onConfirm={confirmOrder}
        open={Boolean(selectedOrder)}
        order={selectedOrderDetail ?? null}
      />
      <SalesOrderCancellationModal
        order={cancelTarget}
        open={Boolean(cancelTarget)}
        submitting={cancelMutation.isPending}
        onClose={() => {
          if (!cancelMutation.isPending) {
            setCancelTarget(null);
          }
        }}
        onSubmit={submitCancellation}
      />
    </div>
  );
}
