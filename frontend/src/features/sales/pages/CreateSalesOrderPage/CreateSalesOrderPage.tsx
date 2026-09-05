import { useTranslation } from 'react-i18next';
import {
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { PERMISSIONS, firstAuthorizedPath, hasPermission, useAuth } from '../../../auth';
import { useCustomers } from '../../../customers';
import { useProducts } from '../../../products';
import { useDefaultWarehouse } from '../../../inventory';
import {
  formatCurrency,
  toNumber,
} from '../../../../lib/format';
import {
  useConfirmSalesOrder,
  useCreateSalesOrder,
} from '../../hooks/useSalesQueries';
import styles from './CreateSalesOrderPage.module.css';

interface OrderFormValues {
  customerId: number;
  warehouseId: number;
  items: Array<{
    productId: number;
    quantity: number;
    discountAmount?: number;
  }>;
}

export function CreateSalesOrderPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canConfirmSalesOrder = hasPermission(user, PERMISSIONS.SALES_ORDER_CONFIRM);
  const canViewSalesOrders = hasPermission(user, PERMISSIONS.SALES_ORDER_VIEW);
  const fallbackPath = firstAuthorizedPath(user);
  const navigate = useNavigate();
  const customersQuery = useCustomers();
  const productsQuery = useProducts();
  const warehouseQuery = useDefaultWarehouse();
  const createOrder = useCreateSalesOrder();
  const confirmOrder = useConfirmSalesOrder();
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [form] = Form.useForm<OrderFormValues>();

  const watchedItems = Form.useWatch('items', form) || [];

  useEffect(() => {
    if (warehouseQuery.data?.id && !form.getFieldValue('warehouseId')) {
      form.setFieldValue('warehouseId', warehouseQuery.data.id);
    }
  }, [form, warehouseQuery.data?.id]);

  const subtotal = useMemo(
    () => watchedItems.reduce((sum, item) => {
      const product = productsQuery.data?.find((candidate) => candidate.id === item?.productId);

      if (!product) {
        return sum;
      }

      return sum + toNumber(product.sellingPrice) * Number(item.quantity || 0);
    }, 0),
    [productsQuery.data, t, watchedItems],
  );

  const discountTotal = useMemo(
    () => watchedItems.reduce((sum, item) => sum + Number(item?.discountAmount || 0), 0),
    [watchedItems],
  );

  const orderTotal = subtotal - discountTotal;
  const debtAmount = Math.max(orderTotal, 0);
  const stockWarnings = watchedItems.flatMap((item) => {
    const product = productsQuery.data?.find(
      (candidate) => candidate.id === item?.productId,
    );
    const quantity = Number(item?.quantity || 0);

    return product && quantity > product.stock
      ? [t('sales.create.stockWarningItem', { name: product.name, quantity, stock: product.stock })]
      : [];
  });

  function getAvailableStockForLine(productId: number | undefined, lineIndex: number) {
    if (!productId) {
      return 0;
    }

    const product = productsQuery.data?.find((candidate) => candidate.id === productId);
    if (!product) {
      return 0;
    }

    const reservedByOtherLines = watchedItems.reduce((sum, item, index) => {
      if (index === lineIndex || item?.productId !== productId) {
        return sum;
      }

      return sum + Number(item.quantity || 0);
    }, 0);

    return Math.max(product.stock - reservedByOtherLines, 0);
  }
  return (
    <div className={styles.page}>
      <PageHeader
        title={t('sales.create.title')}
        subtitle={t('sales.create.subtitle')}
        breadcrumb={[t('sales.create.breadcrumbSalesOrders'), t('sales.create.breadcrumbCreate')]}
      />

      <QueryState
        isLoading={customersQuery.isLoading || productsQuery.isLoading || warehouseQuery.isLoading}
        isError={customersQuery.isError || productsQuery.isError || warehouseQuery.isError}
        error={customersQuery.error || productsQuery.error || warehouseQuery.error}
        hasData={Boolean(
          customersQuery.data?.length && productsQuery.data?.length && warehouseQuery.data,
        )}
        emptyTitle={t('sales.create.title')}
        emptyDescription={t('sales.create.emptyDescription')}
        onRetry={() => {
          customersQuery.refetch();
          productsQuery.refetch();
          warehouseQuery.refetch();
        }}
      >
        <Row gutter={[16, 16]} className={styles.orderGrid}>
          <Col xs={24} xl={16}>
            <Card className={`panel-card ${styles.formCard}`} title={t('sales.create.title')}>
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  items: [{ quantity: 1, discountAmount: 0 }],
                }}
                onFinish={async (values) => {
                  const order = await createOrder.mutateAsync({
                    customerId: values.customerId,
                    warehouseId: values.warehouseId,
                    items: (values.items || []).map((item) => ({
                      productId: item.productId,
                      quantity: Number(item.quantity),
                      discountAmount: Number(item.discountAmount || 0),
                    })),
                  });

                  setCreatedOrderId(order.id);
                }}
              >
                <div className={styles.formSectionHeading}>
                  <Typography.Text strong>{t('sales.create.customerWarehouse')}</Typography.Text>
                  <Typography.Text type="secondary">
                    {t('sales.create.customerWarehouseHint')}
                  </Typography.Text>
                </div>

                <Form.Item
                  name="customerId"
                  label={t('customers.column.customer')}
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder={t('payments.customerPlaceholder')}
                    options={(customersQuery.data ?? []).map((customer) => ({
                      value: customer.id,
                      label: t('sales.create.customerDebtLabel', { name: customer.name, debt: formatCurrency(customer.debtBalance) }),
                    }))}
                  />
                </Form.Item>

                <Form.Item
                  name="warehouseId"
                  label={t('sales.drawer.warehouse')}
                  rules={[{ required: true }]}
                >
                  <Select
                    disabled
                    options={warehouseQuery.data
                      ? [{ value: warehouseQuery.data.id, label: warehouseQuery.data.name }]
                      : []}
                  />
                </Form.Item>

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
                        const selectedProduct = productsQuery.data?.find(
                          (product) => product.id === watchedItems[field.name]?.productId,
                        );
                        const availableStock = getAvailableStockForLine(selectedProduct?.id, field.name);

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
                                    placeholder={t('inventory.receive.productPlaceholder')}
                                    options={(productsQuery.data ?? []).map((product) => ({
                                      value: product.id,
                                      label: t('sales.create.productLabel', { name: product.name, price: formatCurrency(product.sellingPrice), stock: product.stock }),
                                    }))}
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

                {stockWarnings.length ? (
                  <Alert
                    className={styles.stockAlert}
                    type="warning"
                    showIcon
                    message={t('sales.create.stockWarningTitle')}
                    description={stockWarnings.join('; ')}
                  />
                ) : null}

                <Space>
                  <Button onClick={() => navigate(canViewSalesOrders ? '/sales-orders' : fallbackPath)}>{t('sales.create.back')}</Button>
                  <Button type="primary" htmlType="submit" loading={createOrder.isPending}>
                    {t('sales.action.createOrder')}
                  </Button>
                </Space>
              </Form>
            </Card>
          </Col>

          <Col xs={24} xl={8}>
            <div className={styles.summaryColumn}>
            <Card className={`panel-card ${styles.summaryCard}`} title={t('sales.create.title')}>
              <Space direction="vertical" size={10} className={styles.summaryList}>
                <div className="flex-between">
                  <Typography.Text>{t('sales.create.subtotal')}</Typography.Text>
                  <Typography.Text strong>{formatCurrency(subtotal)}</Typography.Text>
                </div>
                <div className="flex-between">
                  <Typography.Text>{t('sales.create.discount')}</Typography.Text>
                  <Typography.Text strong>{formatCurrency(discountTotal)}</Typography.Text>
                </div>
                <div className={`${styles.summaryTotal} flex-between`}>
                  <Typography.Text>{t('sales.create.orderTotal')}</Typography.Text>
                  <Typography.Text strong>{formatCurrency(orderTotal)}</Typography.Text>
                </div>
                <div className="flex-between">
                  <Typography.Text>{t('sales.create.debtAmount')}</Typography.Text>
                  <Typography.Text
                    strong
                    className={debtAmount > 0 ? styles.debtAmount : undefined}
                  >
                    {formatCurrency(debtAmount)}
                  </Typography.Text>
                </div>
              </Space>
            </Card>

            {createdOrderId ? (
              <Alert
                className={styles.successAlert}
                type="success"
                showIcon
                message={t('sales.create.createdSuccess', { id: createdOrderId })}
                description={(
                  <Space direction="vertical">
                    {canConfirmSalesOrder ? (
                      <Button
                        type="primary"
                        loading={confirmOrder.isPending}
                        onClick={() => confirmOrder.mutate(createdOrderId)}
                      >
                        {t('sales.create.confirmNow')}
                      </Button>
                    ) : null}
                    {canViewSalesOrders ? (
                      <Button onClick={() => navigate('/sales-orders')}>{t('sales.create.backToOrders')}</Button>
                    ) : null}
                  </Space>
                )}
              />
            ) : null}

            <Card className="panel-card" title={t('sales.create.title')}>
              <Table
                size="small"
                pagination={false}
                rowKey={(row, index) => `${row?.productId || 'row'}-${index}`}
                dataSource={watchedItems}
                columns={[
                  {
                    title: t('inventory.column.product'),
                    render: (_, record) => (
                      productsQuery.data?.find((product) => product.id === record.productId)?.name || '--'
                    ),
                  },
                  { title: t('inventory.history.qty'), dataIndex: 'quantity' },
                  {
                    title: t('sales.create.availableStock'),
                    render: (_, record, index) => (
                      record.productId ? getAvailableStockForLine(record.productId, index) : '--'
                    ),
                  },
                  {
                    title: t('sales.drawer.lineTotal'),
                    render: (_, record) => {
                      const product = productsQuery.data?.find(
                        (candidate) => candidate.id === record.productId,
                      );
                      const total =
                        toNumber(product?.sellingPrice) * Number(record.quantity || 0) -
                        Number(record.discountAmount || 0);

                      return formatCurrency(total);
                    },
                  },
                ]}
              />
            </Card>
            </div>
          </Col>
        </Row>
      </QueryState>
    </div>
  );
}
