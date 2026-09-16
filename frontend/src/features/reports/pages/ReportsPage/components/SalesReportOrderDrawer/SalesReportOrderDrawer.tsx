import { Descriptions, Drawer, Progress, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { SalesOrderStatusTag } from '../../../../../../components/common/StatusTag';
import { formatCurrency, formatDateTime } from '../../../../../../lib/format';
import type { SalesReportOrder } from '../../../../types/salesReport.types';
import styles from '../../ReportsPage.module.css';

interface SalesReportOrderDrawerProps {
  onClose: () => void;
  order: SalesReportOrder | null;
}

export function SalesReportOrderDrawer({ onClose, order }: SalesReportOrderDrawerProps) {
  const { t } = useTranslation();

  return (
    <Drawer
      title={order ? t('reports.detail.title', { code: order.code }) : t('reports.detail.fallbackTitle')}
      width={560}
      open={Boolean(order)}
      onClose={onClose}
    >
      {order ? (
        <div className={styles.reportOrderDetail}>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label={t('reports.table.customer')}>
              {order.customerName ?? '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('reports.table.reportDate')}>
              {formatDateTime(order.reportDate)}
            </Descriptions.Item>
            <Descriptions.Item label={t('reports.table.created')}>
              {formatDateTime(order.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label={t('reports.table.status')}>
              <SalesOrderStatusTag status={order.status} />
            </Descriptions.Item>
            <Descriptions.Item label={t('reports.table.orderTotal')}>
              {formatCurrency(order.totalAmount)}
            </Descriptions.Item>
            <Descriptions.Item label={t('reports.table.collected')}>
              {order.receivableRecognized
                ? formatCurrency(order.collectedAmount)
                : t('reports.value.notApplicable')}
            </Descriptions.Item>
            <Descriptions.Item label={t('reports.table.remainingDebt')}>
              {order.receivableRecognized
                ? formatCurrency(order.remainingReceivable)
                : t('reports.value.notRecognized')}
            </Descriptions.Item>
            <Descriptions.Item label={t('reports.table.collectionProgress')}>
              <div className={styles.collectionProgressDetail}>
                {order.receivableRecognized && order.collectionProgress !== null ? (
                  <Progress percent={order.collectionProgress} />
                ) : (
                  <Typography.Text type="secondary">
                    {order.status === 'CANCELLED'
                      ? t('reports.detail.receivableCancelled')
                      : t('reports.detail.receivableNotRecognized')}
                  </Typography.Text>
                )}
              </div>
            </Descriptions.Item>
          </Descriptions>
        </div>
      ) : null}
    </Drawer>
  );
}
