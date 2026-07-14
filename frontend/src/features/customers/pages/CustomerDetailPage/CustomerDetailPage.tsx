import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  LeftOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { SummaryCard } from '../../../../components/common/SummaryCard';
import { SalesOrderStatusTag } from '../../../../components/common/StatusTag';
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
import styles from './CustomerDetailPage.module.css';

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
  const debt = toNumber(customer?.debtBalance);
  const creditLimit = toNumber(customer?.creditLimit);
  const availableCredit = Math.max(creditLimit - debt, 0);
  const creditUsage = creditLimit > 0 ? Math.round((debt / creditLimit) * 100) : 0;

  return (
    <div className={styles.page}>
      <PageHeader
        title={customer?.name || 'Customer Detail'}
        subtitle="Customer profile, debt statement, and order history."
        breadcrumb={['Customers', customer?.name || 'Detail']}
        extra={
          <Space wrap className={styles.headerActions}>
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
        emptyTitle="Customer not found"
        emptyDescription="This customer may no longer be available in the current dataset."
        emptyAction={<Button onClick={() => navigate('/customers')}>Back to customers</Button>}
        onRetry={() => {
          void Promise.all([
            customersQuery.refetch(),
            debtStatementQuery.refetch(),
            salesOrdersQuery.refetch(),
          ]);
        }}
      >
        {customer ? (
          <div className={styles.contentStack}>
            <Card className={`panel-card ${styles.profileCard}`}>
              <div className={styles.profileMain}>
                <Avatar className={styles.profileAvatar} size={64}>
                  {customer.name.slice(0, 2).toUpperCase()}
                </Avatar>
                <div className={styles.profileCopy}>
                  <div className={styles.profileTitleRow}>
                    <Typography.Title level={2}>{customer.name}</Typography.Title>
                    <Tag color={customer.active ? 'success' : 'default'}>
                      {customer.active ? 'ACTIVE' : 'INACTIVE'}
                    </Tag>
                  </div>
                  <Space wrap size={[20, 6]} className={styles.profileMeta}>
                    <span><PhoneOutlined /> {customer.phone || '--'}</span>
                    <span><EnvironmentOutlined /> {customer.address || '--'}</span>
                  </Space>
                </div>
              </div>
              <div className={styles.creditPanel}>
                <div>
                  <Typography.Text>Credit utilization</Typography.Text>
                  <Typography.Text strong>
                    {creditLimit > 0 ? `${creditUsage}%` : 'No credit limit'}
                  </Typography.Text>
                </div>
                <Progress
                  percent={Math.min(creditUsage, 100)}
                  showInfo={false}
                  status={creditUsage >= 100 ? 'exception' : creditUsage >= 80 ? 'normal' : 'success'}
                />
                <Typography.Text type="secondary">
                  {formatCurrency(debt)} of {formatCurrency(creditLimit)} used
                </Typography.Text>
              </div>
            </Card>

            <div className={styles.metricsGrid}>
              <SummaryCard
                title="Current Debt"
                value={formatCurrency(debt)}
                note={debt > 0 ? 'Outstanding receivable balance' : 'Customer balance is clear'}
                icon={<WalletOutlined />}
                variant={debt > 0 ? 'red' : 'green'}
                visual="dashboard"
              />
              <SummaryCard
                title="Credit Limit"
                value={formatCurrency(creditLimit)}
                note="Approved customer credit exposure"
                icon={<SafetyCertificateOutlined />}
                variant="blue"
                visual="dashboard"
              />
              <SummaryCard
                title="Available Credit"
                value={formatCurrency(availableCredit)}
                note="Remaining credit before the limit"
                icon={<CheckCircleOutlined />}
                variant="green"
                visual="dashboard"
              />
              <SummaryCard
                title="Payment Term"
                value={`${customer.paymentTermDays} days`}
                note="Configured settlement period"
                icon={<CalendarOutlined />}
                variant="orange"
                visual="dashboard"
              />
            </div>

            <Card className="panel-card" title="Debt Statement">
              <Table
                size="small"
                rowKey="id"
                sticky
                scroll={{ x: 940 }}
                locale={{ emptyText: 'No debt transactions recorded for this customer' }}
                dataSource={debtStatementQuery.data ?? []}
                columns={[
                  {
                    title: 'Date',
                    dataIndex: 'createdAt',
                    width: 170,
                    render: (value) => formatDateTime(value),
                  },
                  { title: 'Type', dataIndex: 'sourceType', width: 130 },
                  {
                    title: 'Direction',
                    dataIndex: 'direction',
                    width: 135,
                    render: (value: string) => {
                      const isIncrease = value === 'INCREASE';

                      return (
                        <Tag className={isIncrease ? styles.increaseTag : styles.decreaseTag}>
                          {isIncrease ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {value}
                        </Tag>
                      );
                    },
                  },
                  {
                    title: 'Amount',
                    dataIndex: 'amount',
                    align: 'right',
                    render: (value, record) => (
                      <Typography.Text className={record.direction === 'INCREASE'
                        ? styles.debtOutstanding
                        : styles.debtClear}
                      >
                        {formatCurrency(value)}
                      </Typography.Text>
                    ),
                  },
                  {
                    title: 'Remaining',
                    dataIndex: 'remainingAmount',
                    align: 'right',
                    render: (value) => formatCurrency(value),
                  },
                  {
                    title: 'Due Date',
                    dataIndex: 'dueDate',
                    width: 130,
                    render: (value) => value ? formatDate(value) : '--',
                  },
                  { title: 'Note', dataIndex: 'note', width: 200, ellipsis: true },
                ]}
              />
            </Card>

            <Card className="panel-card" title="Sales Order History">
              <Table
                size="small"
                rowKey="id"
                sticky
                scroll={{ x: 800 }}
                locale={{ emptyText: 'No sales orders recorded for this customer' }}
                dataSource={orderHistory}
                columns={[
                  { title: 'Code', dataIndex: 'code' },
                  {
                    title: 'Created At',
                    dataIndex: 'createdAt',
                    render: (value) => formatDateTime(value),
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    render: (value) => <SalesOrderStatusTag status={value} />,
                  },
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
          </div>
        ) : null}
      </QueryState>

      <Modal
        rootClassName={styles.modal}
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
              className={styles.fullWidth}
              min={1}
              max={toNumber(customer?.debtBalance)}
            />
          </Form.Item>
          <Form.Item name="note" label="Note">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
