import { Card, Select, Table } from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { formatDateTime } from '../../../../lib/format';
import { useAuditLogs } from '../../hooks/useAuditQueries';
import { AuditLogRow } from '../../types/audit.types';
import styles from './AuditLogsPage.module.css';

export function AuditLogsPage() {
  const auditQuery = useAuditLogs();
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');

  const actionOptions = useMemo(() => {
    const values = [...new Set((auditQuery.data ?? []).map((item) => item.action))];
    return [{ value: 'ALL', label: 'All actions' }, ...values.map((value) => ({ value, label: value }))];
  }, [auditQuery.data]);

  const entityOptions = useMemo(() => {
    const values = [...new Set((auditQuery.data ?? []).map((item) => item.entityType))];
    return [{ value: 'ALL', label: 'All entities' }, ...values.map((value) => ({ value, label: value }))];
  }, [auditQuery.data]);

  const dataSource = useMemo(
    () =>
      (auditQuery.data ?? []).filter((item) => {
        const actionMatch = actionFilter === 'ALL' || item.action === actionFilter;
        const entityMatch = entityFilter === 'ALL' || item.entityType === entityFilter;
        return actionMatch && entityMatch;
      }),
    [actionFilter, auditQuery.data, entityFilter],
  );

  return (
    <div className={styles.page}>
      <PageHeader title="Audit Logs" subtitle="Trace who did what, to which entity, and when." />

      <Card className={`panel-card table-panel-card ${styles.auditCard}`}>
        <div className={styles.toolbar}>
          <Select
            className={styles.filter}
            value={actionFilter}
            onChange={setActionFilter}
            options={actionOptions}
          />
          <Select
            className={styles.filter}
            value={entityFilter}
            onChange={setEntityFilter}
            options={entityOptions}
          />
        </div>

        <QueryState isLoading={auditQuery.isLoading} isError={auditQuery.isError} error={auditQuery.error} hasData={dataSource.length > 0}>
          <Table<AuditLogRow>
            rowKey="id"
            size="small"
            dataSource={dataSource}
            columns={[
              { title: 'Actor', render: (_, record) => record.actorName },
              { title: 'Action', dataIndex: 'action' },
              { title: 'Entity', dataIndex: 'entityType' },
              { title: 'Entity ID', dataIndex: 'entityId' },
              { title: 'Time', dataIndex: 'createdAt', render: (value) => formatDateTime(value) },
            ]}
          />
        </QueryState>
      </Card>
    </div>
  );
}
