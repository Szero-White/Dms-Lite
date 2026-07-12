import { Button, Drawer, Form, Input, InputNumber, Space } from 'antd';
import { ProductFormValues, ProductRow } from '../../types/product.types';

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
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={() => form.submit()}
          >
            Save
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
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
        <Form.Item label="Cost Price" name="costPrice" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item
          label="Selling Price"
          name="sellingPrice"
          rules={[{ required: true }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item
          label="Minimum Stock"
          name="minStock"
          rules={[{ required: true }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
