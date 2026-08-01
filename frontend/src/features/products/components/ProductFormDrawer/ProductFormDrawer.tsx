import { Button, Drawer, Form, Input, InputNumber, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <Drawer
      title={product ? t('products.form.editTitle') : t('products.form.createTitle')}
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
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={() => form.submit()}
          >
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <div className={styles.sectionHeading}>
          <Typography.Text strong>{t('products.form.identityTitle')}</Typography.Text>
          <Typography.Text type="secondary">
            {t('products.form.identitySubtitle')}
          </Typography.Text>
        </div>
        <Form.Item
          label={t('products.form.sku')}
          name="sku"
          rules={[{ required: true, message: t('products.form.skuRequired') }]}
        >
          <Input placeholder={t('products.form.skuPlaceholder')} />
        </Form.Item>
        <Form.Item
          label={t('products.form.name')}
          name="name"
          rules={[{ required: true, message: t('products.form.nameRequired') }]}
        >
          <Input placeholder={t('products.form.namePlaceholder')} />
        </Form.Item>
        <Form.Item label={t('products.form.barcode')} name="barcode">
          <Input placeholder={t('products.form.barcodePlaceholder')} />
        </Form.Item>

        <div className={styles.sectionHeading}>
          <Typography.Text strong>{t('products.form.pricingTitle')}</Typography.Text>
          <Typography.Text type="secondary">
            {t('products.form.pricingSubtitle')}
          </Typography.Text>
        </div>
        <Form.Item
          label={t('products.form.costPrice')}
          name="costPrice"
          rules={[{ required: true, message: t('products.form.costPriceRequired') }]}
        >
          <InputNumber className={styles.fullWidth} min={0} />
        </Form.Item>
        <Form.Item
          label={t('products.form.sellingPrice')}
          name="sellingPrice"
          rules={[{ required: true, message: t('products.form.sellingPriceRequired') }]}
        >
          <InputNumber className={styles.fullWidth} min={0} />
        </Form.Item>
        <Form.Item
          label={t('products.form.minimumStock')}
          name="minStock"
          rules={[{ required: true, message: t('products.form.minimumStockRequired') }]}
        >
          <InputNumber className={styles.fullWidth} min={0} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}