import { Button, Descriptions, Drawer, Space, Table, Timeline, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { SalesOrderStatusTag } from '../../../../../../components/common/StatusTag';
import { formatCurrency, formatDateTime, toNumber } from '../../../../../../lib/format';
import { TABLE_SORT_DIRECTIONS, TABLE_SORTER_TOOLTIP } from '../../../../../../lib/tableSorting';
import type { SalesOrder } from '../../../../types/sales.types';
import styles from '../../SalesOrdersPage.module.css';

interface SalesOrderDetailDrawerProps {
  canCancel: boolean;
  canConfirm: boolean;
  canViewFinancials: boolean;
  cancelling: boolean;
  confirming: boolean;
  customerName?: string | null;
  getProductName: (productId: number) => string | undefined;
  onCancel: (order: SalesOrder) => void;
  onClose: () => void;
  onConfirm: (order: SalesOrder) => void;
  open: boolean;
  order: SalesOrder | null;
}

export function SalesOrderDetailDrawer({
  canCancel,
  canConfirm,
  canViewFinancials,
  cancelling,
  confirming,
  customerName,
  getProductName,
  onCancel,
  onClose,
  onConfirm,
  open,
  order,
}: SalesOrderDetailDrawerProps) {
  const { i18n, t } = useTranslation();

  return (
    <Drawer
      title={order ? t('sales.drawer.orderTitle', { code: order.code }) : t('sales.drawer.detailsTitle')}
      width={720}
      open={open}
      onClose={onClose}
    >
      {order ? (
        <div className={styles.drawerContent}>
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label={t('sales.column.customer')}>
              {customerName ?? order.customerName ?? '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('common.status')}>
              <SalesOrderStatusTag status={order.status} />
            </Descriptions.Item>
            {canViewFinancials ? (
              <>
                <Descriptions.Item label={t('sales.column.total')}>
                  {formatCurrency(order.totalAmount)}
                </Descriptions.Item>
                <Descriptions.Item label={t('sales.column.paid')}>
                  {order.status === 'COMPLETED'
                    ? formatCurrency(order.paidAmount)
                    : t('sales.financial.notApplicable')}
                </Descriptions.Item>
                <Descriptions.Item label={t('sales.column.debt')}>
                  {order.status === 'COMPLETED'
                    ? formatCurrency(order.debtAmount)
                    : order.status === 'DRAFT'
                      ? t('sales.financial.projectedReceivable', {
                          amount: formatCurrency(order.totalAmount),
                        })
                      : t('sales.financial.notIncurred')}
                </Descriptions.Item>
              </>
            ) : null}
            <Descriptions.Item label={t('sales.drawer.warehouse')}>
              {order.warehouseName ?? '--'}
            </Descriptions.Item>
            {order.status === 'CANCELLED' && order.cancellationReason ? (
              <Descriptions.Item label={t('sales.drawer.cancellationReason')} span={2}>
                {order.cancellationReason}
              </Descriptions.Item>
            ) : null}
          </Descriptions>

          <div>
            <Typography.Title level={5}>{t('sales.drawer.orderItems')}</Typography.Title>
            <Table
              size="small"
              pagination={false}
              rowKey={(item, index) => item.id ?? `${item.productId}-${index}`}
              dataSource={order.items ?? []}
              sortDirections={TABLE_SORT_DIRECTIONS}
              showSorterTooltip={TABLE_SORTER_TOOLTIP}
              columns={[
                {
                  title: t('sales.drawer.product'),
                  sorter: (first, second) =>
                    (getProductName(first.productId) ?? '').localeCompare(
                      getProductName(second.productId) ?? '',
                    ),
                  render: (_, item) => getProductName(item.productId) || '--',
                },
                {
                  title: t('inventory.history.qty'),
                  dataIndex: 'quantity',
                  align: 'right',
                  sorter: (first, second) => first.quantity - second.quantity,
                },
                ...(canViewFinancials ? [
                  {
                    title: t('sales.drawer.unitPrice'),
                    dataIndex: 'unitPrice',
                    align: 'right' as const,
                    sorter: (first, second) => toNumber(first.unitPrice) - toNumber(second.unitPrice),
                    render: (value: string | number | null) => formatCurrency(value),
                  },
                  {
                    title: t('sales.drawer.discount'),
                    dataIndex: 'discountAmount',
                    align: 'right' as const,
                    sorter: (first, second) =>
                      toNumber(first.discountAmount) - toNumber(second.discountAmount),
                    render: (value: string | number | null) => formatCurrency(value),
                  },
                  {
                    title: t('sales.drawer.lineTotal'),
                    dataIndex: 'lineTotal',
                    align: 'right' as const,
                    sorter: (first, second) => toNumber(first.lineTotal) - toNumber(second.lineTotal),
                    render: (value: string | number | null) => formatCurrency(value),
                  },
                ] : []),
              ]}
            />
          </div>

          <div>
            <Typography.Title level={5}>{t('sales.drawer.timeline')}</Typography.Title>
            <Timeline
              items={[
                {
                  color: 'blue',
                  children: t('sales.timeline.created', {
                    time: formatDateTime(order.createdAt, i18n.language),
                  }),
                },
                ...(order.confirmedAt ? [{
                  color: 'green',
                  children: t('sales.timeline.confirmed', {
                    time: formatDateTime(order.confirmedAt, i18n.language),
                  }),
                }] : []),
                ...(order.cancelledAt ? [{
                  color: 'red',
                  children: t('sales.timeline.cancelled', {
                    time: formatDateTime(order.cancelledAt, i18n.language),
                  }),
                }] : []),
                {
                  color: order.status === 'CANCELLED' ? 'red' : 'gray',
                  children: t('sales.timeline.status', {
                    status: t(`status.sales.${order.status}`),
                  }),
                },
              ]}
            />
          </div>

          {order.status === 'DRAFT' && (canConfirm || canCancel) ? (
            <Space>
              {canConfirm ? (
                <Button type="primary" loading={confirming} onClick={() => onConfirm(order)}>
                  {t('sales.confirm.ok')}
                </Button>
              ) : null}
              {canCancel ? (
                <Button danger loading={cancelling} onClick={() => onCancel(order)}>
                  {t('sales.cancel.ok')}
                </Button>
              ) : null}
            </Space>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}
