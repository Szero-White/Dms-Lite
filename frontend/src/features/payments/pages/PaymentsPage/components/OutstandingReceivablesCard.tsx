import { Card, Pagination, Table, Typography } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QueryState } from '../../../../../components/common/QueryState';
import { useOutstandingPaymentOrders } from '../../../hooks/usePaymentQueries';
import type {
  OutstandingPaymentFilters,
  OutstandingPaymentOrder,
} from '../../../types/payment.types';
import { OutstandingReceivableFilters } from './OutstandingReceivableFilters';
import { ALL_DUE_STATUSES } from './receivableDueStatusOptions';
import { useOutstandingReceivableColumns } from './useOutstandingReceivableColumns';
import styles from '../PaymentsPage.module.css';

interface OutstandingReceivablesCardProps {
  enabled: boolean;
  onRecordPayment: (order: OutstandingPaymentOrder) => void;
}

export function OutstandingReceivablesCard({
  enabled,
  onRecordPayment,
}: OutstandingReceivablesCardProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<OutstandingPaymentFilters>({
    search: '',
    dueStatuses: ALL_DUE_STATUSES,
  });
  const query = useOutstandingPaymentOrders(page, filters, { enabled });
  const columns = useOutstandingReceivableColumns(onRecordPayment);

  function updateFilters(patch: Partial<OutstandingPaymentFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(0);
  }

  function resetFilters() {
    setFilters({ search: '', dueStatuses: ALL_DUE_STATUSES });
    setPage(0);
  }

  return (
    <Card className={`panel-card ${styles.watchlistCard}`} title={t('payments.outstanding.title')}>
      <div className={styles.toolbar}>
        <Typography.Text type="secondary">
          {t('payments.outstanding.count', { count: query.data?.totalElements ?? 0 })}
        </Typography.Text>
      </div>

      <OutstandingReceivableFilters
        filters={filters}
        onChange={updateFilters}
        onReset={resetFilters}
      />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        hasData={Boolean(query.data?.content.length)}
        emptyTitle={t('payments.outstanding.emptyTitle')}
        emptyDescription={t('payments.outstanding.emptyDescription')}
        onRetry={() => query.refetch()}
      >
        <Table
          rowKey="salesOrderId"
          pagination={false}
          scroll={{ x: 1260 }}
          dataSource={query.data?.content ?? []}
          rowClassName={(order) => order.dueStatus === 'OVERDUE' ? styles.overdueRow : ''}
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
