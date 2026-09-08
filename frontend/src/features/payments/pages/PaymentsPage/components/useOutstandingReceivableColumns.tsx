import { Avatar, Button, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ReceivableDueTag } from '../../../../../components/common/ReceivableDueTag';
import { formatCurrency, formatDate, formatDateTime } from '../../../../../lib/format';
import { getTableSortOrder } from '../../../../../lib/tableSorting';
import type {
  OutstandingPaymentOrder,
  OutstandingPaymentSortField,
  SortDirection,
} from '../../../types/payment.types';
import styles from '../PaymentsPage.module.css';

export function useOutstandingReceivableColumns(
  onRecordPayment: (order: OutstandingPaymentOrder) => void,
  sortBy?: OutstandingPaymentSortField,
  sortDirection?: SortDirection,
) {
  const { i18n, t } = useTranslation();

  return useMemo<TableColumnsType<OutstandingPaymentOrder>>(() => [
    {
      title: t('payments.column.salesOrder'),
      dataIndex: 'salesOrderCode',
      key: 'ORDER_CODE',
      sorter: true,
      sortOrder: getTableSortOrder(sortBy, sortDirection, 'ORDER_CODE'),
      fixed: 'left',
      width: 180,
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: t('customers.column.customer'),
      dataIndex: 'customerName',
      key: 'CUSTOMER',
      sorter: true,
      sortOrder: getTableSortOrder(sortBy, sortDirection, 'CUSTOMER'),
      width: 240,
      render: (value: string) => (
        <div className={styles.customerCell}>
          <Avatar>{value.slice(0, 2).toUpperCase()}</Avatar>
          <Typography.Text strong>{value}</Typography.Text>
        </div>
      ),
    },
    {
      title: t('payments.column.orderTotal'),
      dataIndex: 'totalAmount',
      key: 'TOTAL_AMOUNT',
      sorter: true,
      sortOrder: getTableSortOrder(sortBy, sortDirection, 'TOTAL_AMOUNT'),
      width: 150,
      align: 'right',
      render: (value: string | number) => formatCurrency(value, i18n.language),
    },
    {
      title: t('payments.column.collected'),
      dataIndex: 'paidAmount',
      key: 'PAID_AMOUNT',
      sorter: true,
      sortOrder: getTableSortOrder(sortBy, sortDirection, 'PAID_AMOUNT'),
      width: 150,
      align: 'right',
      render: (value: string | number) => formatCurrency(value, i18n.language),
    },
    {
      title: t('payments.column.remaining'),
      dataIndex: 'remainingAmount',
      key: 'REMAINING_AMOUNT',
      sorter: true,
      sortOrder: getTableSortOrder(sortBy, sortDirection, 'REMAINING_AMOUNT'),
      width: 170,
      align: 'right',
      render: (value: string | number) => (
        <Typography.Text className={styles.debtOutstanding}>
          {formatCurrency(value, i18n.language)}
        </Typography.Text>
      ),
    },
    {
      title: t('payments.column.confirmedAt'),
      dataIndex: 'confirmedAt',
      key: 'NEWEST',
      sorter: true,
      sortOrder: getTableSortOrder(sortBy, sortDirection, 'NEWEST'),
      width: 170,
      render: (value?: string) => value ? formatDateTime(value, i18n.language) : '--',
    },
    {
      title: t('payments.column.dueDate'),
      dataIndex: 'dueDate',
      key: 'DUE_DATE',
      sorter: true,
      sortOrder: getTableSortOrder(sortBy, sortDirection, 'DUE_DATE'),
      width: 140,
      render: (value?: string) => value ? formatDate(value, i18n.language) : '--',
    },
    {
      title: t('payments.column.dueStatus'),
      dataIndex: 'dueStatus',
      key: 'DUE_STATUS',
      sorter: true,
      sortOrder: getTableSortOrder(sortBy, sortDirection, 'DUE_STATUS'),
      width: 190,
      render: (_: unknown, order) => (
        <ReceivableDueTag status={order.dueStatus} daysUntilDue={order.daysUntilDue} />
      ),
    },
    {
      title: t('common.actions'),
      fixed: 'right',
      width: 200,
      align: 'center',
      render: (_: unknown, order) => (
        <Button block type="primary" onClick={() => onRecordPayment(order)}>
          {t('payments.recordPayment')}
        </Button>
      ),
    },
  ], [i18n.language, onRecordPayment, sortBy, sortDirection, t]);
}
