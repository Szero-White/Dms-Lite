import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Table,
  Typography,
} from 'antd';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { useCustomers } from '../../../../features/customers';
import { formatCurrency } from '../../../../lib/format';
import { useRecordCustomerPayment } from '../../hooks/usePaymentQueries';
import { RecordPaymentPayload } from '../../types/payment.types';
import styles from './PaymentsPage.module.css';

export function PaymentsPage() {
  const customersQuery = useCustomers();
  const paymentMutation = useRecordCustomerPayment();
  const [form] = Form.useForm<RecordPaymentPayload>();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Payments"
        subtitle="Record customer payments and immediately reflect lower outstanding debt."
      />

      <QueryState isLoading={customersQuery.isLoading} isError={customersQuery.isError} error={customersQuery.error} hasData={Boolean(customersQuery.data?.length)}>
        <Row gutter={[16, 16]} align="stretch">
          <Col xs={24} xl={10}>
            <Card className={`panel-card ${styles.formCard}`} title="Record Payment">
              <Form
                form={form}
                layout="vertical"
                onFinish={async (values) => {
                  await paymentMutation.mutateAsync(values);
                  form.resetFields();
                }}
              >
                <Form.Item label="Customer" name="customerId" rules={[{ required: true }]}>
                  <Select
                    placeholder="Choose customer"
                    options={(customersQuery.data ?? []).map((customer) => ({
                      value: customer.id,
                      label: `${customer.name} - Debt ${formatCurrency(customer.debtBalance)}`,
                    }))}
                  />
                </Form.Item>
                <Form.Item label="Amount" name="amount" rules={[{ required: true }]}>
                  <InputNumber className={styles.fullWidth} min={1} />
                </Form.Item>
                <Form.Item label="Note" name="note">
                  <Input.TextArea rows={4} placeholder="Transfer note, receipt number, or collection comment" />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" loading={paymentMutation.isPending}>
                    Save Payment
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col xs={24} xl={14}>
            <Card className={`panel-card ${styles.watchlistCard}`} title="Receivable Watchlist">
              <Table
                rowKey="id"
                pagination={false}
                dataSource={[...(customersQuery.data ?? [])].sort((a, b) => Number(b.debtBalance) - Number(a.debtBalance))}
                columns={[
                  { title: 'Customer', dataIndex: 'name' },
                  { title: 'Phone', dataIndex: 'phone' },
                  { title: 'Credit Limit', dataIndex: 'creditLimit', render: (value) => formatCurrency(value) },
                  {
                    title: 'Debt Balance',
                    dataIndex: 'debtBalance',
                    render: (value) => (
                      <Typography.Text
                        className={
                          Number(value) > 0
                            ? styles.debtOutstanding
                            : styles.debtClear
                        }
                      >
                        {formatCurrency(value)}
                      </Typography.Text>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </QueryState>
    </div>
  );
}
