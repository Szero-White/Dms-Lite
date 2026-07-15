import {
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  InputNumber,
  Progress,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { CustomerDebtTag } from '../../../../components/common/StatusTag';
import { useCustomers } from '../../../../features/customers';
import { formatCurrency, toNumber } from '../../../../lib/format';
import { useRecordCustomerPayment } from '../../hooks/usePaymentQueries';
import { RecordPaymentPayload } from '../../types/payment.types';
import styles from './PaymentsPage.module.css';

export function PaymentsPage() {
  const customersQuery = useCustomers();
  const paymentMutation = useRecordCustomerPayment();
  const [form] = Form.useForm<RecordPaymentPayload>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const selectedCustomerId = Form.useWatch('customerId', form);
  const paymentAmount = Form.useWatch('amount', form);
  const customers = customersQuery.data ?? [];
  const debtors = useMemo(
    () => customers
      .filter((customer) => toNumber(customer.debtBalance) > 0)
      .filter((customer) => [customer.name, customer.phone, customer.address]
        .some((value) => value?.toLowerCase().includes(keyword.trim().toLowerCase())))
      .sort((first, second) => toNumber(second.debtBalance) - toNumber(first.debtBalance)),
    [customers, keyword],
  );
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
  const currentDebt = toNumber(selectedCustomer?.debtBalance);
  const projectedDebt = Math.max(currentDebt - toNumber(paymentAmount), 0);
  const totalReceivables = customers.reduce(
    (total, customer) => total + toNumber(customer.debtBalance),
    0,
  );
  const availableCredit = customers.reduce(
    (total, customer) => total + Math.max(
      toNumber(customer.creditLimit) - toNumber(customer.debtBalance),
      0,
    ),
    0,
  );
  const debtorRatio = customers.length > 0
    ? customers.filter((c) => toNumber(c.debtBalance) > 0).length / customers.length
    : 0;
  const topDebtors = debtors.slice(0, 5);
  const maxDebt = topDebtors.length > 0 ? toNumber(topDebtors[0].debtBalance) : 0;

  function openPaymentDrawer(customerId?: number) {
    form.resetFields();
    if (customerId) {
      form.setFieldValue('customerId', customerId);
    }
    setDrawerOpen(true);
  }

  function closePaymentDrawer() {
    setDrawerOpen(false);
    form.resetFields();
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Payments"
        subtitle="Record customer payments and immediately reflect lower outstanding debt."
        extra={(
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openPaymentDrawer()}>
            Record Payment
          </Button>
        )}
      />

      <QueryState
        isLoading={customersQuery.isLoading}
        isError={customersQuery.isError}
        error={customersQuery.error}
        hasData={Boolean(customers.length)}
        emptyTitle="No customer accounts yet"
        emptyDescription="Create customer profiles before recording receivable payments."
        onRetry={() => customersQuery.refetch()}
      >
        <div className={styles.contentStack}>
          <div className={styles.heroRow}>
            {/* LEFT: Receivables Overview */}
            <div className={styles.heroLeft}>
              <div className={styles.heroCard}>
                <div className={styles.heroCardInner}>
                  {/* SVG ring */}
                  <div className={styles.ringWrap}>
                    <svg viewBox="0 0 120 120" className={styles.ring}>
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10"/>
                      <circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke="url(#rg)" strokeWidth="10"
                        strokeDasharray={`${debtorRatio * 314} 314`}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                      />
                      <defs>
                        <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ef4444"/>
                          <stop offset="100%" stopColor="#f97316"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className={styles.ringCenter}>
                      <span className={styles.ringPct}>{Math.round(debtorRatio * 100)}%</span>
                      <span className={styles.ringLabel}>have debt</span>
                    </div>
                  </div>

                  <div className={styles.heroMain}>
                    <div className={styles.heroEyebrow}>Total Receivables</div>
                    <div className={styles.heroAmount}>{formatCurrency(totalReceivables)}</div>
                    <div className={styles.heroMiniStats}>
                      <div className={styles.miniStat}>
                        <span className={`${styles.miniDot} ${styles.red}`}/>
                        <div>
                          <strong>{debtors.length}</strong>
                          <span>Debtors</span>
                        </div>
                      </div>
                      <div className={styles.miniStat}>
                        <span className={`${styles.miniDot} ${styles.green}`}/>
                        <div>
                          <strong>{formatCurrency(availableCredit)}</strong>
                          <span>Available credit</span>
                        </div>
                      </div>
                      <div className={styles.miniStat}>
                        <span className={`${styles.miniDot} ${styles.blue}`}/>
                        <div>
                          <strong>{customers.filter((c) => c.active).length}</strong>
                          <span>Active accounts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Top debtors bar chart */}
            <div className={styles.heroRight}>
              <div className={styles.topDebtorsCard}>
                <div className={styles.topDebtorsHeader}>
                  <span>Top Debtors</span>
                  <span className={styles.topDebtorsCount}>{debtors.length} accounts</span>
                </div>
                <div className={styles.barList}>
                  {topDebtors.map((d, i) => {
                    const pct = maxDebt > 0 ? (toNumber(d.debtBalance) / maxDebt) * 100 : 0;
                    return (
                      <div key={d.id} className={styles.barRow}>
                        <div className={styles.barMeta}>
                          <span className={styles.barRank}>{i + 1}</span>
                          <span className={styles.barName}>{d.name}</span>
                          <span className={styles.barAmt}>{formatCurrency(d.debtBalance)}</span>
                        </div>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.barFill}
                            style={{
                              width: `${pct}%`,
                              background: i === 0
                                ? 'linear-gradient(90deg,#ef4444,#f97316)'
                                : i === 1
                                  ? 'linear-gradient(90deg,#f97316,#fbbf24)'
                                  : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {debtors.length === 0 && (
                    <div className={styles.barEmpty}>No outstanding debts 🎉</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Card className={`panel-card ${styles.watchlistCard}`} title="Receivable Watchlist">
            <div className={styles.toolbar}>
              <Input
                allowClear
                className={styles.search}
                prefix={<SearchOutlined />}
                placeholder="Search customer, phone, address"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <Typography.Text type="secondary">
                {debtors.length} account{debtors.length === 1 ? '' : 's'} requiring collection
              </Typography.Text>
            </div>
            <Table
              rowKey="id"
              sticky
              scroll={{ x: 960 }}
              locale={{ emptyText: keyword ? 'No debtor accounts match this search' : 'No outstanding receivables' }}
              dataSource={debtors}
              columns={[
                {
                  title: 'Customer',
                  fixed: 'left',
                  width: 240,
                  render: (_, record) => (
                    <div className={styles.customerCell}>
                      <Avatar>{record.name.slice(0, 2).toUpperCase()}</Avatar>
                      <div>
                        <Typography.Text strong>{record.name}</Typography.Text>
                        <Typography.Text type="secondary">{record.phone || '--'}</Typography.Text>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Credit Usage',
                  width: 220,
                  render: (_, record) => {
                    const debt = toNumber(record.debtBalance);
                    const limit = toNumber(record.creditLimit);
                    const percent = limit > 0 ? Math.round((debt / limit) * 100) : 0;

                    return (
                      <div className={styles.creditUsage}>
                        <div>
                          <span>{limit > 0 ? `${percent}%` : 'No limit'}</span>
                          <span>{formatCurrency(limit)}</span>
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
                  align: 'right',
                  width: 170,
                  render: (value) => (
                    <Typography.Text className={styles.debtOutstanding}>
                      {formatCurrency(value)}
                    </Typography.Text>
                  ),
                },
                {
                  title: 'Status',
                  width: 120,
                  render: (_, record) => <CustomerDebtTag amount={toNumber(record.debtBalance)} />,
                },
                {
                  title: '',
                  fixed: 'right',
                  width: 140,
                  render: (_, record) => (
                    <Button onClick={() => openPaymentDrawer(record.id)}>Record payment</Button>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </QueryState>

      <Drawer
        className={styles.paymentDrawer}
        width={460}
        title="Record Payment"
        open={drawerOpen}
        onClose={closePaymentDrawer}
        destroyOnClose
        footer={(
          <Space className={styles.drawerFooter}>
            <Button onClick={closePaymentDrawer}>Cancel</Button>
            <Button
              type="primary"
              loading={paymentMutation.isPending}
              onClick={() => form.submit()}
            >
              Save Payment
            </Button>
          </Space>
        )}
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          onFinish={async (values) => {
            await paymentMutation.mutateAsync(values);
            closePaymentDrawer();
          }}
        >
          <Form.Item
            label="Customer"
            name="customerId"
            rules={[{ required: true, message: 'Please select a customer' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Choose customer"
              options={customers.map((customer) => ({
                value: customer.id,
                label: `${customer.name} - Debt ${formatCurrency(customer.debtBalance)}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: 'Please enter a payment amount' }]}
          >
            <InputNumber className={styles.fullWidth} min={1} />
          </Form.Item>

          {selectedCustomer ? (
            <div className={styles.paymentProjection}>
              <div>
                <Typography.Text type="secondary">Debt before payment</Typography.Text>
                <Typography.Text strong>{formatCurrency(currentDebt)}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Payment amount</Typography.Text>
                <Typography.Text strong>{formatCurrency(toNumber(paymentAmount))}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Projected debt</Typography.Text>
                <Typography.Text strong>{formatCurrency(projectedDebt)}</Typography.Text>
              </div>
            </div>
          ) : null}

          <Form.Item label="Note" name="note">
            <Input.TextArea
              rows={4}
              placeholder="Transfer note, receipt number, or collection comment"
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
