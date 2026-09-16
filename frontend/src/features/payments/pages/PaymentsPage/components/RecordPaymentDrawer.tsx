import { App, Button, Drawer, Form, Input, InputNumber, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, toNumber } from '../../../../../lib/format';
import {
  useOutstandingPaymentOrderDetail,
  useRecordSalesOrderPayment,
} from '../../../hooks/usePaymentQueries';
import type {
  OutstandingPaymentOrder,
  RecordPaymentPayload,
} from '../../../types/payment.types';
import styles from '../PaymentsPage.module.css';
import { PaymentOrderReview } from './PaymentOrderReview';

interface RecordPaymentDrawerProps {
  order: OutstandingPaymentOrder | null;
  onClose: () => void;
}

export function RecordPaymentDrawer({ order, onClose }: RecordPaymentDrawerProps) {
  const { i18n, t } = useTranslation();
  const { message } = App.useApp();
  const [requestKey, setRequestKey] = useState('');
  const [form] = Form.useForm<Pick<RecordPaymentPayload, 'amount' | 'note'>>();
  const mutation = useRecordSalesOrderPayment();
  const detailQuery = useOutstandingPaymentOrderDetail(order?.salesOrderId, {
    enabled: Boolean(order),
  });
  const remainingAmount = toNumber(detailQuery.data?.remainingAmount ?? order?.remainingAmount);

  useEffect(() => {
    if (!order) {
      setRequestKey('');
      form.resetFields();
      return;
    }
    setRequestKey(globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    form.resetFields();
  }, [form, order]);

  async function submit(values: Pick<RecordPaymentPayload, 'amount' | 'note'>) {
    if (!order || !requestKey || !detailQuery.data) {
      return;
    }

    await mutation.mutateAsync({
      salesOrderId: order.salesOrderId,
      amount: values.amount,
      note: values.note,
      requestKey,
    });
    onClose();
  }

  return (
    <Drawer
      className={styles.paymentDrawer}
      width={760}
      title={order ? t('payments.drawer.title', { code: order.salesOrderCode }) : t('payments.recordPayment')}
      open={Boolean(order)}
      onClose={onClose}
      destroyOnClose
      footer={(
        <Space className={styles.drawerFooter}>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="primary"
            loading={mutation.isPending}
            disabled={!detailQuery.data || detailQuery.isError}
            onClick={() => form.submit()}
          >
            {t('payments.savePayment')}
          </Button>
        </Space>
      )}
    >
      {order ? (
        <div className={styles.paymentReviewFlow}>
          <PaymentOrderReview
            summary={order}
            detail={detailQuery.data}
            isLoading={detailQuery.isLoading}
            isError={detailQuery.isError}
            onRetry={() => detailQuery.refetch()}
          />

          <section className={styles.paymentEntrySection}>
            <div className={styles.paymentSectionHeading}>
              <div>
                <Typography.Title level={5}>{t('payments.drawer.paymentEntry')}</Typography.Title>
                <Typography.Text type="secondary">{t('payments.drawer.paymentEntryHint')}</Typography.Text>
              </div>
            </div>

            <Form form={form} layout="vertical" preserve={false} onFinish={submit}>
              <Form.Item
                label={t('payments.amount')}
                name="amount"
                rules={[{ required: true, message: t('payments.amountRequired') }]}
              >
                <InputNumber
                  className={styles.fullWidth}
                  min={1}
                  max={remainingAmount}
                  disabled={!detailQuery.data}
                  onChange={(value) => {
                    const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
                    if (remainingAmount > 0 && numericValue > remainingAmount) {
                      form.setFieldValue('amount', remainingAmount);
                      message.info(t('payments.amountCapped', {
                        amount: formatCurrency(remainingAmount, i18n.language),
                      }));
                    }
                  }}
                />
              </Form.Item>
              <Form.Item label={t('payments.note')} name="note">
                <Input.TextArea maxLength={500} rows={3} placeholder={t('payments.notePlaceholder')} />
              </Form.Item>
            </Form>
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}
