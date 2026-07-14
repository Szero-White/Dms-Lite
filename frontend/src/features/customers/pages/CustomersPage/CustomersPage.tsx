import {
  CheckCircleOutlined,
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  WarningOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { SummaryCard } from '../../../../components/common/SummaryCard';
import { CustomerDebtTag } from '../../../../components/common/StatusTag';
import { formatCurrency, toNumber } from '../../../../lib/format';
import {
  useCreateCustomer,
  useCustomers,
} from '../../hooks/useCustomerQueries';
import { CustomerFormValues } from '../../types/customer.types';
import styles from './CustomersPage.module.css';

export function CustomersPage() {
  const customersQuery = useCustomers();
  const createCustomer = useCreateCustomer();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [debtFilter, setDebtFilter] = useState<'ALL' | 'WITH_DEBT' | 'CLEAR'>('ALL');
  const [creditFilter, setCreditFilter] = useState<'ALL' | 'NEAR_LIMIT' | 'OVER_LIMIT'>('ALL');
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<CustomerFormValues>();

  const filteredCustomers = useMemo(
    () =>
      (customersQuery.data ?? []).filter((customer) => {
        const matchesKeyword = [customer.name, customer.phone, customer.address].some((value) =>
          value?.toLowerCase().includes(keyword.toLowerCase()),
        );
        const debt = toNumber(customer.debtBalance);
        const creditLimit = toNumber(customer.creditLimit);
        const creditUsage = creditLimit > 0 ? debt / creditLimit : 0;
        const matchesActive = activeFilter === 'ALL' ||
          (activeFilter === 'ACTIVE' && customer.active) ||
          (activeFilter === 'INACTIVE' && !customer.active);
        const matchesDebt = debtFilter === 'ALL' ||
          (debtFilter === 'WITH_DEBT' && debt > 0) ||
          (debtFilter === 'CLEAR' && debt <= 0);
        const matchesCredit = creditFilter === 'ALL' ||
          (creditFilter === 'NEAR_LIMIT' && creditLimit > 0 && creditUsage >= 0.8) ||
          (creditFilter === 'OVER_LIMIT' && creditLimit > 0 && creditUsage > 1);

        return matchesKeyword && matchesActive && matchesDebt && matchesCredit;
      }),
    [activeFilter, creditFilter, customersQuery.data, debtFilter, keyword],
  );
  const customers = customersQuery.data ?? [];
  const totalReceivables = customers.reduce(
    (total, customer) => total + toNumber(customer.debtBalance),
    0,
  );
  const thresholdCustomers = customers.filter((customer) => {
    const limit = toNumber(customer.creditLimit);

    return limit > 0 && toNumber(customer.debtBalance) / limit >= 0.8;
  }).length;
  const hasFilters = Boolean(
    keyword || activeFilter !== 'ALL' || debtFilter !== 'ALL' || creditFilter !== 'ALL',
  );

  function clearFilters() {
    setKeyword('');
    setActiveFilter('ALL');
    setDebtFilter('ALL');
    setCreditFilter('ALL');
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Customers"
        subtitle="Manage customer profiles, credit limits and receivables."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpen(true)}
          >
            New Customer
          </Button>
        }
      />

      <div className={styles.metricsGrid}>
        <SummaryCard
          title="Total Customers"
          value={customers.length}
          note="Customer profiles in the current dataset"
          icon={<TeamOutlined />}
          variant="blue"
          visual="dashboard"
        />
        <SummaryCard
          title="Active Customers"
          value={customers.filter((customer) => customer.active).length}
          note="Customers available for transactions"
          icon={<CheckCircleOutlined />}
          variant="green"
          visual="dashboard"
        />
        <SummaryCard
          title="Total Receivables"
          value={formatCurrency(totalReceivables)}
          note="Outstanding balance across customers"
          icon={<WalletOutlined />}
          variant="orange"
          visual="dashboard"
        />
        <SummaryCard
          title="Credit Threshold Alerts"
          value={thresholdCustomers}
          note="Customers using at least 80% of credit"
          icon={<WarningOutlined />}
          variant="red"
          visual="dashboard"
        />
      </div>

      <Card className={`panel-card ${styles.tableCard}`}>
        <div className={styles.toolbar}>
          <div className={styles.filterControls}>
            <Input
              allowClear
              className={styles.search}
              prefix={<SearchOutlined />}
              placeholder="Search customer, phone, address"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <Select
              className={styles.filter}
              value={activeFilter}
              onChange={setActiveFilter}
              options={[
                { value: 'ALL', label: 'All statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />
            <Select
              className={styles.filter}
              value={debtFilter}
              onChange={setDebtFilter}
              options={[
                { value: 'ALL', label: 'All debt states' },
                { value: 'WITH_DEBT', label: 'Outstanding debt' },
                { value: 'CLEAR', label: 'Clear balance' },
              ]}
            />
            <Select
              className={styles.filter}
              value={creditFilter}
              onChange={setCreditFilter}
              options={[
                { value: 'ALL', label: 'All credit usage' },
                { value: 'NEAR_LIMIT', label: '80%+ credit used' },
                { value: 'OVER_LIMIT', label: 'Over credit limit' },
              ]}
            />
          </div>
          <Button disabled={!hasFilters} onClick={clearFilters}>Clear filters</Button>
        </div>

        <QueryState
          isLoading={customersQuery.isLoading}
          isError={customersQuery.isError}
          error={customersQuery.error}
          hasData={filteredCustomers.length > 0}
          emptyTitle={hasFilters ? 'No customers match these filters' : 'No customers yet'}
          emptyDescription={hasFilters
            ? 'Adjust or clear filters to view additional customer profiles.'
            : 'Create the first customer to begin managing orders and receivables.'}
          emptyAction={hasFilters ? <Button onClick={clearFilters}>Clear filters</Button> : null}
          onRetry={() => customersQuery.refetch()}
        >
          <Table
            rowKey="id"
            sticky
            scroll={{ x: 1160 }}
            dataSource={filteredCustomers}
            rowClassName={(record) => {
              const limit = toNumber(record.creditLimit);
              const usage = limit > 0 ? toNumber(record.debtBalance) / limit : 0;

              return usage >= 0.8 ? styles.creditWarningRow : '';
            }}
            columns={[
              {
                title: 'Customer',
                fixed: 'left',
                width: 260,
                render: (_, record) => (
                  <div className={styles.customerCell}>
                    <Avatar>{record.name.slice(0, 2).toUpperCase()}</Avatar>
                    <div>
                      <Typography.Text strong>{record.name}</Typography.Text>
                      <Tag
                        className={`${styles.statusTag} ${
                          record.active ? styles.active : styles.inactive
                        }`}
                      >
                        {record.active ? 'ACTIVE' : 'INACTIVE'}
                      </Tag>
                    </div>
                  </div>
                ),
              },
              { title: 'Phone', dataIndex: 'phone', width: 150 },
              { title: 'Address', dataIndex: 'address', width: 220, ellipsis: true },
              {
                title: 'Payment Term',
                dataIndex: 'paymentTermDays',
                width: 130,
                render: (value) => `${value} days`,
              },
              {
                title: 'Credit Usage',
                width: 210,
                render: (_, record) => {
                  const debt = toNumber(record.debtBalance);
                  const limit = toNumber(record.creditLimit);
                  const percent = limit > 0 ? Math.round((debt / limit) * 100) : 0;

                  return (
                    <div className={styles.creditUsage}>
                      <div>
                        <span>{formatCurrency(debt)}</span>
                        <span>{limit > 0 ? `of ${formatCurrency(limit)}` : 'No credit limit'}</span>
                      </div>
                      <Progress
                        percent={Math.min(percent, 100)}
                        showInfo={false}
                        size="small"
                        status={percent >= 100 ? 'exception' : percent >= 80 ? 'normal' : 'success'}
                      />
                    </div>
                  );
                },
              },
              {
                title: 'Debt Balance',
                dataIndex: 'debtBalance',
                render: (value) => (
                  <Space direction="vertical" size={0}>
                    <Typography.Text
                      className={
                        toNumber(value) > 0
                          ? styles.debtOutstanding
                          : styles.debtClear
                      }
                    >
                      {formatCurrency(value)}
                    </Typography.Text>
                    <CustomerDebtTag amount={toNumber(value)} />
                  </Space>
                ),
              },
              {
                title: '',
                fixed: 'right',
                width: 64,
                render: (_, record) => (
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: [{ key: 'view', icon: <EyeOutlined />, label: 'View detail' }],
                      onClick: () => navigate(`/customers/${record.id}`),
                    }}
                  >
                    <Button type="text" icon={<MoreOutlined />} aria-label={`Actions for ${record.name}`} />
                  </Dropdown>
                ),
              },
            ]}
          />
        </QueryState>
      </Card>

      <Modal
        rootClassName={styles.modal}
        open={open}
        title="Create Customer"
        confirmLoading={createCustomer.isPending}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ paymentTermDays: 14, creditLimit: 0 }}
          onFinish={async (values) => {
            await createCustomer.mutateAsync(values);
            form.resetFields();
            setOpen(false);
          }}
        >
          <Form.Item
            name="name"
            label="Customer Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="creditLimit" label="Credit Limit">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="paymentTermDays" label="Payment Term Days">
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
