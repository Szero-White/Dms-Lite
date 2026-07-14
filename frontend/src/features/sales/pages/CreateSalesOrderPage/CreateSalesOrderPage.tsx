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
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { useCustomers } from '../../../customers';
import { useProducts } from '../../../products';
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
  paidAmount: number;
  items: Array<{
    productId: number;
    quantity: number;
    discountAmount?: number;
  }>;
}

export function CreateSalesOrderPage() {
  const navigate = useNavigate();
  const customersQuery = useCustomers();
  const productsQuery = useProducts();
  const createOrder = useCreateSalesOrder();
  const confirmOrder = useConfirmSalesOrder();
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [form] = Form.useForm<OrderFormValues>();

  const watchedItems = Form.useWatch('items', form) || [];
  const paidAmount = Form.useWatch('paidAmount', form) || 0;

  const subtotal = useMemo(
    () => watchedItems.reduce((sum, item) => {
      const product = productsQuery.data?.find((candidate) => candidate.id === item?.productId);

      if (!product) {
        return sum;
      }

      return sum + toNumber(product.sellingPrice) * Number(item.quantity || 0);
    }, 0),
    [productsQuery.data, watchedItems],
  );

  const discountTotal = useMemo(
    () => watchedItems.reduce((sum, item) => sum + Number(item?.discountAmount || 0), 0),
    [watchedItems],
  );

  const orderTotal = subtotal - discountTotal;
  const debtAmount = Math.max(orderTotal - Number(paidAmount || 0), 0);
  const stockWarnings = watchedItems.flatMap((item) => {
    const product = productsQuery.data?.find(
      (candidate) => candidate.id === item?.productId,
    );
    const quantity = Number(item?.quantity || 0);

    return product && quantity > product.stock
      ? [`${product.name}: requested ${quantity}, available ${product.stock}`]
      : [];
  });

  return (
    <div className={styles.page}>
      <PageHeader
        title="Create Sales Order"
        subtitle="Build a multi-line order, preview settlement, and confirm right after creation."
        breadcrumb={['Sales Orders', 'Create']}
      />

      <QueryState
        isLoading={customersQuery.isLoading || productsQuery.isLoading}
        isError={customersQuery.isError || productsQuery.isError}
        error={customersQuery.error || productsQuery.error}
        hasData={Boolean(customersQuery.data?.length && productsQuery.data?.length)}
        emptyTitle="Customer and product data required"
        emptyDescription="Create at least one customer and one active product before building a sales order."
        onRetry={() => {
          customersQuery.refetch();
          productsQuery.refetch();
        }}
      >
        <Row gutter={[16, 16]} className={styles.orderGrid}>
          <Col xs={24} xl={16}>
            <Card className={`panel-card ${styles.formCard}`} title="Order Details">
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  items: [{ quantity: 1, discountAmount: 0 }],
                  paidAmount: 0,
                }}
                onFinish={async (values) => {
                  const order = await createOrder.mutateAsync({
                    customerId: values.customerId,
                    warehouseId: 1,
                    paidAmount: Number(values.paidAmount || 0),
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
                  <Typography.Text strong>Customer & Warehouse</Typography.Text>
                  <Typography.Text type="secondary">
                    Select the customer and review the fulfillment location.
                  </Typography.Text>
                </div>

                <Form.Item
                  name="customerId"
                  label="Customer"
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder="Select customer"
                    options={(customersQuery.data ?? []).map((customer) => ({
                      value: customer.id,
                      label: `${customer.name} \u2022 Debt ${formatCurrency(customer.debtBalance)}`,
                    }))}
                  />
                </Form.Item>

                <Form.Item label="Warehouse">
                  <Select
                    disabled
                    value={1}
                    options={[{ value: 1, label: 'Main Warehouse' }]}
                  />
                </Form.Item>

                <div className={styles.formSectionHeading}>
                  <Typography.Text strong>Order Items</Typography.Text>
                  <Typography.Text type="secondary">
                    Add products, quantities and line-level discounts.
                  </Typography.Text>
                </div>

                <Form.List name="items">
                  {(fields, { add, remove }) => (
                    <Space direction="vertical" className={styles.itemsStack} size={12}>
                      {fields.map((field) => (
                        <Card
                          key={field.key}
                          size="small"
                          className={`line-item-card ${styles.lineItem}`}
                        >
                          <Row gutter={12}>
                            <Col xs={24} md={10}>
                              <Form.Item
                                {...field}
                                name={[field.name, 'productId']}
                                label="Product"
                                rules={[{ required: true }]}
                              >
                                <Select
                                  placeholder="Choose product"
                                  options={(productsQuery.data ?? []).map((product) => ({
                                    value: product.id,
                                    label: `${product.name} \u2022 ${formatCurrency(product.sellingPrice)} \u2022 Stock ${product.stock}`,
                                  }))}
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={12} md={4}>
                              <Form.Item
                                {...field}
                                name={[field.name, 'quantity']}
                                label="Qty"
                                rules={[{ required: true }]}
                              >
                                <InputNumber className={styles.fullWidth} min={1} />
                              </Form.Item>
                            </Col>
                            <Col xs={12} md={6}>
                              <Form.Item
                                {...field}
                                name={[field.name, 'discountAmount']}
                                label="Discount"
                              >
                                <InputNumber className={styles.fullWidth} min={0} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={4} className={styles.removeColumn}>
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => remove(field.name)}
                                disabled={fields.length === 1}
                              >
                                Remove
                              </Button>
                            </Col>
                          </Row>
                        </Card>
                      ))}
                      <Button icon={<PlusOutlined />} onClick={() => add({ quantity: 1, discountAmount: 0 })}>
                        Add Product
                      </Button>
                    </Space>
                  )}
                </Form.List>

                {stockWarnings.length ? (
                  <Alert
                    className={styles.stockAlert}
                    type="warning"
                    showIcon
                    message="Requested quantity exceeds current stock"
                    description={stockWarnings.join('; ')}
                  />
                ) : null}

                <div className={styles.formSectionHeading}>
                  <Typography.Text strong>Payment</Typography.Text>
                  <Typography.Text type="secondary">
                    Record the amount received now; the balance becomes debt.
                  </Typography.Text>
                </div>

                <Form.Item name="paidAmount" label="Paid Amount" className={styles.paidField}>
                  <InputNumber className={styles.fullWidth} min={0} />
                </Form.Item>

                <Space>
                  <Button onClick={() => navigate('/sales-orders')}>Back</Button>
                  <Button type="primary" htmlType="submit" loading={createOrder.isPending}>
                    Create Order
                  </Button>
                </Space>
              </Form>
            </Card>
          </Col>

          <Col xs={24} xl={8}>
            <div className={styles.summaryColumn}>
            <Card className={`panel-card ${styles.summaryCard}`} title="Order Summary">
              <Space direction="vertical" size={10} className={styles.summaryList}>
                <div className="flex-between">
                  <Typography.Text>Subtotal</Typography.Text>
                  <Typography.Text strong>{formatCurrency(subtotal)}</Typography.Text>
                </div>
                <div className="flex-between">
                  <Typography.Text>Discount</Typography.Text>
                  <Typography.Text strong>{formatCurrency(discountTotal)}</Typography.Text>
                </div>
                <div className={`${styles.summaryTotal} flex-between`}>
                  <Typography.Text>Order Total</Typography.Text>
                  <Typography.Text strong>{formatCurrency(orderTotal)}</Typography.Text>
                </div>
                <div className="flex-between">
                  <Typography.Text>Paid Amount</Typography.Text>
                  <Typography.Text strong>{formatCurrency(paidAmount)}</Typography.Text>
                </div>
                <div className="flex-between">
                  <Typography.Text>Debt Amount</Typography.Text>
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
                message={`Order #${createdOrderId} created successfully`}
                description={(
                  <Space direction="vertical">
                    <Button
                      type="primary"
                      loading={confirmOrder.isPending}
                      onClick={() => confirmOrder.mutate(createdOrderId)}
                    >
                      Confirm Order Now
                    </Button>
                    <Button onClick={() => navigate('/sales-orders')}>Back to Orders</Button>
                  </Space>
                )}
              />
            ) : null}

            <Card className="panel-card" title="Preview Lines">
              <Table
                size="small"
                pagination={false}
                rowKey={(row, index) => `${row?.productId || 'row'}-${index}`}
                dataSource={watchedItems}
                columns={[
                  {
                    title: 'Product',
                    render: (_, record) => (
                      productsQuery.data?.find((product) => product.id === record.productId)?.name || '--'
                    ),
                  },
                  { title: 'Qty', dataIndex: 'quantity' },
                  {
                    title: 'Line Total',
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
