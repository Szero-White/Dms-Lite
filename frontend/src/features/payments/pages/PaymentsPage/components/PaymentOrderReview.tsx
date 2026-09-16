import { Alert, Button, Descriptions, Spin, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate, formatDateTime } from '../../../../../lib/format';
import { TABLE_SORT_DIRECTIONS, TABLE_SORTER_TOOLTIP } from '../../../../../lib/tableSorting';
import type {
  OutstandingPaymentOrder,
  OutstandingPaymentOrderDetail,
  OutstandingPaymentOrderLine,
} from '../../../types/payment.types';
import styles from '../PaymentsPage.module.css';

interface PaymentOrderReviewProps {
  summary: OutstandingPaymentOrder;
  detail?: OutstandingPaymentOrderDetail;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function PaymentOrderReview({
  summary,
  detail,
  isLoading,
  isError,
  onRetry,
}: PaymentOrderReviewProps) {
  const { i18n, t } = useTranslation();
  const order = detail ?? summary;

  const columns: TableColumnsType<OutstandingPaymentOrderLine> = [
    {
      title: t('payments.drawer.product'),
      key: 'product',
      render: (_: unknown, item) => (
        <div className={styles.paymentProductCell}>
          <Typography.Text strong>{item.productName ?? '--'}</Typography.Text>
          <Typography.Text type="secondary">{item.productSku ?? '--'}</Typography.Text>
        </div>
      ),
    },
    {
      title: t('payments.drawer.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'right',
    },
    {
      title: t('payments.drawer.unitPrice'),
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 130,
      align: 'right',
      render: (value: string | number) => formatCurrency(value, i18n.language),
    },
    {
      title: t('payments.drawer.discount'),
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      width: 120,
      align: 'right',
      render: (value: string | number) => formatCurrency(value, i18n.language),
    },
    {
      title: t('payments.drawer.lineTotal'),
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      width: 130,
      align: 'right',
      render: (value: string | number) => (
        <Typography.Text strong>{formatCurrency(value, i18n.language)}</Typography.Text>
      ),
    },
  ];

  return (
    <section>
      <div className={styles.paymentSectionHeading}>
        <div>
          <Typography.Title level={5}>{t('payments.drawer.orderReview')}</Typography.Title>
          <Typography.Text type="secondary">{t('payments.drawer.reviewHint')}</Typography.Text>
        </div>
      </div>

      <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} className={styles.paymentSummary}>
        <Descriptions.Item label={t('payments.column.salesOrder')}>{order.salesOrderCode}</Descriptions.Item>
        <Descriptions.Item label={t('customers.column.customer')}>{order.customerName}</Descriptions.Item>
        <Descriptions.Item label={t('payments.column.confirmedAt')}>
          {order.confirmedAt ? formatDateTime(order.confirmedAt, i18n.language) : '--'}
        </Descriptions.Item>
        <Descriptions.Item label={t('payments.column.dueDate')}>
          {order.dueDate ? formatDate(order.dueDate, i18n.language) : '--'}
        </Descriptions.Item>
        <Descriptions.Item label={t('payments.column.orderTotal')}>
          {formatCurrency(order.totalAmount, i18n.language)}
        </Descriptions.Item>
        <Descriptions.Item label={t('payments.column.collected')}>
          {formatCurrency(order.paidAmount, i18n.language)}
        </Descriptions.Item>
        <Descriptions.Item label={t('payments.column.remaining')} span={2}>
          <Typography.Text type="danger" strong>
            {formatCurrency(order.remainingAmount, i18n.language)}
          </Typography.Text>
        </Descriptions.Item>
      </Descriptions>

      {isLoading ? (
        <div className={styles.paymentDetailLoading}>
          <Spin />
          <Typography.Text type="secondary">{t('payments.drawer.loadingOrderDetails')}</Typography.Text>
        </div>
      ) : null}

      {isError ? (
        <Alert
          type="error"
          showIcon
          message={t('payments.drawer.detailLoadFailed')}
          action={<Button size="small" onClick={onRetry}>{t('common.retry')}</Button>}
        />
      ) : null}

      {detail ? (
        <div className={styles.paymentItemsSection}>
          <Typography.Text strong>{t('payments.drawer.orderItems')}</Typography.Text>
          <Table
            size="small"
            pagination={false}
            rowKey="id"
            dataSource={detail.items}
            columns={columns}
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={TABLE_SORTER_TOOLTIP}
            scroll={{ x: 650 }}
          />
        </div>
      ) : null}
    </section>
  );
}
