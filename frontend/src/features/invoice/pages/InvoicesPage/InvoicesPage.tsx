import { CloseOutlined, EyeOutlined, FilePdfOutlined, SendOutlined } from '@ant-design/icons';
import { App, Button, Card, Pagination, Space, Table, Tooltip, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { PERMISSIONS, canViewInvoiceReceivableState, hasPermission, useAuth } from '../../../auth';
import { formatCurrency, formatDate, getErrorMessage, toNumber } from '../../../../lib/format';
import { InvoiceStatusTag } from '../../InvoiceStatusTag';
import { downloadInvoicePdf } from '../../api/invoiceService';
import { useCancelInvoice, useInvoices, useIssueInvoice } from '../../hooks/useInvoiceQueries';
import type { Invoice } from '../../types/invoice.types';
import styles from './InvoicesPage.module.css';

export function InvoicesPage() {
  const { user } = useAuth();
  const { i18n, t } = useTranslation();
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const invoicesQuery = useInvoices(page);
  const issueMutation = useIssueInvoice();
  const cancelMutation = useCancelInvoice();
  const invoices = invoicesQuery.data?.content ?? [];
  const canIssue = hasPermission(user, PERMISSIONS.INVOICE_ISSUE);
  const canCancel = hasPermission(user, PERMISSIONS.INVOICE_CANCEL);
  const canViewReceivableState = canViewInvoiceReceivableState(user);

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
      width: 220,
      render: (value: string | undefined, record) => value ?? t('invoice.customerFallback', { id: record.customerId }),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      width: 120,
      render: (status) => <InvoiceStatusTag status={status} />,
    },
    {
      title: t('invoice.column.issueDate'),
      dataIndex: 'issueDate',
      width: 140,
      render: (value) => value ? formatDate(value, i18n.language) : '-',
    },
    {
      title: t('invoice.column.dueDate'),
      dataIndex: 'dueDate',
      width: 140,
      render: (value) => value ? formatDate(value, i18n.language) : '-',
    },
    {
      title: t('invoice.column.total'),
      dataIndex: 'totalAmount',
      width: 145,
      align: 'right',
      render: (value) => formatCurrency(value, i18n.language),
    },
    ...(canViewReceivableState ? [
      {
        title: t('invoice.column.paid'),
        dataIndex: 'paidAmount',
        width: 145,
        align: 'right' as const,
        render: (value: number | null) => formatCurrency(value, i18n.language),
      },
      {
        title: t('invoice.column.remaining'),
        dataIndex: 'remainingAmount',
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
          {canCancel && (record.status === 'DRAFT' || record.status === 'ISSUED' || record.status === 'OVERDUE') ? (
            <Tooltip title={t('invoice.action.cancel')}>
              <Button
                danger
                type="text"
                icon={<CloseOutlined />}
                onClick={() => modal.confirm({
                  title: t('invoice.cancel.title'),
                  content: t('invoice.cancel.description'),
                  okText: t('invoice.action.cancel'),
                  okButtonProps: { danger: true },
                  onOk: () => cancelMutation.mutateAsync(record.id),
                })}
              />
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

  return (
    <div className={styles.page}>
      <PageHeader title={t('invoice.title')} subtitle={t('invoice.subtitle')} />
      <Card className={`panel-card ${styles.tableCard}`}>
        <QueryState
          isLoading={invoicesQuery.isLoading}
          isError={Boolean(invoicesQuery.error)}
          error={invoicesQuery.error}
          hasData={invoices.length > 0}
          emptyTitle={t('invoice.empty.title')}
          emptyDescription={t('invoice.empty.description')}
          onRetry={() => { void invoicesQuery.refetch(); }}
        >
          <Table rowKey="id" columns={columns} dataSource={invoices} pagination={false} scroll={{ x: 1230 }} />
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
