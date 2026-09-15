import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, InputNumber, Row, Select, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../../../../../lib/format';
import type { ProductRow } from '../../../../../products';
import styles from '../../CreateSalesOrderPage.module.css';

export interface OrderItemDraft {
  productId?: number;
  quantity?: number;
  discountAmount?: number;
}

interface OrderItemsEditorProps {
  getAvailableStockForLine: (productId: number | undefined, lineIndex: number) => number;
  products: ProductRow[];
  watchedItems: OrderItemDraft[];
}

export function OrderItemsEditor({
  getAvailableStockForLine,
  products,
  watchedItems,
}: OrderItemsEditorProps) {
  const { t } = useTranslation();
  const activeProductOptions = products
    .filter((product) => product.active)
    .map((product) => ({
      value: product.id,
      label: t('sales.create.productLabel', {
        name: product.name,
        price: formatCurrency(product.sellingPrice),
        stock: product.stock,
      }),
    }));

  return (
    <>
      <div className={styles.formSectionHeading}>
        <Typography.Text strong>{t('sales.create.orderItems')}</Typography.Text>
        <Typography.Text type="secondary">
          {t('sales.create.orderItemsHint')}
        </Typography.Text>
      </div>

      <Form.List name="items">
        {(fields, { add, remove }) => (
          <Space direction="vertical" className={styles.itemsStack} size={12}>
            {fields.map((field) => {
              const selectedProduct = products.find(
                (product) => product.id === watchedItems[field.name]?.productId,
              );
              const availableStock = getAvailableStockForLine(
                selectedProduct?.id,
                field.name,
              );

              return (
                <Card
                  key={field.key}
                  size="small"
                  className={`line-item-card ${styles.lineItem}`}
                >
                  <Row gutter={[12, 12]} align="bottom">
                    <Col xs={24} xl={10}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'productId']}
                        label={t('inventory.column.product')}
                        rules={[{ required: true }]}
                      >
                        <Select
                          showSearch
                          optionFilterProp="label"
                          placeholder={t('inventory.receive.productPlaceholder')}
                          options={activeProductOptions}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={8} xl={3}>
                      <Form.Item label={t('sales.create.availableStock')}>
                        <InputNumber
                          className={styles.fullWidth}
                          value={selectedProduct ? availableStock : undefined}
                          readOnly
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={8} xl={4}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'quantity']}
                        label={t('inventory.history.qty')}
                        rules={[{ required: true }]}
                      >
                        <InputNumber
                          className={styles.fullWidth}
                          min={1}
                          max={selectedProduct ? availableStock : undefined}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={8} xl={4}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'discountAmount']}
                        label={t('sales.create.discount')}
                      >
                        <InputNumber className={styles.fullWidth} min={0} />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={8} xl={3} className={styles.removeColumn}>
                      <Button
                        danger
                        className={styles.removeButton}
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                        disabled={fields.length === 1}
                        aria-label={t('sales.create.remove')}
                      />
                    </Col>
                  </Row>
                </Card>
              );
            })}
            <Button icon={<PlusOutlined />} onClick={() => add({ quantity: 1, discountAmount: 0 })}>
              {t('sales.create.addProduct')}
            </Button>
          </Space>
        )}
      </Form.List>
    </>
  );
}
