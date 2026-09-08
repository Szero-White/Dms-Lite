import { App, Button, Descriptions, Drawer, Form, Input, InputNumber, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, toNumber } from '../../../../../lib/format';
import { useRecordSalesOrderPayment } from '../../../hooks/usePaymentQueries';
import type {
  OutstandingPaymentOrder,
  RecordPaymentPayload,
} from '../../../types/payment.types';
import styles from '../PaymentsPage.module.css';

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
  const remainingAmount = toNumber(order?.remainingAmount);

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
    if (!order || !requestKey) {
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
      width={480}
      title={order ? t('payments.drawer.title', { code: order.salesOrderCode }) : t('payments.recordPayment')}
      open={Boolean(order)}
      onClose={onClose}
      destroyOnClose
      footer={(
        <Space className={styles.drawerFooter}>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
            {t('payments.savePayment')}
          </Button>
        </Space>
      )}
    >
      {order ? (
        <>
          <Descriptions bordered size="small" column={1} className={styles.paymentSummary}>
            <Descriptions.Item label={t('payments.column.salesOrder')}>{order.salesOrderCode}</Descriptions.Item>
            <Descriptions.Item label={t('customers.column.customer')}>{order.customerName}</Descriptions.Item>
            <Descriptions.Item label={t('payments.column.orderTotal')}>{formatCurrency(order.totalAmount, i18n.language)}</Descriptions.Item>
            <Descriptions.Item label={t('payments.column.collected')}>{formatCurrency(order.paidAmount, i18n.language)}</Descriptions.Item>
            <Descriptions.Item label={t('payments.column.remaining')}>
              <Typography.Text type="danger" strong>{formatCurrency(order.remainingAmount, i18n.language)}</Typography.Text>
            </Descriptions.Item>
          </Descriptions>

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
              <Input.TextArea maxLength={500} rows={4} placeholder={t('payments.notePlaceholder')} />
            </Form.Item>
          </Form>
        </>
      ) : null}
    </Drawer>
  );
}
