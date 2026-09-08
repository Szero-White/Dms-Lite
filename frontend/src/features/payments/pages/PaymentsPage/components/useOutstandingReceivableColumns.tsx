import { Avatar, Button, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ReceivableDueTag } from '../../../../../components/common/ReceivableDueTag';
import { formatCurrency, formatDate } from '../../../../../lib/format';
import type { OutstandingPaymentOrder } from '../../../types/payment.types';
import styles from '../PaymentsPage.module.css';

export function useOutstandingReceivableColumns(
  onRecordPayment: (order: OutstandingPaymentOrder) => void,
) {
  const { i18n, t } = useTranslation();

  return useMemo<TableColumnsType<OutstandingPaymentOrder>>(() => [
    {
      title: t('payments.column.salesOrder'),
      dataIndex: 'salesOrderCode',
      fixed: 'left',
      width: 180,
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: t('customers.column.customer'),
      dataIndex: 'customerName',
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
      width: 150,
      align: 'right',
      render: (value: string | number) => formatCurrency(value, i18n.language),
    },
    {
      title: t('payments.column.collected'),
      dataIndex: 'paidAmount',
      width: 150,
      align: 'right',
      render: (value: string | number) => formatCurrency(value, i18n.language),
    },
    {
      title: t('payments.column.remaining'),
      dataIndex: 'remainingAmount',
      width: 170,
      align: 'right',
      render: (value: string | number) => (
        <Typography.Text className={styles.debtOutstanding}>
          {formatCurrency(value, i18n.language)}
        </Typography.Text>
      ),
    },
    {
      title: t('payments.column.dueDate'),
      dataIndex: 'dueDate',
      width: 140,
      render: (value?: string) => value ? formatDate(value, i18n.language) : '--',
    },
    {
      title: t('payments.column.dueStatus'),
      dataIndex: 'dueStatus',
      width: 190,
      render: (_: unknown, order) => (
        <ReceivableDueTag status={order.dueStatus} daysUntilDue={order.daysUntilDue} />
      ),
    },
    {
      title: t('common.actions'),
      fixed: 'right',
      width: 150,
      render: (_: unknown, order) => (
        <Button type="primary" onClick={() => onRecordPayment(order)}>
          {t('payments.recordPayment')}
        </Button>
      ),
    },
  ], [i18n.language, onRecordPayment, t]);
}
