import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Form, InputNumber, Row, Select, Space, Table, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { QueryState } from '../../components/common/QueryState';
import { useCustomers } from '../../features/customers';
import { useProducts } from '../../features/products';
import { useConfirmSalesOrder, useCreateSalesOrder } from '../../hooks/useAppQueries';
import { formatCurrency, toNumber } from '../../lib/format';

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
    () =>
      watchedItems.reduce((sum, item) => {
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

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title="Create Sales Order"
        subtitle="Build a multi-line order, preview settlement, and confirm right after creation."
        breadcrumb={['Sales Orders', 'Create']}
      />

      <QueryState isLoading={customersQuery.isLoading || productsQuery.isLoading} isError={customersQuery.isError || productsQuery.isError} error={customersQuery.error || productsQuery.error} hasData={Boolean(customersQuery.data?.length && productsQuery.data?.length)}>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <Card className="panel-card">
              <Form
                form={form}
                layout="vertical"
                initialValues={{ items: [{ quantity: 1, discountAmount: 0 }], paidAmount: 0 }}
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
                <Form.Item name="customerId" label="Customer" rules={[{ required: true }]}>
                  <Select
                    placeholder="Select customer"
                    options={(customersQuery.data ?? []).map((customer) => ({
                      value: customer.id,
                      label: `${customer.name} • Debt ${formatCurrency(customer.debtBalance)}`,
                    }))}
                  />
                </Form.Item>

                <Form.List name="items">
                  {(fields, { add, remove }) => (
                    <Space direction="vertical" style={{ width: '100%' }} size={16}>
                      {fields.map((field) => (
                        <Card key={field.key} size="small" className="line-item-card">
                          <Row gutter={12}>
                            <Col xs={24} md={10}>
                              <Form.Item {...field} name={[field.name, 'productId']} label="Product" rules={[{ required: true }]}>
                                <Select
                                  placeholder="Choose product"
                                  options={(productsQuery.data ?? []).map((product) => ({
                                    value: product.id,
                                    label: `${product.name} • ${formatCurrency(product.sellingPrice)} • Stock ${product.stock}`,
                                  }))}
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={12} md={4}>
                              <Form.Item {...field} name={[field.name, 'quantity']} label="Qty" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={1} />
                              </Form.Item>
                            </Col>
                            <Col xs={12} md={6}>
                              <Form.Item {...field} name={[field.name, 'discountAmount']} label="Discount">
                                <InputNumber style={{ width: '100%' }} min={0} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={4} style={{ display: 'flex', alignItems: 'end' }}>
                              <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} disabled={fields.length === 1}>
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

                <Form.Item name="paidAmount" label="Paid Amount" style={{ marginTop: 16 }}>
                  <InputNumber style={{ width: '100%' }} min={0} />
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
            <Card className="panel-card" title="Order Summary">
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div className="flex-between"><Typography.Text>Subtotal</Typography.Text><Typography.Text strong>{formatCurrency(subtotal)}</Typography.Text></div>
                <div className="flex-between"><Typography.Text>Discount</Typography.Text><Typography.Text strong>{formatCurrency(discountTotal)}</Typography.Text></div>
                <div className="flex-between"><Typography.Text>Paid Amount</Typography.Text><Typography.Text strong>{formatCurrency(paidAmount)}</Typography.Text></div>
                <div className="flex-between"><Typography.Text>Debt Amount</Typography.Text><Typography.Text strong style={{ color: debtAmount > 0 ? '#cf1322' : undefined }}>{formatCurrency(debtAmount)}</Typography.Text></div>
              </Space>
            </Card>

            {createdOrderId ? (
              <Alert
                type="success"
                showIcon
                message={`Order #${createdOrderId} created successfully`}
                description={
                  <Space direction="vertical">
                    <Button type="primary" loading={confirmOrder.isPending} onClick={() => confirmOrder.mutate(createdOrderId)}>
                      Confirm Order Now
                    </Button>
                    <Button onClick={() => navigate('/sales-orders')}>Back to Orders</Button>
                  </Space>
                }
              />
            ) : null}

            <Card className="panel-card" title="Preview Lines" style={{ marginTop: 16 }}>
              <Table
                size="small"
                pagination={false}
                rowKey={(row, index) => `${row?.productId || 'row'}-${index}`}
                dataSource={watchedItems}
                columns={[
                  {
                    title: 'Product',
                    render: (_, record) => productsQuery.data?.find((product) => product.id === record.productId)?.name || '--',
                  },
                  { title: 'Qty', dataIndex: 'quantity' },
                  {
                    title: 'Line Total',
                    render: (_, record) => {
                      const product = productsQuery.data?.find((candidate) => candidate.id === record.productId);
                      const total = toNumber(product?.sellingPrice) * Number(record.quantity || 0) - Number(record.discountAmount || 0);
                      return formatCurrency(total);
                    },
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </QueryState>
    </Space>
  );
}
