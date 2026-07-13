import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
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
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<CustomerFormValues>();

  const filteredCustomers = useMemo(
    () =>
      (customersQuery.data ?? []).filter((customer) =>
        [customer.name, customer.phone, customer.address].some((value) =>
          value?.toLowerCase().includes(keyword.toLowerCase()),
        ),
      ),
    [customersQuery.data, keyword],
  );

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

      <Card className={`panel-card ${styles.tableCard}`}>
        <Input.Search
          allowClear
          className={styles.search}
          placeholder="Search customer, phone, address"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />

        <QueryState
          isLoading={customersQuery.isLoading}
          isError={customersQuery.isError}
          error={customersQuery.error}
          hasData={filteredCustomers.length > 0}
        >
          <Table
            rowKey="id"
            dataSource={filteredCustomers}
            columns={[
              {
                title: 'Customer',
                render: (_, record) => (
                  <Space direction="vertical" size={0}>
                    <Typography.Text strong>{record.name}</Typography.Text>
                    <Tag
                      className={`${styles.statusTag} ${
                        record.active ? styles.active : styles.inactive
                      }`}
                    >
                      {record.active ? 'ACTIVE' : 'INACTIVE'}
                    </Tag>
                  </Space>
                ),
              },
              { title: 'Phone', dataIndex: 'phone' },
              { title: 'Address', dataIndex: 'address' },
              {
                title: 'Credit Limit',
                dataIndex: 'creditLimit',
                render: (value) => formatCurrency(value),
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
                title: 'Action',
                render: (_, record) => (
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/customers/${record.id}`)}
                  >
                    View Detail
                  </Button>
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
