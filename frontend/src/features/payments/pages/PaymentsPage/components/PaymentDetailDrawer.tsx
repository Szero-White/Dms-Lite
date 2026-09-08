import { DownloadOutlined } from '@ant-design/icons';
import { Button, Descriptions, Drawer } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDateTime } from '../../../../../lib/format';
import { usePaymentReceiptDownload } from '../../../hooks/usePaymentReceiptDownload';
import type { PaymentRecord } from '../../../types/payment.types';
import styles from '../PaymentsPage.module.css';

interface PaymentDetailDrawerProps {
  payment: PaymentRecord | null;
  onClose: () => void;
}

export function PaymentDetailDrawer({ payment, onClose }: PaymentDetailDrawerProps) {
  const { i18n, t } = useTranslation();
  const downloadReceipt = usePaymentReceiptDownload();

  return (
    <Drawer
      width={520}
      title={payment ? t('payments.history.detailTitle', { code: payment.code }) : t('payments.history.title')}
      open={Boolean(payment)}
      onClose={onClose}
    >
      {payment ? (
        <div className={styles.paymentDetail}>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label={t('payments.column.paymentCode')}>{payment.code}</Descriptions.Item>
            <Descriptions.Item label={t('payments.column.salesOrder')}>
              {payment.legacy ? t('payments.history.legacy') : payment.salesOrderCode ?? '--'}
            </Descriptions.Item>
            <Descriptions.Item label={t('customers.column.customer')}>{payment.customerName ?? '--'}</Descriptions.Item>
            {!payment.legacy ? (
              <Descriptions.Item label={t('payments.column.orderTotal')}>
                {formatCurrency(payment.salesOrderTotal, i18n.language)}
              </Descriptions.Item>
            ) : null}
            <Descriptions.Item label={t('payments.column.debtBefore')}>
              {payment.debtBefore === null || payment.debtBefore === undefined
                ? '--'
                : formatCurrency(payment.debtBefore, i18n.language)}
            </Descriptions.Item>
            <Descriptions.Item label={t('payments.column.received')}>
              {formatCurrency(payment.amount, i18n.language)}
            </Descriptions.Item>
            <Descriptions.Item label={t('payments.column.remainingAfter')}>
              {payment.debtAfter === null || payment.debtAfter === undefined
                ? '--'
                : formatCurrency(payment.debtAfter, i18n.language)}
            </Descriptions.Item>
            <Descriptions.Item label={t('payments.column.recordedAt')}>
              {formatDateTime(payment.createdAt, i18n.language)}
            </Descriptions.Item>
            <Descriptions.Item label={t('payments.column.recordedBy')}>{payment.recordedBy ?? '--'}</Descriptions.Item>
            <Descriptions.Item label={t('payments.column.note')}>{payment.note ?? '--'}</Descriptions.Item>
          </Descriptions>
          <Button
            block
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => void downloadReceipt(payment)}
          >
            {t('payments.receipt.download')}
          </Button>
        </div>
      ) : null}
    </Drawer>
  );
}
