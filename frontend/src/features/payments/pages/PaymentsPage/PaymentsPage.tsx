import {
  DownloadOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  App,
  Avatar,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Pagination,
  Space,
  Table,
  Tabs,
  Tooltip,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { useCustomers } from '../../../../features/customers';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getErrorMessage,
  toNumber,
} from '../../../../lib/format';
import { downloadPaymentReceipt } from '../../api/paymentService';
import {
  useOutstandingPaymentOrders,
  usePaymentHistory,
  useRecordSalesOrderPayment,
} from '../../hooks/usePaymentQueries';
import type {
  OutstandingPaymentOrder,
  PaymentRecord,
  RecordPaymentPayload,
} from '../../types/payment.types';
import styles from './PaymentsPage.module.css';
import heroStyles from './PaymentsHero.module.css';

export function PaymentsPage() {
  const { i18n, t } = useTranslation();
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<'payment' | 'history'>('payment');
  const [paymentPage, setPaymentPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState<string>();
  const [historyTo, setHistoryTo] = useState<string>();
  const [selectedOrder, setSelectedOrder] = useState<OutstandingPaymentOrder | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [requestKey, setRequestKey] = useState('');
  const [form] = Form.useForm<Pick<RecordPaymentPayload, 'amount' | 'note'>>();

  const customersQuery = useCustomers({ enabled: activeTab === 'payment' });
  const outstandingQuery = useOutstandingPaymentOrders(paymentPage, paymentSearch, { enabled: activeTab === 'payment' });
  const historyQuery = usePaymentHistory(
    historyPage,
    { search: historySearch, from: historyFrom, to: historyTo },
    { enabled: activeTab === 'history' },
  );
  const paymentMutation = useRecordSalesOrderPayment();

  const customers = customersQuery.data ?? [];
  const activeCustomers = useMemo(
    () => customers.filter((customer) => customer.active),
    [customers],
  );
  const debtors = useMemo(
    () => customers
      .filter((customer) => toNumber(customer.debtBalance) > 0)
      .sort((first, second) => toNumber(second.debtBalance) - toNumber(first.debtBalance)),
    [customers],
  );
  const totalReceivables = customers.reduce(
    (total, customer) => total + toNumber(customer.debtBalance),
    0,
  );
  const availableCredit = activeCustomers.reduce(
    (total, customer) => total + Math.max(
      toNumber(customer.creditLimit) - toNumber(customer.debtBalance),
      0,
    ),
    0,
  );
  const debtorRatio = activeCustomers.length > 0
    ? activeCustomers.filter((customer) => toNumber(customer.debtBalance) > 0).length / activeCustomers.length
    : 0;
  const topDebtors = debtors.slice(0, 5);
  const maxDebt = topDebtors.length > 0 ? toNumber(topDebtors[0].debtBalance) : 0;

  function openPaymentDrawer(order: OutstandingPaymentOrder) {
    setSelectedOrder(order);
    setRequestKey(globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    form.resetFields();
  }

  function closePaymentDrawer() {
    setSelectedOrder(null);
    setRequestKey('');
    form.resetFields();
  }

  async function submitPayment(values: Pick<RecordPaymentPayload, 'amount' | 'note'>) {
    if (!selectedOrder || !requestKey) {
      return;
    }

    await paymentMutation.mutateAsync({
      salesOrderId: selectedOrder.salesOrderId,
      amount: values.amount,
      note: values.note,
      requestKey,
    });
    closePaymentDrawer();
  }

  async function handleReceipt(payment: PaymentRecord) {
    try {
      const blob = await downloadPaymentReceipt(payment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${payment.code}-receipt.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      message.error(getErrorMessage(error, t('payments.receipt.downloadFailed')));
    }
  }

  const remainingAmount = toNumber(selectedOrder?.remainingAmount);

  const paymentTab = (
    <div className={styles.contentStack}>
      <QueryState
        isLoading={customersQuery.isLoading}
        isError={customersQuery.isError}
        error={customersQuery.error}
        hasData={Boolean(customers.length)}
        emptyTitle={t('payments.title')}
        emptyDescription={t('payments.empty.description')}
        onRetry={() => customersQuery.refetch()}
      >
        <div className={heroStyles.heroRow}>
          <div className={heroStyles.heroLeft}>
            <div className={heroStyles.heroCard}>
              <div className={heroStyles.heroCardInner}>
                <div className={heroStyles.ringWrap}>
                  <svg viewBox="0 0 120 120" className={heroStyles.ring}>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="url(#rg)"
                      strokeWidth="10"
                      strokeDasharray={`${debtorRatio * 314} 314`}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                    />
                    <defs>
                      <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#f97316" />
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
                      <span className={`${heroStyles.miniDot} ${heroStyles.red}`} />
                      <div><strong>{debtors.length}</strong><span>{t('payments.hero.debtors')}</span></div>
                    </div>
                    <div className={heroStyles.miniStat}>
                      <span className={`${heroStyles.miniDot} ${heroStyles.green}`} />
                      <div><strong>{formatCurrency(availableCredit)}</strong><span>{t('payments.hero.availableCredit')}</span></div>
                    </div>
                    <div className={heroStyles.miniStat}>
                      <span className={`${heroStyles.miniDot} ${heroStyles.blue}`} />
                      <div><strong>{activeCustomers.length}</strong><span>{t('payments.hero.activeAccounts')}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={heroStyles.heroRight}>
            <div className={heroStyles.topDebtorsCard}>
              <div className={heroStyles.topDebtorsHeader}>
                <span>{t('payments.hero.topDebtors')}</span>
                <span className={heroStyles.topDebtorsCount}>{t('payments.hero.accounts', { count: debtors.length })}</span>
              </div>
              <div className={heroStyles.barList}>
                {topDebtors.map((debtor, index) => {
                  const percent = maxDebt > 0 ? (toNumber(debtor.debtBalance) / maxDebt) * 100 : 0;
                  return (
                    <div key={debtor.id} className={heroStyles.barRow}>
                      <div className={heroStyles.barMeta}>
                        <span className={heroStyles.barRank}>{index + 1}</span>
                        <span className={heroStyles.barName}>{debtor.name}</span>
                        <span className={heroStyles.barAmt}>{formatCurrency(debtor.debtBalance)}</span>
                      </div>
                      <div className={heroStyles.barTrack}>
                        <div
                          className={heroStyles.barFill}
                          style={{
                            width: `${percent}%`,
                            background: index === 0
                              ? 'linear-gradient(90deg,#ef4444,#f97316)'
                              : index === 1
                                ? 'linear-gradient(90deg,#f97316,#fbbf24)'
                                : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {debtors.length === 0 ? (
                  <div className={heroStyles.barEmpty}>{t('payments.hero.noOutstandingDebts')}</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </QueryState>

      <Card className={`panel-card ${styles.watchlistCard}`} title={t('payments.outstanding.title')}>
        <div className={styles.toolbar}>
          <Input
            allowClear
            className={styles.search}
            prefix={<SearchOutlined />}
            placeholder={t('payments.outstanding.searchPlaceholder')}
            value={paymentSearch}
            onChange={(event) => {
              setPaymentSearch(event.target.value);
              setPaymentPage(0);
            }}
          />
          <Typography.Text type="secondary">
            {t('payments.outstanding.count', { count: outstandingQuery.data?.totalElements ?? 0 })}
          </Typography.Text>
        </div>

        <QueryState
          isLoading={outstandingQuery.isLoading}
          isError={outstandingQuery.isError}
          error={outstandingQuery.error}
          hasData={Boolean(outstandingQuery.data?.content.length)}
          emptyTitle={t('payments.outstanding.emptyTitle')}
          emptyDescription={t('payments.outstanding.emptyDescription')}
          onRetry={() => outstandingQuery.refetch()}
        >
          <Table
            rowKey="salesOrderId"
            pagination={false}
            scroll={{ x: 1080 }}
            dataSource={outstandingQuery.data?.content ?? []}
            columns={[
              {
                title: t('payments.column.salesOrder'),
                dataIndex: 'salesOrderCode',
                fixed: 'left',
                width: 180,
                render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
              },
              {
                title: t('customers.column.customer'),
                dataIndex: 'customerName',
                width: 240,
                render: (value: string) => (
                  <div className={styles.customerCell}>
                    <Avatar>{value.slice(0, 2).toUpperCase()}</Avatar>
                    <Typography.Text strong>{value}</Typography.Text>
                  </div>
                ),
              },
              {
                title: t('payments.column.orderTotal'),
                dataIndex: 'totalAmount',
                width: 150,
                align: 'right',
                render: (value) => formatCurrency(value, i18n.language),
              },
              {
                title: t('payments.column.collected'),
                dataIndex: 'paidAmount',
                width: 150,
                align: 'right',
                render: (value) => formatCurrency(value, i18n.language),
              },
              {
                title: t('payments.column.remaining'),
                dataIndex: 'remainingAmount',
                width: 170,
                align: 'right',
                render: (value) => (
                  <Typography.Text className={styles.debtOutstanding}>
                    {formatCurrency(value, i18n.language)}
                  </Typography.Text>
                ),
              },
              {
                title: t('payments.column.dueDate'),
                dataIndex: 'dueDate',
                width: 140,
                render: (value) => value ? formatDate(value, i18n.language) : '--',
              },
              {
                title: t('common.actions'),
                fixed: 'right',
                width: 150,
                render: (_, order) => (
                  <Button type="primary" onClick={() => openPaymentDrawer(order)}>
                    {t('payments.recordPayment')}
                  </Button>
                ),
              },
            ]}
          />
        </QueryState>

        {(outstandingQuery.data?.totalPages ?? 0) > 1 ? (
          <div className={styles.pagination}>
            <Pagination
              current={paymentPage + 1}
              total={outstandingQuery.data?.totalElements ?? 0}
              pageSize={outstandingQuery.data?.size ?? 20}
              showSizeChanger={false}
              onChange={(page) => setPaymentPage(page - 1)}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );

  const historyTab = (
    <Card className={`panel-card ${styles.watchlistCard}`} title={t('payments.history.title')}>
      <div className={styles.toolbar}>
        <div className={styles.historyFilters}>
          <Input
            allowClear
            className={styles.historySearch}
            prefix={<SearchOutlined />}
            placeholder={t('payments.history.searchPlaceholder')}
            value={historySearch}
            onChange={(event) => {
              setHistorySearch(event.target.value);
              setHistoryPage(0);
            }}
          />
          <DatePicker.RangePicker
            className={styles.historyDateRange}
            allowClear
            placeholder={[t('payments.history.fromDate'), t('payments.history.toDate')]}
            onChange={(values) => {
              setHistoryFrom(values?.[0]?.format('YYYY-MM-DD'));
              setHistoryTo(values?.[1]?.format('YYYY-MM-DD'));
              setHistoryPage(0);
            }}
          />
        </div>
        <Typography.Text type="secondary">
          {t('payments.history.count', { count: historyQuery.data?.totalElements ?? 0 })}
        </Typography.Text>
      </div>

      <QueryState
        isLoading={historyQuery.isLoading}
        isError={historyQuery.isError}
        error={historyQuery.error}
        hasData={Boolean(historyQuery.data?.content.length)}
        emptyTitle={t('payments.history.emptyTitle')}
        emptyDescription={t('payments.history.emptyDescription')}
        onRetry={() => historyQuery.refetch()}
      >
        <Table
          rowKey="id"
          pagination={false}
          scroll={{ x: 1220 }}
          dataSource={historyQuery.data?.content ?? []}
          columns={[
            {
              title: t('payments.column.paymentCode'),
              dataIndex: 'code',
              fixed: 'left',
              width: 185,
              render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
            },
            {
              title: t('payments.column.salesOrder'),
              dataIndex: 'salesOrderCode',
              width: 180,
              render: (value, payment) => payment.legacy
                ? <Typography.Text type="secondary">{t('payments.history.legacy')}</Typography.Text>
                : value ?? '--',
            },
            { title: t('customers.column.customer'), dataIndex: 'customerName', width: 220, render: (value) => value ?? '--' },
            { title: t('payments.column.recordedAt'), dataIndex: 'createdAt', width: 175, render: (value) => formatDateTime(value, i18n.language) },
            { title: t('payments.column.received'), dataIndex: 'amount', width: 150, align: 'right', render: (value) => formatCurrency(value, i18n.language) },
            {
              title: t('payments.column.remainingAfter'),
              dataIndex: 'debtAfter',
              width: 170,
              align: 'right',
              render: (value) => value === null || value === undefined ? '--' : formatCurrency(value, i18n.language),
            },
            {
              title: t('payments.column.note'),
              dataIndex: 'note',
              width: 220,
              ellipsis: true,
              render: (value?: string) => value
                ? <Tooltip title={value}><span>{value}</span></Tooltip>
                : '--',
            },
            {
              title: t('common.actions'),
              fixed: 'right',
              width: 100,
              align: 'center',
              render: (_, payment) => (
                <Space size={2}>
                  <Tooltip title={t('common.view')}>
                    <Button type="text" icon={<EyeOutlined />} onClick={() => setSelectedPayment(payment)} />
                  </Tooltip>
                  <Tooltip title={t('payments.receipt.download')}>
                    <Button type="text" icon={<DownloadOutlined />} onClick={() => void handleReceipt(payment)} />
                  </Tooltip>
                </Space>
              ),
            },
          ]}
        />
      </QueryState>

      {(historyQuery.data?.totalPages ?? 0) > 1 ? (
        <div className={styles.pagination}>
          <Pagination
            current={historyPage + 1}
            total={historyQuery.data?.totalElements ?? 0}
            pageSize={historyQuery.data?.size ?? 20}
            showSizeChanger={false}
            onChange={(page) => setHistoryPage(page - 1)}
          />
        </div>
      ) : null}
    </Card>
  );

  return (
    <div className={styles.page}>
      <PageHeader title={t('payments.title')} subtitle={t('payments.subtitle')} />

      <Tabs
        className={styles.tabs}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'payment' | 'history')}
        items={[
          { key: 'payment', label: t('payments.tabs.payment'), children: paymentTab },
          { key: 'history', label: t('payments.tabs.history'), children: historyTab },
        ]}
      />

      <Drawer
        className={styles.paymentDrawer}
        width={480}
        title={selectedOrder ? t('payments.drawer.title', { code: selectedOrder.salesOrderCode }) : t('payments.recordPayment')}
        open={Boolean(selectedOrder)}
        onClose={closePaymentDrawer}
        destroyOnClose
        footer={(
          <Space className={styles.drawerFooter}>
            <Button onClick={closePaymentDrawer}>{t('common.cancel')}</Button>
            <Button type="primary" loading={paymentMutation.isPending} onClick={() => form.submit()}>
              {t('payments.savePayment')}
            </Button>
          </Space>
        )}
      >
        {selectedOrder ? (
          <>
            <Descriptions bordered size="small" column={1} className={styles.paymentSummary}>
              <Descriptions.Item label={t('payments.column.salesOrder')}>{selectedOrder.salesOrderCode}</Descriptions.Item>
              <Descriptions.Item label={t('customers.column.customer')}>{selectedOrder.customerName}</Descriptions.Item>
              <Descriptions.Item label={t('payments.column.orderTotal')}>{formatCurrency(selectedOrder.totalAmount, i18n.language)}</Descriptions.Item>
              <Descriptions.Item label={t('payments.column.collected')}>{formatCurrency(selectedOrder.paidAmount, i18n.language)}</Descriptions.Item>
              <Descriptions.Item label={t('payments.column.remaining')}>
                <Typography.Text type="danger" strong>{formatCurrency(selectedOrder.remainingAmount, i18n.language)}</Typography.Text>
              </Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical" preserve={false} onFinish={submitPayment}>
              <Form.Item
                label={t('payments.amount')}
                name="amount"
                rules={[{ required: true, message: t('payments.amountRequired') }]}
              >
                <InputNumber
                  className={styles.fullWidth}
                  min={1}
                  max={remainingAmount}
                  onChange={(value) => {
                    const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
                    if (remainingAmount > 0 && numericValue > remainingAmount) {
                      form.setFieldValue('amount', remainingAmount);
                      message.info(t('payments.amountCapped', { amount: formatCurrency(remainingAmount, i18n.language) }));
                    }
                  }}
                />
              </Form.Item>
              <Form.Item label={t('payments.note')} name="note">
                <Input.TextArea maxLength={500} rows={4} placeholder={t('payments.notePlaceholder')} />
              </Form.Item>
            </Form>
          </>
        ) : null}
      </Drawer>

      <Drawer
        width={520}
        title={selectedPayment ? t('payments.history.detailTitle', { code: selectedPayment.code }) : t('payments.history.title')}
        open={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
      >
        {selectedPayment ? (
          <div className={styles.paymentDetail}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t('payments.column.paymentCode')}>{selectedPayment.code}</Descriptions.Item>
              <Descriptions.Item label={t('payments.column.salesOrder')}>
                {selectedPayment.legacy ? t('payments.history.legacy') : selectedPayment.salesOrderCode ?? '--'}
              </Descriptions.Item>
              <Descriptions.Item label={t('customers.column.customer')}>{selectedPayment.customerName ?? '--'}</Descriptions.Item>
              {!selectedPayment.legacy ? (
                <Descriptions.Item label={t('payments.column.orderTotal')}>
                  {formatCurrency(selectedPayment.salesOrderTotal, i18n.language)}
                </Descriptions.Item>
              ) : null}
              <Descriptions.Item label={t('payments.column.debtBefore')}>
                {selectedPayment.debtBefore === null || selectedPayment.debtBefore === undefined
                  ? '--'
                  : formatCurrency(selectedPayment.debtBefore, i18n.language)}
              </Descriptions.Item>
              <Descriptions.Item label={t('payments.column.received')}>
                {formatCurrency(selectedPayment.amount, i18n.language)}
              </Descriptions.Item>
              <Descriptions.Item label={t('payments.column.remainingAfter')}>
                {selectedPayment.debtAfter === null || selectedPayment.debtAfter === undefined
                  ? '--'
                  : formatCurrency(selectedPayment.debtAfter, i18n.language)}
              </Descriptions.Item>
              <Descriptions.Item label={t('payments.column.recordedAt')}>
                {formatDateTime(selectedPayment.createdAt, i18n.language)}
              </Descriptions.Item>
              <Descriptions.Item label={t('payments.column.recordedBy')}>{selectedPayment.recordedBy ?? '--'}</Descriptions.Item>
              <Descriptions.Item label={t('payments.column.note')}>{selectedPayment.note ?? '--'}</Descriptions.Item>
            </Descriptions>
            <Button block type="primary" icon={<DownloadOutlined />} onClick={() => void handleReceipt(selectedPayment)}>
              {t('payments.receipt.download')}
            </Button>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
