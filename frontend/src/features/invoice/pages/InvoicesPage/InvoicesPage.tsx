import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  FilePdfOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Alert, Button, Card, Popconfirm, Space, Table, Tooltip, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { SummaryCard } from '../../../../components/common/SummaryCard';
import { formatCurrency, formatDate, toNumber } from '../../../../lib/format';
import { useCancelInvoice, useInvoices, useIssueInvoice } from '../../hooks/useInvoiceQueries';
import type { Invoice } from '../../types/invoice.types';
import { InvoiceStatusBadge } from './components/InvoiceStatusBadge';
import styles from './InvoicesPage.module.css';

const INVOICE_DRAFT_STORAGE_KEY = 'dms.invoice.createDraft';

export function InvoicesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const invoicesQuery = useInvoices(page);
  const { data: invoicesData, isLoading, error } = invoicesQuery;
  const cancelInvoiceMutation = useCancelInvoice();
  const issueInvoiceMutation = useIssueInvoice();
  const invoices = invoicesData?.content ?? [];
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const syncDraftState = () => {
      if (typeof window === 'undefined') {
        setHasDraft(false);
        return;
      }

      setHasDraft(Boolean(window.localStorage.getItem(INVOICE_DRAFT_STORAGE_KEY)));
    };

    syncDraftState();
    window.addEventListener('storage', syncDraftState);

    return () => {
      window.removeEventListener('storage', syncDraftState);
    };
  }, []);

  const totalInvoices = invoicesData?.totalElements ?? invoices.length;
  const totalAmount = invoices.reduce((sum, invoice) => sum + toNumber(invoice.totalAmount), 0);
  const paidAmount = invoices.reduce((sum, invoice) => sum + toNumber(invoice.paidAmount), 0);
  const remainingAmount = invoices.reduce(
    (sum, invoice) => sum + toNumber(invoice.remainingAmount),
    0,
  );
  const issuedCount = invoices.filter((invoice) => invoice.status === 'ISSUED').length;
  const draftCount = invoices.filter((invoice) => invoice.status === 'DRAFT').length;

  const handleCancelInvoice = (invoiceId: number) => {
    if (window.confirm(t('invoice.list.cancelConfirm'))) {
      cancelInvoiceMutation.mutate(invoiceId);
    }
  };

  const handleIssueInvoice = (invoiceId: number) => {
    issueInvoiceMutation.mutate(invoiceId);
  };

  const handleDownloadPdf = async (invoiceId: number, invoiceNumber: string) => {
    try {
      const { generateInvoicePdf } = await import('../../api/invoiceService');
      const blob = await generateInvoicePdf(invoiceId);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert(t('invoice.list.downloadFailed'));
    }
  };

  const openInvoice = (invoiceId: number) => {
    navigate(`/invoices/${invoiceId}`);
  };

  const columns: TableColumnsType<Invoice> = [
    {
      title: t('invoice.list.invoiceNumber'),
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 180,
      render: (value: string, record) => (
        <div className={styles.invoiceCell}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">#{record.id}</Typography.Text>
        </div>
      ),
    },
    {
      title: t('invoice.list.customer'),
      dataIndex: 'customerName',
      key: 'customerName',
      width: 220,
      render: (value: string, record) => (
        <div className={styles.customerCell}>
          <Typography.Text strong>{value || t('invoice.common.customerFallback', { id: record.customerId })}</Typography.Text>
          <Typography.Text type="secondary">{record.customerTaxCode || t('common.na')}</Typography.Text>
        </div>
      ),
    },
    {
      title: t('invoice.list.status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (_: unknown, record) => <InvoiceStatusBadge status={record.status} />,
    },
    {
      title: t('invoice.list.issueDate'),
      dataIndex: 'issueDate',
      key: 'issueDate',
      width: 150,
      render: (value: string) => formatDate(value),
    },
    {
      title: t('invoice.list.dueDate'),
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 150,
      render: (value: string) => formatDate(value),
    },
    {
      title: t('invoice.list.totalAmount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 160,
      align: 'right' as const,
      render: (value: number) => <Typography.Text strong>{formatCurrency(value)}</Typography.Text>,
    },
    {
      title: t('invoice.list.paidAmount'),
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 160,
      align: 'right' as const,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: t('invoice.list.remaining'),
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      width: 160,
      align: 'right' as const,
      render: (value: number) => (
        <Typography.Text className={toNumber(value) > 0 ? styles.remainingAmount : styles.zeroAmount}>
          {formatCurrency(value)}
        </Typography.Text>
      ),
    },
    {
      title: t('invoice.list.actions'),
      key: 'actions',
      fixed: 'right' as const,
      width: 180,
      render: (_: unknown, record) => (
        <Space size={4} className={styles.rowActions}>
          <Tooltip title={t('common.view')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              aria-label={t('common.view')}
              onClick={() => openInvoice(record.id)}
            />
          </Tooltip>
          {record.status === 'DRAFT' ? (
            <Tooltip title={t('invoice.list.issue')}>
              <Button
                type="text"
                icon={<CheckOutlined />}
                aria-label={t('invoice.list.issue')}
                loading={issueInvoiceMutation.isPending}
                onClick={() => issueInvoiceMutation.mutate(record.id)}
              />
            </Tooltip>
          ) : null}
          {(record.status === 'DRAFT' || record.status === 'ISSUED') ? (
            <Popconfirm
              title={t('invoice.list.cancelConfirm')}
              okText={t('common.confirm')}
              cancelText={t('common.cancel')}
              onConfirm={() => handleCancelInvoice(record.id)}
            >
              <Tooltip title={t('invoice.list.cancel')}>
                <Button
                  type="text"
                  danger
                  icon={<CloseOutlined />}
                  aria-label={t('invoice.list.cancel')}
                  loading={cancelInvoiceMutation.isPending}
                />
              </Tooltip>
            </Popconfirm>
          ) : null}
          {record.status === 'ISSUED' ? (
            <Tooltip title={t('invoice.list.pdf')}>
              <Button
                type="text"
                icon={<FilePdfOutlined />}
                aria-label={t('invoice.list.pdf')}
                onClick={() => handleDownloadPdf(record.id, record.invoiceNumber)}
              />
            </Tooltip>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('invoice.list.title')}
        subtitle={t('invoice.list.subtitle')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/invoices/new')}>
            {t('invoice.list.create')}
          </Button>
        }
      />

      <div className={styles.summaryGrid}>
        <SummaryCard
          title={t('invoice.list.summary.totalInvoices')}
          value={totalInvoices}
          note={t('invoice.list.summary.totalInvoicesNote')}
          variant="blue"
        />
        <SummaryCard
          title={t('invoice.list.summary.issuedInvoices')}
          value={issuedCount}
          note={t('invoice.list.summary.issuedInvoicesNote')}
          variant="green"
        />
        <SummaryCard
          title={t('invoice.list.summary.totalAmount')}
          value={formatCurrency(totalAmount)}
          note={t('invoice.list.summary.totalAmountNote')}
          variant="purple"
        />
        <SummaryCard
          title={t('invoice.list.summary.remainingAmount')}
          value={formatCurrency(remainingAmount)}
          note={t('invoice.list.summary.remainingAmountNote')}
          variant="orange"
        />
      </div>

      {hasDraft ? (
        <Alert
          className={styles.draftAlert}
          type="info"
          showIcon
          message={t('invoice.list.draftNotice')}
          description={t('invoice.list.draftDescription')}
          action={(
            <Space>
              <Button type="primary" onClick={() => navigate('/invoices/new')}>
                {t('invoice.list.resumeDraft')}
              </Button>
              <Button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.localStorage.removeItem(INVOICE_DRAFT_STORAGE_KEY);
                  }
                  setHasDraft(false);
                }}
              >
                {t('invoice.list.clearDraft')}
              </Button>
            </Space>
          )}
        />
      ) : null}

      <Card className={`panel-card ${styles.tableCard}`}>
        <div className={styles.toolbar}>
          <Typography.Text type="secondary">
            {t('invoice.list.toolbar', { total: totalInvoices, draft: draftCount })}
          </Typography.Text>
        </div>

        <QueryState
          isLoading={isLoading}
          isError={Boolean(error)}
          error={error}
          hasData={invoices.length > 0}
          emptyTitle={t('invoice.list.empty')}
          emptyDescription={t('invoice.list.emptyDescription')}
          emptyAction={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/invoices/new')}>
              {t('invoice.list.create')}
            </Button>
          }
          onRetry={() => {
            void invoicesQuery.refetch();
          }}
        >
          <Table
            className={styles.table}
            rowKey="id"
            sticky
            scroll={{ x: 1260 }}
            pagination={false}
            dataSource={invoices}
            columns={columns}
          />
        </QueryState>

        {invoicesData && invoicesData.totalPages > 1 ? (
          <div className={styles.pagination}>
            <Button onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))} disabled={page === 0}>
              {t('invoice.list.previous')}
            </Button>
            <Typography.Text className={styles.pageInfo}>
              {t('invoice.list.pageInfo', { page: page + 1, total: invoicesData.totalPages })}
            </Typography.Text>
            <Button
              onClick={() => setPage((currentPage) => Math.min(currentPage + 1, invoicesData.totalPages - 1))}
              disabled={page >= invoicesData.totalPages - 1}
            >
              {t('invoice.list.next')}
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}