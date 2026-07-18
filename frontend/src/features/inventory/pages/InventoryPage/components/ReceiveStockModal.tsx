import { Form, Input, InputNumber, Modal, Select, Typography } from 'antd';
import type { FormInstance } from 'antd';
import type { ProductRow } from '../../../../products';
import { toNumber } from '../../../../../lib/format';
import type { ReceiveStockPayload } from '../../../types/inventory.types';
import styles from '../InventoryPage.module.css';

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
  return (
    <Modal
      rootClassName={styles.modal}
      title="Receive Stock"
      open={isOpen}
      onCancel={onCancel}
      onOk={onSubmit}
      okText="Receive"
      cancelText="Cancel"
      confirmLoading={isSubmitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          label="Warehouse"
          name="warehouseId"
          rules={[
            {
              required: true,
              message: 'Please select a warehouse',
            },
          ]}
        >
          <Select
            disabled
            options={[
              {
                value: 1,
                label: 'Main Warehouse',
              },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Product"
          name="productId"
          rules={[
            {
              required: true,
              message: 'Please select a product',
            },
          ]}
        >
          <Select
            showSearch
            placeholder="Select product"
            optionFilterProp="label"
            options={products.map((product) => ({
              value: product.id,
              label: `${product.sku} - ${product.name}`,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Quantity"
          name="quantity"
          rules={[
            {
              required: true,
              message: 'Please enter quantity',
            },
          ]}
        >
          <InputNumber className={styles.fullWidth} min={1} precision={0} />
        </Form.Item>

        {selectedProduct ? (
          <div className={styles.stockProjection}>
            <div>
              <Typography.Text type="secondary">Current stock</Typography.Text>
              <Typography.Text strong>{selectedProduct.stock}</Typography.Text>
            </div>
            <div>
              <Typography.Text type="secondary">Quantity received</Typography.Text>
              <Typography.Text strong>{toNumber(receivedQuantity)}</Typography.Text>
            </div>
            <div>
              <Typography.Text type="secondary">Projected stock</Typography.Text>
              <Typography.Text strong>{projectedStock}</Typography.Text>
            </div>
          </div>
        ) : null}

        <Form.Item label="Note" name="note">
          <Input.TextArea rows={3} placeholder="Example: Initial stock receipt" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
