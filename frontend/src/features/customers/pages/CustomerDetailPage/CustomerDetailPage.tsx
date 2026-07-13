import { DollarOutlined, LeftOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Table,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  toNumber,
} from '../../../../lib/format';
import {
  useCustomers,
  useCustomerDebtStatement,
} from '../../hooks/useCustomerQueries';
import { useRecordCustomerPayment } from '../../../../features/payments';
import { useSalesOrders } from '../../../../features/sales';

export function CustomerDetailPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const customersQuery = useCustomers();
  const salesOrdersQuery = useSalesOrders();
  const paymentMutation = useRecordCustomerPayment();
  const debtStatementQuery = useCustomerDebtStatement(Number(customerId));
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [form] = Form.useForm<{ amount: number; note?: string }>();

  const customer = useMemo(
    () => customersQuery.data?.find((item) => String(item.id) === customerId),
    [customerId, customersQuery.data],
  );
  const orderHistory = useMemo(
    () =>
      (salesOrdersQuery.data ?? []).filter(
        (order) => String(order.customerId) === customerId,
      ),
    [customerId, salesOrdersQuery.data],
  );

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title={customer?.name || 'Customer Detail'}
        subtitle="Customer profile, debt statement, and order history."
        breadcrumb={['Customers', customer?.name || 'Detail']}
        extra={
          <Space>
            <Button icon={<LeftOutlined />} onClick={() => navigate('/customers')}>
              Back
            </Button>
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => setPaymentOpen(true)}
              disabled={!customer}
            >
              Record Payment
            </Button>
          </Space>
        }
      />

      <QueryState
        isLoading={
          customersQuery.isLoading ||
          debtStatementQuery.isLoading ||
          salesOrdersQuery.isLoading
        }
        isError={
          customersQuery.isError ||
          debtStatementQuery.isError ||
          salesOrdersQuery.isError
        }
        error={
          customersQuery.error ||
          debtStatementQuery.error ||
          salesOrdersQuery.error
        }
        hasData={Boolean(customer)}
      >
        {customer ? (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={10}>
                <Card className="panel-card" title="Customer Information">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Phone">
                      {customer.phone || '--'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Address">
                      {customer.address || '--'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Credit Limit">
                      {formatCurrency(customer.creditLimit)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Term">
                      {customer.paymentTermDays} days
                    </Descriptions.Item>
                    <Descriptions.Item label="Current Debt">
                      <Typography.Text
                        style={{
                          color:
                            toNumber(customer.debtBalance) > 0
                              ? '#cf1322'
                              : '#389e0d',
                        }}
                      >
                        {formatCurrency(customer.debtBalance)}
                      </Typography.Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col xs={24} xl={14}>
                <Card className="panel-card" title="Debt Statement">
                  <Table
                    size="small"
                    rowKey="id"
                    pagination={false}
                    dataSource={debtStatementQuery.data ?? []}
                    columns={[
                      {
                        title: 'Date',
                        dataIndex: 'createdAt',
                        render: (value) => formatDateTime(value),
                      },
                      { title: 'Type', dataIndex: 'sourceType' },
                      { title: 'Direction', dataIndex: 'direction' },
                      {
                        title: 'Amount',
                        dataIndex: 'amount',
                        render: (value) => formatCurrency(value),
                      },
                      {
                        title: 'Remaining',
                        dataIndex: 'remainingAmount',
                        render: (value) => formatCurrency(value),
                      },
                      {
                        title: 'Due Date',
                        dataIndex: 'dueDate',
                        render: (value) => formatDate(value),
                      },
                      { title: 'Note', dataIndex: 'note' },
                    ]}
                  />
                </Card>
              </Col>
            </Row>

            <Card className="panel-card" title="Sales Order History">
              <Table
                rowKey="id"
                dataSource={orderHistory}
                columns={[
                  { title: 'Code', dataIndex: 'code' },
                  {
                    title: 'Created At',
                    dataIndex: 'createdAt',
                    render: (value) => formatDateTime(value),
                  },
                  { title: 'Status', dataIndex: 'status' },
                  {
                    title: 'Total',
                    dataIndex: 'totalAmount',
                    render: (value) => formatCurrency(value),
                  },
                  {
                    title: 'Paid',
                    dataIndex: 'paidAmount',
                    render: (value) => formatCurrency(value),
                  },
                  {
                    title: 'Debt',
                    dataIndex: 'debtAmount',
                    render: (value) => formatCurrency(value),
                  },
                ]}
              />
            </Card>
          </>
        ) : null}
      </QueryState>

      <Modal
        title="Record Payment"
        open={paymentOpen}
        confirmLoading={paymentMutation.isPending}
        onCancel={() => setPaymentOpen(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            if (!customer) {
              return;
            }

            await paymentMutation.mutateAsync({
              customerId: customer.id,
              amount: values.amount,
              note: values.note,
            });
            form.resetFields();
            setPaymentOpen(false);
          }}
        >
          <Form.Item label="Customer">
            <Input value={customer?.name} disabled />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={toNumber(customer?.debtBalance)}
            />
          </Form.Item>
          <Form.Item name="note" label="Note">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
