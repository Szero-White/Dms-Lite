import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  LeftOutlined,
  PhoneOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
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
  Popconfirm,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import {
  PERMISSIONS,
  canViewCustomerBalance,
  canViewOrderFinancials,
  hasPermission,
  useAuth,
} from '../../../auth';
import { SummaryCard } from '../../../../components/common/SummaryCard';
import { SalesOrderStatusTag } from '../../../../components/common/StatusTag';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  toNumber,
} from '../../../../lib/format';
import {
  useCustomer,
  useCustomerDebtStatement,
  useDeactivateCustomer,
  useReactivateCustomer,
} from '../../hooks/useCustomerQueries';
import { useRecordCustomerPayment } from '../../../../features/payments';
import { useSalesOrders } from '../../../../features/sales';
import styles from './CustomerDetailPage.module.css';

export function CustomerDetailPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canRecordPayment = hasPermission(user, PERMISSIONS.PAYMENT_CREATE);
  const canChangeCustomerStatus = hasPermission(user, PERMISSIONS.CUSTOMER_DEACTIVATE);
  const canViewDebt = hasPermission(user, PERMISSIONS.DEBT_VIEW);
  const showCustomerFinancials = canViewCustomerBalance(user);
  const canViewOrders = hasPermission(user, PERMISSIONS.SALES_ORDER_VIEW);
  const showOrderFinancials = canViewOrderFinancials(user);
  const { customerId } = useParams();
  const navigate = useNavigate();
  const numericCustomerId = Number(customerId);
  const customerQuery = useCustomer(numericCustomerId);
  const salesOrdersQuery = useSalesOrders({
    customerId: numericCustomerId,
    enabled: canViewOrders && Number.isFinite(numericCustomerId),
  });
  const paymentMutation = useRecordCustomerPayment();
  const deactivateCustomer = useDeactivateCustomer();
  const reactivateCustomer = useReactivateCustomer();
  const debtStatementQuery = useCustomerDebtStatement(numericCustomerId, {
    enabled: canViewDebt && Number.isFinite(numericCustomerId),
  });
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [form] = Form.useForm<{ amount: number; note?: string }>();

  const customer = customerQuery.data;
  const orderHistory = salesOrdersQuery.data ?? [];
  const debt = toNumber(customer?.debtBalance);
  const creditLimit = toNumber(customer?.creditLimit);
  const availableCredit = Math.max(creditLimit - debt, 0);
  const creditUsage = creditLimit > 0 ? Math.round((debt / creditLimit) * 100) : 0;

  return (
    <div className={styles.page}>
      <PageHeader
        title={customer?.name || t('customers.detail.titleFallback')}
        subtitle={t('customers.detail.subtitle')}
        breadcrumb={[t('app.navigation.customers'), customer?.name || t('customers.detail.breadcrumbDetail')]}
        extra={
          <Space wrap className={styles.headerActions}>
            <Button icon={<LeftOutlined />} onClick={() => navigate('/customers')}>
              {t('customers.detail.back')}
            </Button>
            {canChangeCustomerStatus && customer ? (
              customer.active ? (
                <Popconfirm
                  title={t('customers.deactivate.title')}
                  description={t('customers.deactivate.description')}
                  okText={t('customers.action.deactivate')}
                  okButtonProps={{ danger: true }}
                  onConfirm={() => deactivateCustomer.mutate(customer.id)}
                >
                  <Button
                    danger
                    icon={<StopOutlined />}
                    loading={deactivateCustomer.isPending}
                  >
                    {t('customers.action.deactivate')}
                  </Button>
                </Popconfirm>
              ) : (
                <Button
                  icon={<PlayCircleOutlined />}
                  loading={reactivateCustomer.isPending}
                  onClick={() => reactivateCustomer.mutate(customer.id)}
                >
                  {t('customers.action.reactivate')}
                </Button>
              )
            ) : null}
            {canRecordPayment ? (
              <Button
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => setPaymentOpen(true)}
                disabled={!customer}
              >
                {t('payments.recordPayment')}
              </Button>
            ) : null}
          </Space>
        }
      />

      <QueryState
        isLoading={
          customerQuery.isLoading ||
          (canViewDebt && debtStatementQuery.isLoading) ||
          (canViewOrders && salesOrdersQuery.isLoading)
        }
        isError={
          customerQuery.isError ||
          (canViewDebt && debtStatementQuery.isError) ||
          (canViewOrders && salesOrdersQuery.isError)
        }
        error={
          customerQuery.error ||
          (canViewDebt ? debtStatementQuery.error : null) ||
          (canViewOrders ? salesOrdersQuery.error : null)
        }
        hasData={Boolean(customer)}
        emptyTitle={t('customers.detail.notFoundTitle')}
        emptyDescription={t('customers.detail.notFoundDescription')}
        emptyAction={<Button onClick={() => navigate('/customers')}>{t('customers.detail.backToCustomers')}</Button>}
        onRetry={() => {
          void Promise.all([
            customerQuery.refetch(),
            canViewDebt ? debtStatementQuery.refetch() : Promise.resolve(),
            canViewOrders ? salesOrdersQuery.refetch() : Promise.resolve(),
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
                      {customer.active ? t('common.active') : t('common.inactive')}
                    </Tag>
                  </div>
                  <Space wrap size={[20, 6]} className={styles.profileMeta}>
                    <span><PhoneOutlined /> {customer.phone || '--'}</span>
                    <span><EnvironmentOutlined /> {customer.address || '--'}</span>
                  </Space>
                </div>
              </div>
              {showCustomerFinancials ? (
                <div className={styles.creditPanel}>
                  <div>
                    <Typography.Text>{t('customers.detail.creditUtilization')}</Typography.Text>
                    <Typography.Text strong>
                      {creditLimit > 0 ? `${creditUsage}%` : t('customers.detail.noCreditLimit')}
                    </Typography.Text>
                  </div>
                  <Progress
                    percent={Math.min(creditUsage, 100)}
                    showInfo={false}
                    status={creditUsage >= 100 ? 'exception' : creditUsage >= 80 ? 'normal' : 'success'}
                  />
                  <Typography.Text type="secondary">
                    {t('customers.detail.creditUsed', { debt: formatCurrency(debt), limit: formatCurrency(creditLimit) })}
                  </Typography.Text>
                </div>
              ) : null}
            </Card>

            <div className={styles.metricsGrid}>
              {showCustomerFinancials ? (
                <SummaryCard
                  title={t('customers.detail.currentDebt')}
                  value={formatCurrency(debt)}
                  note={debt > 0 ? t('customers.detail.outstandingReceivableBalance') : t('customers.detail.balanceClear')}
                  icon={<WalletOutlined />}
                  variant={debt > 0 ? 'red' : 'green'}
                  visual="dashboard"
                />
              ) : null}
              <SummaryCard
                title={t('customers.detail.creditLimit')}
                value={formatCurrency(creditLimit)}
                note={t('customers.detail.approvedCreditExposure')}
                icon={<SafetyCertificateOutlined />}
                variant="blue"
                visual="dashboard"
              />
              {showCustomerFinancials ? (
                <SummaryCard
                  title={t('customers.detail.availableCredit')}
                  value={formatCurrency(availableCredit)}
                  note={t('customers.detail.remainingCredit')}
                  icon={<CheckCircleOutlined />}
                  variant="green"
                  visual="dashboard"
                />
              ) : null}
              <SummaryCard
                title={t('customers.detail.paymentTerm')}
                value={t('customers.paymentTermDays', { count: customer.paymentTermDays })}
                note={t('customers.detail.settlementPeriod')}
                icon={<CalendarOutlined />}
                variant="orange"
                visual="dashboard"
              />
            </div>

            {canViewDebt ? (
              <Card className="panel-card" title={t('customers.detail.debtStatement')}>
              <Table
                size="small"
                rowKey="id"
                scroll={{ x: 940 }}
                locale={{ emptyText: t('customers.detail.noDebtTransactions') }}
                dataSource={debtStatementQuery.data ?? []}
                columns={[
                  {
                    title: t('customers.detail.date'),
                    dataIndex: 'createdAt',
                    width: 170,
                    render: (value) => formatDateTime(value),
                  },
                  { title: t('customers.detail.type'), dataIndex: 'sourceType', width: 130, render: (value: string) => t(`customers.detail.sourceType.${value}`, { defaultValue: t('customers.detail.sourceType.UNKNOWN') }) },
                  {
                    title: t('customers.detail.reference'),
                    dataIndex: 'sourceCode',
                    width: 190,
                    render: (value: string | null | undefined) => value || '--',
                  },
                  {
                    title: t('customers.detail.direction'),
                    dataIndex: 'direction',
                    width: 135,
                    render: (value: string) => {
                      const isIncrease = value === 'INCREASE';

                      return (
                        <Tag className={isIncrease ? styles.increaseTag : styles.decreaseTag}>
                          {isIncrease ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {t(`customers.detail.directionValue.${value}`, { defaultValue: t('customers.detail.directionValue.UNKNOWN') })}
                        </Tag>
                      );
                    },
                  },
                  {
                    title: t('customers.detail.amount'),
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
                    title: t('customers.detail.remaining'),
                    dataIndex: 'remainingAmount',
                    align: 'right',
                    render: (value, record) => record.direction === 'INCREASE'
                      ? formatCurrency(value)
                      : '--',
                  },
                  {
                    title: t('customers.detail.dueDate'),
                    dataIndex: 'dueDate',
                    width: 130,
                    render: (value) => value ? formatDate(value) : '--',
                  },
                  { title: t('inventory.history.note'), dataIndex: 'note', width: 200, ellipsis: true },
                ]}
              />
              </Card>
            ) : null}

            {canViewOrders ? (
              <Card className="panel-card" title={t('customers.detail.salesOrderHistory')}>
              <Table
                size="small"
                rowKey="id"
                scroll={{ x: 800 }}
                locale={{ emptyText: t('customers.detail.noSalesOrders') }}
                dataSource={orderHistory}
                columns={[
                  { title: t('customers.detail.code'), dataIndex: 'code' },
                  {
                    title: t('customers.detail.createdAt'),
                    dataIndex: 'createdAt',
                    render: (value) => formatDateTime(value),
                  },
                  {
                    title: t('common.status'),
                    dataIndex: 'status',
                    render: (value) => <SalesOrderStatusTag status={value} />,
                  },
                  ...(showOrderFinancials ? [
                    {
                      title: t('sales.column.total'),
                      dataIndex: 'totalAmount',
                      render: (value: string | number | null) => formatCurrency(value),
                    },
                    {
                      title: t('sales.column.paid'),
                      dataIndex: 'paidAmount',
                      render: (_: string | number | null, order) => order.status === 'COMPLETED'
                        ? formatCurrency(order.paidAmount)
                        : t('sales.financial.notApplicable'),
                    },
                    {
                      title: t('sales.column.debt'),
                      dataIndex: 'debtAmount',
                      render: (_: string | number | null, order) => {
                        if (order.status === 'COMPLETED') {
                          return formatCurrency(order.debtAmount);
                        }

                        return order.status === 'DRAFT'
                          ? t('sales.financial.projectedReceivable', { amount: formatCurrency(order.totalAmount) })
                          : t('sales.financial.notIncurred');
                      },
                    },
                  ] : []),
                ]}
              />
              </Card>
            ) : null}
          </div>
        ) : null}
      </QueryState>

      {canRecordPayment ? (
        <Modal
          rootClassName={styles.modal}
          title={t('payments.recordPayment')}
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
            <Form.Item label={t('customers.column.customer')}>
              <Input value={customer?.name} disabled />
            </Form.Item>
            <Form.Item name="amount" label={t('payments.amount')} rules={[{ required: true }]}>
              <InputNumber
                className={styles.fullWidth}
                min={1}
                max={toNumber(customer?.debtBalance)}
              />
            </Form.Item>
            <Form.Item name="note" label={t('inventory.receive.note')}>
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        </Modal>
      ) : null}
    </div>
  );
}