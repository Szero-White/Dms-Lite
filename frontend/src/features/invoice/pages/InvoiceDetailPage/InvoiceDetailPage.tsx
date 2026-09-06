import { CloseOutlined, DownloadOutlined, LeftOutlined, SendOutlined } from '@ant-design/icons';
import { App, Button, Card, Descriptions, Progress, Space, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { formatCurrency, formatDate, getErrorMessage, toNumber } from '../../../../lib/format';
import { PERMISSIONS, canViewInvoiceReceivableState, hasPermission, useAuth } from '../../../auth';
import { InvoiceStatusTag } from '../../InvoiceStatusTag';
import { downloadInvoicePdf } from '../../api/invoiceService';
import { useCancelInvoice, useInvoice, useIssueInvoice } from '../../hooks/useInvoiceQueries';
import type { InvoiceItem } from '../../types/invoice.types';
import styles from './InvoiceDetailPage.module.css';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = Number(id);
  const { user } = useAuth();
  const { i18n, t } = useTranslation();
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const invoiceQuery = useInvoice(Number.isFinite(invoiceId) ? invoiceId : undefined);
  const issueMutation = useIssueInvoice();
  const cancelMutation = useCancelInvoice();
  const invoice = invoiceQuery.data;
  const canIssue = hasPermission(user, PERMISSIONS.INVOICE_ISSUE);
  const canCancel = hasPermission(user, PERMISSIONS.INVOICE_CANCEL);
  const canViewReceivableState = canViewInvoiceReceivableState(user);
  const progress = invoice && canViewReceivableState && toNumber(invoice.totalAmount) > 0
    ? Math.min(100, Math.round((toNumber(invoice.paidAmount) / toNumber(invoice.totalAmount)) * 100))
    : 0;

  async function handlePdf() {
    if (!invoice) return;
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

  const columns = useMemo<TableColumnsType<InvoiceItem>>(() => [
    {
      title: t('invoice.item.product'),
      dataIndex: 'productName',
      render: (value, item) => (
        <div className={styles.productCell}>
          <Typography.Text strong>{value ?? t('invoice.productFallback')}</Typography.Text>
          <Typography.Text type="secondary">{item.productCode ?? '-'}</Typography.Text>
        </div>
      ),
    },
    { title: t('invoice.item.quantity'), dataIndex: 'quantity', width: 90, align: 'right' },
    { title: t('invoice.item.unitPrice'), dataIndex: 'unitPrice', width: 140, align: 'right', render: (v) => formatCurrency(v, i18n.language) },
    { title: t('invoice.item.discount'), dataIndex: 'discountAmount', width: 130, align: 'right', render: (v) => formatCurrency(v, i18n.language) },
    { title: t('invoice.item.total'), dataIndex: 'lineTotal', width: 140, align: 'right', render: (v) => formatCurrency(v, i18n.language) },
  ], [i18n.language, t]);

  return (
    <QueryState
      isLoading={invoiceQuery.isLoading}
      isError={Boolean(invoiceQuery.error)}
      error={invoiceQuery.error}
      hasData={Boolean(invoice)}
      emptyTitle={t('invoice.notFound')}
      emptyDescription={t('common.tryAgain')}
      onRetry={() => { void invoiceQuery.refetch(); }}
    >
      {invoice ? (
        <div className={styles.page}>
          <PageHeader
            title={invoice.invoiceNumber}
            subtitle={`${invoice.customerName ?? t('invoice.customerFallback', { id: invoice.customerId })} · ${invoice.salesOrderCode ?? '-'}`}
            breadcrumb={[t('invoice.title'), invoice.invoiceNumber]}
            extra={(
              <Space wrap>
                <Button icon={<LeftOutlined />} onClick={() => navigate('/invoices')}>{t('common.back')}</Button>
                {canIssue && invoice.status === 'DRAFT' ? (
                  <Button type="primary" icon={<SendOutlined />} loading={issueMutation.isPending} onClick={() => issueMutation.mutate(invoice.id)}>
                    {t('invoice.action.issue')}
                  </Button>
                ) : null}
                {canCancel && ['DRAFT', 'ISSUED', 'OVERDUE'].includes(invoice.status) ? (
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    loading={cancelMutation.isPending}
                    onClick={() => modal.confirm({
                      title: t('invoice.cancel.title'),
                      content: t('invoice.cancel.description'),
                      okText: t('invoice.action.cancel'),
                      okButtonProps: { danger: true },
                      onOk: () => cancelMutation.mutateAsync(invoice.id),
                    })}
                  >
                    {t('invoice.action.cancel')}
                  </Button>
                ) : null}
                {['ISSUED', 'PAID', 'OVERDUE'].includes(invoice.status) ? (
                  <Button icon={<DownloadOutlined />} onClick={() => void handlePdf()}>{t('invoice.action.pdf')}</Button>
                ) : null}
              </Space>
            )}
          />

          <div className={styles.summaryGrid}>
            <Card className="panel-card">
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label={t('common.status')}><InvoiceStatusTag status={invoice.status} /></Descriptions.Item>
                <Descriptions.Item label={t('invoice.column.issueDate')}>{invoice.issueDate ? formatDate(invoice.issueDate, i18n.language) : '-'}</Descriptions.Item>
                <Descriptions.Item label={t('invoice.column.dueDate')}>{invoice.dueDate ? formatDate(invoice.dueDate, i18n.language) : '-'}</Descriptions.Item>
                <Descriptions.Item label={t('invoice.column.order')}>{invoice.salesOrderCode ?? '-'}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Card className="panel-card">
              <div className={styles.financeBlock}>
                <div><span>{t('invoice.column.total')}</span><strong>{formatCurrency(invoice.totalAmount, i18n.language)}</strong></div>
                {canViewReceivableState ? (
                  <>
                    <div><span>{t('invoice.column.paid')}</span><strong>{formatCurrency(invoice.paidAmount, i18n.language)}</strong></div>
                    <div><span>{t('invoice.column.remaining')}</span><strong>{formatCurrency(invoice.remainingAmount, i18n.language)}</strong></div>
                    <Progress percent={progress} />
                    <Typography.Text type="secondary">{t('invoice.paymentSourceNotice')}</Typography.Text>
                  </>
                ) : null}
              </div>
            </Card>
          </div>

          <Card className="panel-card" title={t('invoice.itemsTitle')}>
            <Table rowKey="id" columns={columns} dataSource={invoice.items} pagination={false} scroll={{ x: 760 }} />
          </Card>
        </div>
      ) : null}
    </QueryState>
  );
}
