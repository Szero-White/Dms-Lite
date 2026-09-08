import { EyeOutlined, FilePdfOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons';
import { App, Button, Card, DatePicker, Input, Pagination, Space, Table, Tooltip, Typography } from 'antd';
import type { TableColumnsType, TableProps } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { formatCurrency, formatDate, getErrorMessage, toNumber } from '../../../../lib/format';
import { getTableSortOrder, TABLE_SORT_DIRECTIONS } from '../../../../lib/tableSorting';
import { PERMISSIONS, canViewInvoiceReceivableState, hasPermission, useAuth } from '../../../auth';
import { InvoiceStatusTag } from '../../InvoiceStatusTag';
import { downloadInvoicePdf } from '../../api/invoiceService';
import { useInvoices, useIssueInvoice } from '../../hooks/useInvoiceQueries';
import type { Invoice, InvoiceSortDirection, InvoiceSortField } from '../../types/invoice.types';
import styles from './InvoicesPage.module.css';

export function InvoicesPage() {
  const { user } = useAuth();
  const { i18n, t } = useTranslation();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState<string>();
  const [to, setTo] = useState<string>();
  const [sortBy, setSortBy] = useState<InvoiceSortField>();
  const [sortDirection, setSortDirection] = useState<InvoiceSortDirection>();
  const invoicesQuery = useInvoices(page, { search, from, to, sortBy, sortDirection });
  const issueMutation = useIssueInvoice();
  const invoices = invoicesQuery.data?.content ?? [];
  const canIssue = hasPermission(user, PERMISSIONS.INVOICE_ISSUE);
  const canViewReceivableState = canViewInvoiceReceivableState(user);
  const sortOrder = (field: InvoiceSortField): 'ascend' | 'descend' | null =>
    getTableSortOrder(sortBy, sortDirection, field);

  async function handlePdf(invoice: Invoice) {
    try {
      const blob = await downloadInvoicePdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      message.error(getErrorMessage(error, t('invoice.pdfFailed')));
    }
  }

  const columns: TableColumnsType<Invoice> = [
    {
      title: t('invoice.column.invoice'),
      dataIndex: 'invoiceNumber',
      key: 'INVOICE_NUMBER',
      sorter: true,
      sortOrder: sortOrder('INVOICE_NUMBER'),
      width: 170,
      render: (value: string, record) => (
        <div className={styles.primaryCell}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">{record.salesOrderCode ?? '-'}</Typography.Text>
        </div>
      ),
    },
    {
      title: t('invoice.column.customer'),
      dataIndex: 'customerName',
      key: 'CUSTOMER',
      sorter: true,
      sortOrder: sortOrder('CUSTOMER'),
      width: 220,
      render: (value: string | undefined, record) => value ?? t('invoice.customerFallback', { id: record.customerId }),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'STATUS',
      sorter: true,
      sortOrder: sortOrder('STATUS'),
      width: 120,
      render: (status) => <InvoiceStatusTag status={status} />,
    },
    {
      title: t('invoice.column.issueDate'),
      dataIndex: 'issueDate',
      key: 'ISSUE_DATE',
      sorter: true,
      sortOrder: sortOrder('ISSUE_DATE'),
      width: 140,
      render: (value) => value ? formatDate(value, i18n.language) : '-',
    },
    {
      title: t('invoice.column.dueDate'),
      dataIndex: 'dueDate',
      key: 'DUE_DATE',
      sorter: true,
      sortOrder: sortOrder('DUE_DATE'),
      width: 140,
      render: (value) => value ? formatDate(value, i18n.language) : '-',
    },
    {
      title: t('invoice.column.total'),
      dataIndex: 'totalAmount',
      key: 'TOTAL_AMOUNT',
      sorter: true,
      sortOrder: sortOrder('TOTAL_AMOUNT'),
      width: 145,
      align: 'right',
      render: (value) => formatCurrency(value, i18n.language),
    },
    ...(canViewReceivableState ? [
      {
        title: t('invoice.column.paid'),
        dataIndex: 'paidAmount',
        key: 'PAID_AMOUNT',
        sorter: true,
        sortOrder: sortOrder('PAID_AMOUNT'),
        width: 145,
        align: 'right' as const,
        render: (value: number | null) => formatCurrency(value, i18n.language),
      },
      {
        title: t('invoice.column.remaining'),
        dataIndex: 'remainingAmount',
        key: 'REMAINING_AMOUNT',
        sorter: true,
        sortOrder: sortOrder('REMAINING_AMOUNT'),
        width: 145,
        align: 'right' as const,
        render: (value: number | null) => (
          <Typography.Text type={toNumber(value) > 0 ? 'danger' : 'success'} strong>
            {formatCurrency(value, i18n.language)}
          </Typography.Text>
        ),
      },
    ] : []),
    {
      title: t('common.actions'),
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title={t('common.view')}>
            <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/invoices/${record.id}`)} />
          </Tooltip>
          {canIssue && record.status === 'DRAFT' ? (
            <Tooltip title={t('invoice.action.issue')}>
              <Button type="text" icon={<SendOutlined />} onClick={() => issueMutation.mutate(record.id)} />
            </Tooltip>
          ) : null}
          {['ISSUED', 'PAID', 'OVERDUE'].includes(record.status) ? (
            <Tooltip title={t('invoice.action.pdf')}>
              <Button type="text" icon={<FilePdfOutlined />} onClick={() => void handlePdf(record)} />
            </Tooltip>
          ) : null}
        </Space>
      ),
    },
  ];

  const handleTableChange: TableProps<Invoice>['onChange'] = (_pagination, _filters, sorter) => {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const columnKey = activeSorter?.columnKey;
    const order = activeSorter?.order;
    if (!order) {
      setSortBy(undefined);
      setSortDirection(undefined);
      setPage(0);
      return;
    }

    if (typeof columnKey !== 'string') {
      return;
    }

    setSortBy(columnKey as InvoiceSortField);
    setSortDirection(order === 'ascend' ? 'ASC' : 'DESC');
    setPage(0);
  };

  return (
    <div className={styles.page}>
      <PageHeader title={t('invoice.title')} subtitle={t('invoice.subtitle')} />

      <Card className={`panel-card ${styles.tableCard}`}>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <Input
              allowClear
              className={styles.search}
              prefix={<SearchOutlined />}
              placeholder={t('invoice.searchPlaceholder')}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
            />
            <DatePicker.RangePicker
              className={styles.dateRange}
              allowClear
              placeholder={[t('invoice.fromDate'), t('invoice.toDate')]}
              onChange={(values) => {
                setFrom(values?.[0]?.format('YYYY-MM-DD'));
                setTo(values?.[1]?.format('YYYY-MM-DD'));
                setPage(0);
              }}
            />
          </div>
          <Typography.Text type="secondary">
            {t('invoice.count', { count: invoicesQuery.data?.totalElements ?? 0 })}
          </Typography.Text>
        </div>

        <QueryState
          isLoading={invoicesQuery.isLoading}
          isError={Boolean(invoicesQuery.error)}
          error={invoicesQuery.error}
          hasData={invoices.length > 0}
          emptyTitle={t('invoice.empty.title')}
          emptyDescription={t('invoice.empty.description')}
          onRetry={() => { void invoicesQuery.refetch(); }}
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={invoices}
            pagination={false}
            scroll={{ x: 1230 }}
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={false}
            onChange={handleTableChange}
          />
        </QueryState>
        {(invoicesQuery.data?.totalPages ?? 0) > 1 ? (
          <div className={styles.pagination}>
            <Pagination
              current={page + 1}
              total={invoicesQuery.data?.totalElements ?? 0}
              pageSize={invoicesQuery.data?.size ?? 20}
              showSizeChanger={false}
              onChange={(nextPage) => setPage(nextPage - 1)}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
