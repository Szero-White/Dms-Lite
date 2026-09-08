import {
  DownloadOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Input,
  Pagination,
  Space,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import type { TableColumnsType } from 'antd';
import { useTranslation } from 'react-i18next';
import { QueryState } from '../../../../../components/common/QueryState';
import { formatCurrency, formatDateTime } from '../../../../../lib/format';
import { usePaymentHistory } from '../../../hooks/usePaymentQueries';
import { usePaymentReceiptDownload } from '../../../hooks/usePaymentReceiptDownload';
import type { PaymentRecord } from '../../../types/payment.types';
import styles from '../PaymentsPage.module.css';

interface PaymentHistoryCardProps {
  enabled: boolean;
  onViewPayment: (payment: PaymentRecord) => void;
}

export function PaymentHistoryCard({ enabled, onViewPayment }: PaymentHistoryCardProps) {
  const { i18n, t } = useTranslation();
  const downloadReceipt = usePaymentReceiptDownload();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState<string>();
  const [to, setTo] = useState<string>();
  const query = usePaymentHistory(page, { search, from, to }, { enabled });

  const columns = useMemo<TableColumnsType<PaymentRecord>>(() => [
    {
      title: t('payments.column.paymentCode'),
      dataIndex: 'code',
      fixed: 'left' as const,
      width: 185,
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: t('payments.column.salesOrder'),
      dataIndex: 'salesOrderCode',
      width: 180,
      render: (value: string | undefined, payment: PaymentRecord) => payment.legacy
        ? <Typography.Text type="secondary">{t('payments.history.legacy')}</Typography.Text>
        : value ?? '--',
    },
    {
      title: t('customers.column.customer'),
      dataIndex: 'customerName',
      width: 220,
      render: (value?: string) => value ?? '--',
    },
    {
      title: t('payments.column.recordedAt'),
      dataIndex: 'createdAt',
      width: 175,
      render: (value: string) => formatDateTime(value, i18n.language),
    },
    {
      title: t('payments.column.received'),
      dataIndex: 'amount',
      width: 150,
      align: 'right' as const,
      render: (value: string | number) => formatCurrency(value, i18n.language),
    },
    {
      title: t('payments.column.remainingAfter'),
      dataIndex: 'debtAfter',
      width: 170,
      align: 'right' as const,
      render: (value?: string | number) => value === null || value === undefined
        ? '--'
        : formatCurrency(value, i18n.language),
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
      fixed: 'right' as const,
      width: 100,
      align: 'center' as const,
      render: (_: unknown, payment: PaymentRecord) => (
        <Space size={2}>
          <Tooltip title={t('common.view')}>
            <Button type="text" icon={<EyeOutlined />} onClick={() => onViewPayment(payment)} />
          </Tooltip>
          <Tooltip title={t('payments.receipt.download')}>
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => void downloadReceipt(payment)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ], [downloadReceipt, i18n.language, onViewPayment, t]);

  return (
    <Card className={`panel-card ${styles.watchlistCard}`} title={t('payments.history.title')}>
      <div className={styles.toolbar}>
        <div className={styles.historyFilters}>
          <Input
            allowClear
            className={styles.historySearch}
            prefix={<SearchOutlined />}
            placeholder={t('payments.history.searchPlaceholder')}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
          />
          <DatePicker.RangePicker
            className={styles.historyDateRange}
            allowClear
            placeholder={[t('payments.history.fromDate'), t('payments.history.toDate')]}
            onChange={(values) => {
              setFrom(values?.[0]?.format('YYYY-MM-DD'));
              setTo(values?.[1]?.format('YYYY-MM-DD'));
              setPage(0);
            }}
          />
        </div>
        <Typography.Text type="secondary">
          {t('payments.history.count', { count: query.data?.totalElements ?? 0 })}
        </Typography.Text>
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        hasData={Boolean(query.data?.content.length)}
        emptyTitle={t('payments.history.emptyTitle')}
        emptyDescription={t('payments.history.emptyDescription')}
        onRetry={() => query.refetch()}
      >
        <Table
          rowKey="id"
          pagination={false}
          scroll={{ x: 1220 }}
          dataSource={query.data?.content ?? []}
          columns={columns}
        />
      </QueryState>

      {(query.data?.totalPages ?? 0) > 1 ? (
        <div className={styles.pagination}>
          <Pagination
            current={page + 1}
            total={query.data?.totalElements ?? 0}
            pageSize={query.data?.size ?? 20}
            showSizeChanger={false}
            onChange={(nextPage) => setPage(nextPage - 1)}
          />
        </div>
      ) : null}
    </Card>
  );
}
