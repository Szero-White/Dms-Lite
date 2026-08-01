import { Form, Input, InputNumber, Modal, Select, Typography } from 'antd';
import type { FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ProductRow } from '../../../../products';
import { toNumber } from '../../../../../lib/format';
import type { ReceiveStockPayload } from '../../../types/inventory.types';
import styles from './ReceiveStockModal.module.css';

interface ReceiveStockModalProps {
  form: FormInstance<ReceiveStockPayload>;
  isOpen: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  products: ProductRow[];
  projectedStock: number;
  receivedQuantity?: number;
  selectedProduct?: ProductRow;
}

export function ReceiveStockModal({
  form,
  isOpen,
  isSubmitting,
  onCancel,
  onSubmit,
  products,
  projectedStock,
  receivedQuantity,
  selectedProduct,
}: ReceiveStockModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      rootClassName={styles.modal}
      title={t('inventory.receive.title')}
      open={isOpen}
      onCancel={onCancel}
      onOk={onSubmit}
      okText={t('inventory.receive.ok')}
      cancelText={t('common.cancel')}
      confirmLoading={isSubmitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          label={t('inventory.receive.warehouse')}
          name="warehouseId"
          rules={[
            {
              required: true,
              message: t('inventory.receive.selectWarehouseRequired'),
            },
          ]}
        >
          <Select
            disabled
            options={[
              {
                value: 1,
                label: t('inventory.receive.mainWarehouse'),
              },
            ]}
          />
        </Form.Item>

        <Form.Item
          label={t('inventory.receive.product')}
          name="productId"
          rules={[
            {
              required: true,
              message: t('inventory.receive.selectProductRequired'),
            },
          ]}
        >
          <Select
            showSearch
            placeholder={t('inventory.receive.productPlaceholder')}
            optionFilterProp="label"
            options={products.map((product) => ({
              value: product.id,
              label: `${product.sku} - ${product.name}`,
            }))}
          />
        </Form.Item>

        <Form.Item
          label={t('inventory.receive.quantity')}
          name="quantity"
          rules={[
            {
              required: true,
              message: t('inventory.receive.quantityRequired'),
            },
          ]}
        >
          <InputNumber className={styles.fullWidth} min={1} precision={0} />
        </Form.Item>

        {selectedProduct ? (
          <div className={styles.stockProjection}>
            <div>
              <Typography.Text type="secondary">{t('inventory.receive.currentStock')}</Typography.Text>
              <Typography.Text strong>{selectedProduct.stock}</Typography.Text>
            </div>
            <div>
              <Typography.Text type="secondary">{t('inventory.receive.quantityReceived')}</Typography.Text>
              <Typography.Text strong>{toNumber(receivedQuantity)}</Typography.Text>
            </div>
            <div>
              <Typography.Text type="secondary">{t('inventory.receive.projectedStock')}</Typography.Text>
              <Typography.Text strong>{projectedStock}</Typography.Text>
            </div>
          </div>
        ) : null}

        <Form.Item label={t('inventory.receive.note')} name="note">
          <Input.TextArea rows={3} placeholder={t('inventory.receive.notePlaceholder')} />
        </Form.Item>
      </Form>
    </Modal>
  );
}