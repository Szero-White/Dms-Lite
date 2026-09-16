import { Form, Input, Modal, Typography } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { SalesOrder } from '../../../../types/sales.types';

interface SalesOrderCancellationModalProps {
  order: SalesOrder | null;
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

interface CancellationFormValues {
  reason: string;
}

export function SalesOrderCancellationModal({
  order,
  open,
  submitting,
  onClose,
  onSubmit,
}: SalesOrderCancellationModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<CancellationFormValues>();

  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [form, open]);

  async function handleOk() {
    const values = await form.validateFields();
    await onSubmit(values.reason.trim());
  }

  return (
    <Modal
      open={open}
      title={t('sales.cancel.title', { code: order?.code ?? '' })}
      okText={t('sales.cancel.ok')}
      cancelText={t('common.cancel')}
      okButtonProps={{ danger: true }}
      confirmLoading={submitting}
      maskClosable={!submitting}
      closable={!submitting}
      onCancel={onClose}
      onOk={handleOk}
    >
      <Typography.Paragraph type="secondary">
        {t('sales.cancel.reasonHelp')}
      </Typography.Paragraph>
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          label={t('sales.cancel.reasonLabel')}
          name="reason"
          rules={[
            { required: true, whitespace: true, message: t('sales.cancel.reasonRequired') },
            { max: 500, message: t('sales.cancel.reasonTooLong') },
          ]}
        >
          <Input.TextArea
            autoFocus
            autoSize={{ minRows: 4, maxRows: 7 }}
            maxLength={500}
            showCount
            placeholder={t('sales.cancel.reasonPlaceholder')}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
