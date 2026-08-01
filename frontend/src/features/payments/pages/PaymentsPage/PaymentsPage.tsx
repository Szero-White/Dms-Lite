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
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { CustomerDebtTag } from '../../../../components/common/StatusTag';
import { useCustomers } from '../../../../features/customers';
import { formatCurrency, toNumber } from '../../../../lib/format';
import { useRecordCustomerPayment } from '../../hooks/usePaymentQueries';
import { RecordPaymentPayload } from '../../types/payment.types';
import styles from './PaymentsPage.module.css';
import heroStyles from './PaymentsHero.module.css';

export function PaymentsPage() {
  const { t } = useTranslation();
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
        title={t('payments.title')}
        subtitle={t('payments.subtitle')}
        extra={(
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openPaymentDrawer()}>
            {t('payments.record')}
          </Button>
        )}
      />

      <QueryState
        isLoading={customersQuery.isLoading}
        isError={customersQuery.isError}
        error={customersQuery.error}
        hasData={Boolean(customers.length)}
        emptyTitle={t('payments.title')}
        emptyDescription={t('payments.empty.description')}
        onRetry={() => customersQuery.refetch()}
      >
        <div className={styles.contentStack}>
          <div className={heroStyles.heroRow}>
            {/* LEFT: Receivables Overview */}
            <div className={heroStyles.heroLeft}>
              <div className={heroStyles.heroCard}>
                <div className={heroStyles.heroCardInner}>
                  {/* SVG ring */}
                  <div className={heroStyles.ringWrap}>
                    <svg viewBox="0 0 120 120" className={heroStyles.ring}>
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
                    <div className={heroStyles.ringCenter}>
                      <span className={heroStyles.ringPct}>{Math.round(debtorRatio * 100)}%</span>
                      <span className={heroStyles.ringLabel}>{t('payments.hero.haveDebt')}</span>
                    </div>
                  </div>

                  <div className={heroStyles.heroMain}>
                    <div className={heroStyles.heroEyebrow}>{t('payments.hero.totalReceivables')}</div>
                    <div className={heroStyles.heroAmount}>{formatCurrency(totalReceivables)}</div>
                    <div className={heroStyles.heroMiniStats}>
                      <div className={heroStyles.miniStat}>
                        <span className={`${heroStyles.miniDot} ${heroStyles.red}`}/>
                        <div>
                          <strong>{debtors.length}</strong>
                          <span>{t('payments.hero.debtors')}</span>
                        </div>
                      </div>
                      <div className={heroStyles.miniStat}>
                        <span className={`${heroStyles.miniDot} ${heroStyles.green}`}/>
                        <div>
                          <strong>{formatCurrency(availableCredit)}</strong>
                          <span>{t('payments.hero.availableCredit')}</span>
                        </div>
                      </div>
                      <div className={heroStyles.miniStat}>
                        <span className={`${heroStyles.miniDot} ${heroStyles.blue}`}/>
                        <div>
                          <strong>{customers.filter((c) => c.active).length}</strong>
                          <span>{t('payments.hero.activeAccounts')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Top debtors bar chart */}
            <div className={heroStyles.heroRight}>
              <div className={heroStyles.topDebtorsCard}>
                <div className={heroStyles.topDebtorsHeader}>
                  <span>{t('payments.hero.topDebtors')}</span>
                  <span className={heroStyles.topDebtorsCount}>{t('payments.hero.accounts', { count: debtors.length })}</span>
                </div>
                <div className={heroStyles.barList}>
                  {topDebtors.map((d, i) => {
                    const pct = maxDebt > 0 ? (toNumber(d.debtBalance) / maxDebt) * 100 : 0;
                    return (
                      <div key={d.id} className={heroStyles.barRow}>
                        <div className={heroStyles.barMeta}>
                          <span className={heroStyles.barRank}>{i + 1}</span>
                          <span className={heroStyles.barName}>{d.name}</span>
                          <span className={heroStyles.barAmt}>{formatCurrency(d.debtBalance)}</span>
                        </div>
                        <div className={heroStyles.barTrack}>
                          <div
                            className={heroStyles.barFill}
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
                    <div className={heroStyles.barEmpty}>No outstanding debts 🎉</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Card className={`panel-card ${styles.watchlistCard}`} title={t('payments.title')}>
            <div className={styles.toolbar}>
              <Input
                allowClear
                className={styles.search}
                prefix={<SearchOutlined />}
                placeholder={t('payments.searchPlaceholder')}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <Typography.Text type="secondary">
                {t('payments.collectionCount', { count: debtors.length })}
              </Typography.Text>
            </div>
            <Table
              rowKey="id"
              sticky
              scroll={{ x: 960 }}
              locale={{ emptyText: keyword ? t('payments.noDebtorsFiltered') : t('payments.noReceivables') }}
              dataSource={debtors}
              columns={[
                {
                  title: t('customers.column.customer'),
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
                  title: t('customers.column.creditUsage'),
                  width: 220,
                  render: (_, record) => {
                    const debt = toNumber(record.debtBalance);
                    const limit = toNumber(record.creditLimit);
                    const percent = limit > 0 ? Math.round((debt / limit) * 100) : 0;

                    return (
                      <div className={styles.creditUsage}>
                        <div>
                          <span>{limit > 0 ? `${percent}%` : t('payments.noLimit')}</span>
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
                  title: t('customers.column.debtBalance'),
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
                  title: t('common.status'),
                  width: 120,
                  render: (_, record) => <CustomerDebtTag amount={toNumber(record.debtBalance)} />,
                },
                {
                  title: '',
                  fixed: 'right',
                  width: 140,
                  render: (_, record) => (
                    <Button onClick={() => openPaymentDrawer(record.id)}>{t('payments.recordPayment')}</Button>
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
        title={t('payments.title')}
        open={drawerOpen}
        onClose={closePaymentDrawer}
        destroyOnClose
        footer={(
          <Space className={styles.drawerFooter}>
            <Button onClick={closePaymentDrawer}>{t('common.cancel')}</Button>
            <Button
              type="primary"
              loading={paymentMutation.isPending}
              onClick={() => form.submit()}
            >
              {t('payments.savePayment')}
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
            label={t('customers.column.customer')}
            name="customerId"
            rules={[{ required: true, message: t('payments.customerRequired') }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={t('payments.customerPlaceholder')}
              options={customers.map((customer) => ({
                value: customer.id,
                label: t('payments.customerDebtLabel', { name: customer.name, debt: formatCurrency(customer.debtBalance) }),
              }))}
            />
          </Form.Item>
          <Form.Item
            label={t('payments.amount')}
            name="amount"
            rules={[{ required: true, message: t('payments.amountRequired') }]}
          >
            <InputNumber className={styles.fullWidth} min={1} />
          </Form.Item>

          {selectedCustomer ? (
            <div className={styles.paymentProjection}>
              <div>
                <Typography.Text type="secondary">{t('payments.debtBefore')}</Typography.Text>
                <Typography.Text strong>{formatCurrency(currentDebt)}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">{t('payments.paymentAmount')}</Typography.Text>
                <Typography.Text strong>{formatCurrency(toNumber(paymentAmount))}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">{t('payments.projectedDebt')}</Typography.Text>
                <Typography.Text strong>{formatCurrency(projectedDebt)}</Typography.Text>
              </div>
            </div>
          ) : null}

          <Form.Item label={t('inventory.receive.note')} name="note">
            <Input.TextArea
              rows={4}
              placeholder={t('payments.notePlaceholder')}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
