import {
  CalendarOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  DownloadOutlined,
  LeftOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Button, Card, Descriptions, Input, Progress, Space, Table, Tag, Typography } from 'antd';
import { useMemo, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { SummaryCard } from '../../../../components/common/SummaryCard';
import { formatCurrency, formatDate } from '../../../../lib/format';
import { useInvoice, useCancelInvoice, useIssueInvoice, useRecordInvoicePayment } from '../../hooks/useInvoiceQueries';
import { InvoiceStatusBadge } from '../InvoicesPage/components/InvoiceStatusBadge';
import styles from './InvoiceDetailPage.module.css';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const invoiceId = Number(id);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  const { data: invoice, isLoading, error, refetch } = useInvoice(invoiceId);
  const cancelInvoiceMutation = useCancelInvoice();
  const issueInvoiceMutation = useIssueInvoice();
  const recordPaymentMutation = useRecordInvoicePayment();

  const issueDate = invoice?.issueDate ? formatDate(invoice.issueDate, i18n.language) : '-';
  const dueDate = invoice?.dueDate ? formatDate(invoice.dueDate, i18n.language) : '-';
  const subtotal = Number(invoice?.subtotal || 0);
  const taxAmount = Number(invoice?.taxAmount || 0);
  const discountAmount = Number(invoice?.discountAmount || 0);
  const totalAmount = Number(invoice?.totalAmount || 0);
  const paidAmount = Number(invoice?.paidAmount || 0);
  const remainingAmount = Number(invoice?.remainingAmount || 0);
  const paidProgress = totalAmount > 0 ? Math.min(Math.round((paidAmount / totalAmount) * 100), 100) : 0;

  const itemColumns = useMemo(() => ([
    {
      title: t('invoice.detail.product'),
      dataIndex: 'productName',
      key: 'productName',
      render: (_: unknown, item: NonNullable<typeof invoice>['items'][number]) => (
        <div className={styles.productCell}>
          <Typography.Text strong>{item.productName || t('invoice.common.productFallback')}</Typography.Text>
          {item.productCode ? (
            <Typography.Text type="secondary" className={styles.productCode}>{item.productCode}</Typography.Text>
          ) : null}
        </div>
      ),
    },
    {
      title: t('invoice.detail.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
    },
    {
      title: t('invoice.detail.unitPrice'),
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right' as const,
      render: (value: string | number | null | undefined) => formatCurrency(value, i18n.language),
    },
    {
      title: t('invoice.detail.discount'),
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      align: 'right' as const,
      render: (value: string | number | null | undefined) => formatCurrency(value, i18n.language),
    },
    {
      title: t('invoice.detail.tax'),
      dataIndex: 'taxAmount',
      key: 'taxAmount',
      align: 'right' as const,
      render: (value: string | number | null | undefined) => formatCurrency(value, i18n.language),
    },
    {
      title: t('invoice.detail.total'),
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      align: 'right' as const,
      render: (value: string | number | null | undefined) => formatCurrency(value, i18n.language),
    },
  ]), [i18n.language, t]);

  const handleCancelInvoice = () => {
    if (window.confirm(t('invoice.detail.cancelConfirm'))) {
      cancelInvoiceMutation.mutate(invoiceId);
    }
  };

  const handleIssueInvoice = () => {
    issueInvoiceMutation.mutate(invoiceId);
  };

  const handleRecordPayment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    
    if (amount <= 0) {
      alert(t('invoice.detail.validation.paymentAmount'));
      return;
    }

    if (amount > Number(invoice?.remainingAmount || 0)) {
      alert(t('invoice.detail.validation.exceedsRemaining'));
      return;
    }

    recordPaymentMutation.mutate(
      { invoiceId, payload: { amount } },
      {
        onSuccess: () => {
          setPaymentAmount('');
          alert(t('invoice.detail.paymentSuccess'));
        },
      }
    );
  };

  const handleDownloadPdf = async () => {
    try {
      const { generateInvoicePdf } = await import('../../api/invoiceService');
      const blob = await generateInvoicePdf(invoiceId);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice?.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert(t('invoice.detail.downloadFailed'));
    }
  };

  return (
    <QueryState
      isLoading={isLoading}
      isError={Boolean(error)}
      error={error}
      hasData={Boolean(invoice)}
      emptyTitle={t('invoice.detail.notFound')}
      emptyDescription={t('common.tryAgain')}
      emptyAction={<Button onClick={() => navigate('/invoices')}>{t('invoice.detail.backToInvoices')}</Button>}
      onRetry={() => { void refetch(); }}
    >
      {invoice ? (
        <div className={styles.page}>
          <PageHeader
            title={t('invoice.detail.title', { number: invoice.invoiceNumber })}
            subtitle={`${invoice.customerName || t('invoice.common.customerFallback', { id: invoice.customerId })} · ${issueDate}`}
            breadcrumb={[t('invoice.list.title'), invoice.invoiceNumber]}
            extra={(
              <Space wrap className={styles.headerActions}>
                <Button icon={<LeftOutlined />} onClick={() => navigate('/invoices')}>
                  {t('invoice.detail.backToInvoices')}
                </Button>
                {invoice.status === 'DRAFT' ? (
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    onClick={handleIssueInvoice}
                    loading={issueInvoiceMutation.isPending}
                  >
                    {t('invoice.detail.issueInvoice')}
                  </Button>
                ) : null}
                {(invoice.status === 'DRAFT' || invoice.status === 'ISSUED') ? (
                  <Button
                    danger
                    icon={<CheckCircleOutlined />}
                    onClick={handleCancelInvoice}
                    loading={cancelInvoiceMutation.isPending}
                  >
                    {t('invoice.detail.cancelInvoice')}
                  </Button>
                ) : null}
                {invoice.status === 'ISSUED' ? (
                  <Button
                    type="primary"
                    ghost
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadPdf}
                  >
                    {t('invoice.detail.downloadPdf')}
                  </Button>
                ) : null}
              </Space>
            )}
          />

          <div className={styles.content}>
            <Card className={`panel-card ${styles.heroCard}`}>
              <div className={styles.heroLayout}>
                <div className={styles.heroCopy}>
                  <div className={styles.statusRow}>
                    <InvoiceStatusBadge status={invoice.status} />
                    <Tag className={styles.metaTag} icon={<CalendarOutlined />}>
                      {issueDate}
                    </Tag>
                  </div>

                  <Typography.Title level={2} className={styles.heroTitle}>
                    {invoice.invoiceNumber}
                  </Typography.Title>

                  <div className={styles.heroMeta}>
                    <span>{t('invoice.detail.customer')}: {invoice.customerName || t('invoice.common.customerFallback', { id: invoice.customerId })}</span>
                    <span>•</span>
                    <span>{t('invoice.detail.dueDate')}: {dueDate}</span>
                    <span>•</span>
                    <span>{t('invoice.detail.taxRate')}: {invoice.taxRate || '-'}</span>
                  </div>

                  {invoice.notes ? (
                    <div className={styles.notePanel}>
                      <Typography.Text type="secondary" className={styles.noteLabel}>
                        {t('invoice.detail.notes')}
                      </Typography.Text>
                      <Typography.Paragraph className={styles.noteText}>
                        {invoice.notes}
                      </Typography.Paragraph>
                    </div>
                  ) : null}
                </div>

                <div className={styles.heroSummary}>
                  <div className={styles.heroSummaryMain}>
                    <Typography.Text type="secondary">{t('invoice.detail.totalAmount')}</Typography.Text>
                    <Typography.Title level={3}>{formatCurrency(totalAmount, i18n.language)}</Typography.Title>
                    <Typography.Text type="secondary">{t('invoice.detail.financialSummary')}</Typography.Text>
                  </div>

                  <div className={styles.heroSummaryProgress}>
                    <div className={styles.summaryProgressHeader}>
                      <span>{t('invoice.detail.paidAmount')}</span>
                      <strong>{formatCurrency(paidAmount, i18n.language)}</strong>
                    </div>
                    <Progress percent={paidProgress} showInfo={false} strokeColor="var(--color-primary)" />
                    <div className={styles.summaryProgressFooter}>
                      <span>{t('invoice.detail.remaining')}</span>
                      <strong>{formatCurrency(remainingAmount, i18n.language)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className={styles.metricsGrid}>
              <SummaryCard
                title={t('invoice.detail.subtotal')}
                value={formatCurrency(subtotal, i18n.language)}
                note={t('invoice.detail.detailsTitle')}
                icon={<DollarOutlined />}
                variant="blue"
                visual="dashboard"
              />
              <SummaryCard
                title={t('invoice.detail.taxAmount')}
                value={formatCurrency(taxAmount, i18n.language)}
                note={t('invoice.detail.taxRate')}
                icon={<SafetyCertificateOutlined />}
                variant="orange"
                visual="dashboard"
              />
              <SummaryCard
                title={t('invoice.detail.paidAmount')}
                value={formatCurrency(paidAmount, i18n.language)}
                note={t('invoice.detail.remaining')}
                icon={<CheckCircleOutlined />}
                variant="green"
                visual="dashboard"
              />
            </div>

            <div className={styles.detailGrid}>
              <Card className={`panel-card ${styles.sectionCard}`} title={t('invoice.detail.detailsTitle')}>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label={t('invoice.detail.customer')}>
                    {invoice.customerName || t('invoice.common.customerFallback', { id: invoice.customerId })}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('invoice.detail.issueDate')}>
                    {issueDate}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('invoice.detail.dueDate')}>
                    {dueDate}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('invoice.detail.taxRate')}>
                    {invoice.taxRate || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('invoice.detail.notes')}>
                    {invoice.notes || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card className={`panel-card ${styles.sectionCard}`} title={t('invoice.detail.financialSummary')}>
                <div className={styles.financeStack}>
                  <div className={styles.financeRow}>
                    <span>{t('invoice.detail.subtotal')}</span>
                    <strong>{formatCurrency(subtotal, i18n.language)}</strong>
                  </div>
                  <div className={styles.financeRow}>
                    <span>{t('invoice.detail.taxAmount')}</span>
                    <strong>{formatCurrency(taxAmount, i18n.language)}</strong>
                  </div>
                  <div className={styles.financeRow}>
                    <span>{t('invoice.detail.discount')}</span>
                    <strong>-{formatCurrency(discountAmount, i18n.language)}</strong>
                  </div>
                  <div className={`${styles.financeRow} ${styles.financeRowTotal}`}>
                    <span>{t('invoice.detail.totalAmount')}</span>
                    <strong>{formatCurrency(totalAmount, i18n.language)}</strong>
                  </div>
                  <div className={styles.financeRow}>
                    <span>{t('invoice.detail.paidAmount')}</span>
                    <strong className={styles.paidAmount}>{formatCurrency(paidAmount, i18n.language)}</strong>
                  </div>
                  <div className={styles.financeRow}>
                    <span>{t('invoice.detail.remaining')}</span>
                    <strong className={styles.remainingAmount}>{formatCurrency(remainingAmount, i18n.language)}</strong>
                  </div>
                </div>
              </Card>
            </div>

            {invoice.status === 'ISSUED' && remainingAmount > 0 ? (
              <Card className={`panel-card ${styles.paymentCard}`} title={t('invoice.detail.recordPayment')}>
                <form onSubmit={handleRecordPayment} className={styles.paymentForm}>
                  <div className={styles.paymentCopy}>
                    <Typography.Text type="secondary">
                      {t('invoice.detail.maximum', { amount: formatCurrency(remainingAmount, i18n.language) })}
                    </Typography.Text>
                    <Typography.Text>
                      {t('invoice.detail.paymentAmount')}
                    </Typography.Text>
                  </div>

                  <div className={styles.paymentControls}>
                    <Input
                      id="paymentAmount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={remainingAmount}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={t('invoice.detail.paymentAmountPlaceholder')}
                      aria-label={t('invoice.detail.paymentAmount')}
                    />
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<DollarOutlined />}
                      loading={recordPaymentMutation.isPending}
                    >
                      {recordPaymentMutation.isPending ? t('invoice.detail.recording') : t('invoice.detail.recordPaymentAction')}
                    </Button>
                  </div>
                </form>
              </Card>
            ) : null}

            <Card className={`panel-card ${styles.sectionCard}`} title={t('invoice.detail.itemsTitle')}>
              <Table
                rowKey={(record) => String(record.id ?? `${record.productId}-${record.productName}`)}
                columns={itemColumns}
                dataSource={invoice.items ?? []}
                pagination={false}
                sticky
                scroll={{ x: 920 }}
                locale={{ emptyText: t('common.noDataYet') }}
              />
            </Card>
          </div>
        </div>
      ) : null}
    </QueryState>
  );
}