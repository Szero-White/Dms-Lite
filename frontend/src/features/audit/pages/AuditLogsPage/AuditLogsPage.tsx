import { EyeOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Select,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { SummaryCard } from '../../../../components/common/SummaryCard';
import { formatDateTime } from '../../../../lib/format';
import { useAuditLogs } from '../../hooks/useAuditQueries';
import { AuditLogRow } from '../../types/audit.types';
import styles from './AuditLogsPage.module.css';

export function AuditLogsPage() {
  const auditQuery = useAuditLogs();
  const [actorFilter, setActorFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<[number, number] | null>(null);
  const [datePickerKey, setDatePickerKey] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);
  const auditLogs = auditQuery.data ?? [];

  const actorOptions = useMemo(() => {
    const values = [...new Set(auditLogs.map((item) => item.actorName))];
    return [{ value: 'ALL', label: 'All actors' }, ...values.map((value) => ({ value, label: value }))];
  }, [auditLogs]);

  const actionOptions = useMemo(() => {
    const values = [...new Set(auditLogs.map((item) => item.action))];
    return [{ value: 'ALL', label: 'All actions' }, ...values.map((value) => ({ value, label: value }))];
  }, [auditLogs]);

  const entityOptions = useMemo(() => {
    const values = [...new Set(auditLogs.map((item) => item.entityType))];
    return [{ value: 'ALL', label: 'All entities' }, ...values.map((value) => ({ value, label: value }))];
  }, [auditLogs]);

  const dataSource = useMemo(
    () => auditLogs.filter((item) => {
      const actorMatch = actorFilter === 'ALL' || item.actorName === actorFilter;
      const actionMatch = actionFilter === 'ALL' || item.action === actionFilter;
      const entityMatch = entityFilter === 'ALL' || item.entityType === entityFilter;
      const createdAt = new Date(item.createdAt).getTime();
      const dateMatch = !dateRange || (createdAt >= dateRange[0] && createdAt <= dateRange[1]);

      return actorMatch && actionMatch && entityMatch && dateMatch;
    }),
    [actionFilter, actorFilter, auditLogs, dateRange, entityFilter],
  );
  const hasFilters = actorFilter !== 'ALL' ||
    actionFilter !== 'ALL' ||
    entityFilter !== 'ALL' ||
    Boolean(dateRange);

  function clearFilters() {
    setActorFilter('ALL');
    setActionFilter('ALL');
    setEntityFilter('ALL');
    setDateRange(null);
    setDatePickerKey((currentKey) => currentKey + 1);
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Audit Logs" subtitle="Trace who did what, to which entity, and when." />

      <div className={styles.metricsGrid}>
        <SummaryCard
          title="Activity Count"
          value={auditLogs.length}
          note="Audit events in the current dataset"
        />
        <SummaryCard
          title="Actors"
          value={new Set(auditLogs.map((item) => item.actorName)).size}
          note="Distinct users represented in activity"
        />
        <SummaryCard
          title="Entity Types"
          value={new Set(auditLogs.map((item) => item.entityType)).size}
          note="Business resources covered by auditing"
        />
      </div>

      <Card className={`panel-card table-panel-card ${styles.auditCard}`}>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <Select
              className={styles.filter}
              value={actorFilter}
              onChange={setActorFilter}
              options={actorOptions}
            />
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
            <DatePicker.RangePicker
              key={datePickerKey}
              className={styles.dateFilter}
              allowClear
              onChange={(values) => {
                if (!values?.[0] || !values[1]) {
                  setDateRange(null);
                  return;
                }

                setDateRange([
                  values[0].startOf('day').valueOf(),
                  values[1].endOf('day').valueOf(),
                ]);
              }}
            />
          </div>
          <Button disabled={!hasFilters} onClick={clearFilters}>Clear filters</Button>
        </div>

        <QueryState
          isLoading={auditQuery.isLoading}
          isError={auditQuery.isError}
          error={auditQuery.error}
          hasData={dataSource.length > 0}
          emptyTitle={hasFilters ? 'No audit events match these filters' : 'No audit activity yet'}
          emptyDescription={hasFilters
            ? 'Adjust or clear filters to review more activity.'
            : 'System activity will appear here when actions are recorded.'}
          emptyAction={hasFilters ? <Button onClick={clearFilters}>Clear filters</Button> : null}
          onRetry={() => auditQuery.refetch()}
        >
          <Table<AuditLogRow>
            rowKey="id"
            size="small"
            sticky
            scroll={{ x: 980 }}
            dataSource={dataSource}
            columns={[
              { title: 'Actor', dataIndex: 'actorName', width: 180 },
              {
                title: 'Action',
                dataIndex: 'action',
                width: 160,
                render: (value) => <Tag color="blue">{value}</Tag>,
              },
              { title: 'Entity', dataIndex: 'entityType', width: 150 },
              { title: 'Entity ID', dataIndex: 'entityId', width: 100, render: (value) => value ?? '--' },
              {
                title: 'Change',
                dataIndex: 'newValue',
                width: 260,
                render: (value?: string) => value ? (
                  <Typography.Text className={styles.changePreview} ellipsis={{ tooltip: false }}>
                    {value}
                  </Typography.Text>
                ) : '--',
              },
              { title: 'Time', dataIndex: 'createdAt', width: 180, render: (value) => formatDateTime(value) },
              {
                title: '',
                fixed: 'right',
                width: 54,
                render: (_, record) => (
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    aria-label={`View audit event ${record.id}`}
                    onClick={() => setSelectedLog(record)}
                  />
                ),
              },
            ]}
          />
        </QueryState>
      </Card>

      <Drawer
        width={520}
        title="Audit Event Detail"
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
      >
        {selectedLog ? (
          <div className={styles.detailContent}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Actor">{selectedLog.actorName}</Descriptions.Item>
              <Descriptions.Item label="Action">{selectedLog.action}</Descriptions.Item>
              <Descriptions.Item label="Entity">{selectedLog.entityType}</Descriptions.Item>
              <Descriptions.Item label="Entity ID">{selectedLog.entityId ?? '--'}</Descriptions.Item>
              <Descriptions.Item label="Time">{formatDateTime(selectedLog.createdAt)}</Descriptions.Item>
            </Descriptions>
            <div>
              <Typography.Title level={5}>Recorded Change</Typography.Title>
              <pre className={styles.changeDetail}>{selectedLog.newValue || 'No change payload recorded.'}</pre>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
