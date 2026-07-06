import { Card, Select, Space, Table } from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { QueryState } from '../../components/common/QueryState';
import { useAuditLogs } from '../../hooks/useAppQueries';
import { formatDateTime } from '../../lib/format';

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
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader title="Audit Logs" subtitle="Trace who did what, to which entity, and when." />

      <Card className="panel-card">
        <Space wrap style={{ marginBottom: 16 }}>
          <Select value={actionFilter} style={{ width: 220 }} onChange={setActionFilter} options={actionOptions} />
          <Select value={entityFilter} style={{ width: 220 }} onChange={setEntityFilter} options={entityOptions} />
        </Space>

        <QueryState isLoading={auditQuery.isLoading} isError={auditQuery.isError} error={auditQuery.error} hasData={dataSource.length > 0}>
          <Table
            rowKey="id"
            dataSource={dataSource}
            columns={[
              { title: 'Actor', render: (_, record: any) => record.actorName },
              { title: 'Action', dataIndex: 'action' },
              { title: 'Entity', dataIndex: 'entityType' },
              { title: 'Entity ID', dataIndex: 'entityId' },
              { title: 'Time', dataIndex: 'createdAt', render: (value) => formatDateTime(value) },
            ]}
          />
        </QueryState>
      </Card>
    </Space>
  );
}
