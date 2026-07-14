import { Button, Drawer, Form, Input, InputNumber, Typography } from 'antd';
import { ProductFormValues, ProductRow } from '../../types/product.types';
import styles from './ProductFormDrawer.module.css';

interface ProductFormDrawerProps {
  open: boolean;
  product?: ProductRow | null;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
  submitting: boolean;
}

export function ProductFormDrawer({
  open,
  product,
  onClose,
  onSubmit,
  submitting,
}: ProductFormDrawerProps) {
  const [form] = Form.useForm<ProductFormValues>();

  return (
    <Drawer
      title={product ? 'Edit Product' : 'Create Product'}
      width={420}
      rootClassName={styles.drawer}
      open={open}
      onClose={onClose}
      afterOpenChange={(visible) => {
        if (visible) {
          form.setFieldsValue(
            product
              ? {
                  name: product.name,
                  sku: product.sku,
                  barcode: product.barcode,
                  costPrice: Number(product.costPrice),
                  sellingPrice: Number(product.sellingPrice),
                  minStock: product.minStock,
                }
              : {
                  minStock: 0,
                  costPrice: 0,
                  sellingPrice: 0,
                },
          );
        } else {
          form.resetFields();
        }
      }}
      footer={
        <div className={styles.footer}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={() => form.submit()}
          >
            Save
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <div className={styles.sectionHeading}>
          <Typography.Text strong>Product Identity</Typography.Text>
          <Typography.Text type="secondary">Catalog code and customer-facing information</Typography.Text>
        </div>
        <Form.Item
          label="SKU"
          name="sku"
          rules={[{ required: true, message: 'SKU is required' }]}
        >
          <Input placeholder="Ex: WATER-24" />
        </Form.Item>
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: 'Name is required' }]}
        >
          <Input placeholder="Product name" />
        </Form.Item>
        <Form.Item label="Barcode" name="barcode">
          <Input placeholder="Optional barcode" />
        </Form.Item>

        <div className={styles.sectionHeading}>
          <Typography.Text strong>Pricing & Stock Policy</Typography.Text>
          <Typography.Text type="secondary">Commercial value and replenishment threshold</Typography.Text>
        </div>
        <Form.Item
          label="Cost Price"
          name="costPrice"
          rules={[{ required: true, message: 'Cost price is required' }]}
        >
          <InputNumber className={styles.fullWidth} min={0} />
        </Form.Item>
        <Form.Item
          label="Selling Price"
          name="sellingPrice"
          rules={[{ required: true, message: 'Selling price is required' }]}
        >
          <InputNumber className={styles.fullWidth} min={0} />
        </Form.Item>
        <Form.Item
          label="Minimum Stock"
          name="minStock"
          rules={[{ required: true, message: 'Minimum stock is required' }]}
        >
          <InputNumber className={styles.fullWidth} min={0} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
