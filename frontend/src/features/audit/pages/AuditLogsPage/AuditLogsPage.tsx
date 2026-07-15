import {
  AuditOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  TeamOutlined,
} from '@ant-design/icons';
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
import { formatDateTime } from '../../../../lib/format';
import { useAuditLogs } from '../../hooks/useAuditQueries';
import { AuditLogRow } from '../../types/audit.types';
import styles from './AuditLogsPage.module.css';

// colour pool for actor avatars
const ACTOR_COLORS = [
  'linear-gradient(135deg,#6366f1,#818cf8)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
  'linear-gradient(135deg,#ef4444,#f87171)',
  'linear-gradient(135deg,#8b5cf6,#a78bfa)',
  'linear-gradient(135deg,#06b6d4,#22d3ee)',
];

export function AuditLogsPage() {
  const auditQuery = useAuditLogs();
  const [actorFilter, setActorFilter]   = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [dateRange, setDateRange]       = useState<[number, number] | null>(null);
  const [datePickerKey, setDatePickerKey] = useState(0);
  const [selectedLog, setSelectedLog]   = useState<AuditLogRow | null>(null);

  const auditLogs = auditQuery.data ?? [];

  const actorOptions = useMemo(() => {
    const vals = [...new Set(auditLogs.map((i) => i.actorName))];
    return [{ value: 'ALL', label: 'All actors' }, ...vals.map((v) => ({ value: v, label: v }))];
  }, [auditLogs]);

  const actionOptions = useMemo(() => {
    const vals = [...new Set(auditLogs.map((i) => i.action))];
    return [{ value: 'ALL', label: 'All actions' }, ...vals.map((v) => ({ value: v, label: v }))];
  }, [auditLogs]);

  const entityOptions = useMemo(() => {
    const vals = [...new Set(auditLogs.map((i) => i.entityType))];
    return [{ value: 'ALL', label: 'All entities' }, ...vals.map((v) => ({ value: v, label: v }))];
  }, [auditLogs]);

  // Actor activity breakdown
  const actorStats = useMemo(() => {
    const map = new Map<string, number>();
    auditLogs.forEach((l) => map.set(l.actorName, (map.get(l.actorName) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [auditLogs]);

  const maxActorCount = actorStats[0]?.[1] ?? 1;

  // Entity breakdown
  const entityStats = useMemo(() => {
    const map = new Map<string, number>();
    auditLogs.forEach((l) => map.set(l.entityType, (map.get(l.entityType) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [auditLogs]);

  const dataSource = useMemo(
    () => auditLogs.filter((item) => {
      const actorMatch  = actorFilter  === 'ALL' || item.actorName  === actorFilter;
      const actionMatch = actionFilter === 'ALL' || item.action     === actionFilter;
      const entityMatch = entityFilter === 'ALL' || item.entityType === entityFilter;
      const ts          = new Date(item.createdAt).getTime();
      const dateMatch   = !dateRange || (ts >= dateRange[0] && ts <= dateRange[1]);
      return actorMatch && actionMatch && entityMatch && dateMatch;
    }),
    [actionFilter, actorFilter, auditLogs, dateRange, entityFilter],
  );

  const hasFilters = actorFilter !== 'ALL' || actionFilter !== 'ALL' || entityFilter !== 'ALL' || Boolean(dateRange);

  function clearFilters() {
    setActorFilter('ALL');
    setActionFilter('ALL');
    setEntityFilter('ALL');
    setDateRange(null);
    setDatePickerKey((k) => k + 1);
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Audit Logs" subtitle="Trace who did what, to which entity, and when." />

      {/* ── Overview strip ── */}
      <div className={styles.overviewStrip}>
        {/* Total events */}
        <div className={styles.stripHero}>
          <div className={styles.stripHeroIcon}><AuditOutlined /></div>
          <div>
            <div className={styles.stripHeroBig}>{auditLogs.length.toLocaleString('vi-VN')}</div>
            <div className={styles.stripHeroLbl}>Total audit events</div>
          </div>
        </div>

        <div className={styles.stripDivider} />

        {/* Actor leaderboard */}
        <div className={styles.stripActors}>
          <div className={styles.stripSectionTitle}>
            <TeamOutlined /> Actor Activity
          </div>
          <div className={styles.actorList}>
            {actorStats.length === 0 && (
              <span className={styles.emptyNote}>No activity yet</span>
            )}
            {actorStats.map(([actor, count], i) => (
              <div key={actor} className={styles.actorRow}>
                <div
                  className={styles.actorAvatar}
                  style={{ background: ACTOR_COLORS[i % ACTOR_COLORS.length] }}
                >
                  {actor.slice(0, 2).toUpperCase()}
                </div>
                <span className={styles.actorName}>{actor}</span>
                <div className={styles.actorBar}>
                  <div
                    className={styles.actorBarFill}
                    style={{
                      width: `${(count / maxActorCount) * 100}%`,
                      background: ACTOR_COLORS[i % ACTOR_COLORS.length],
                    }}
                  />
                </div>
                <span className={styles.actorCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.stripDivider} />

        {/* Entity chips */}
        <div className={styles.stripEntities}>
          <div className={styles.stripSectionTitle}>
            <ClockCircleOutlined /> Entity Coverage
          </div>
          <div className={styles.entityChips}>
            {entityStats.map(([entity, count]) => (
              <button
                key={entity}
                type="button"
                className={`${styles.entityChip} ${entityFilter === entity ? styles.entityChipActive : ''}`}
                onClick={() => setEntityFilter(entityFilter === entity ? 'ALL' : entity)}
              >
                {entity}
                <span className={styles.entityChipCount}>{count}</span>
              </button>
            ))}
            {entityStats.length === 0 && <span className={styles.emptyNote}>No entities yet</span>}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <Card className={`panel-card table-panel-card ${styles.auditCard}`}>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <Select className={styles.filter} value={actorFilter}  onChange={setActorFilter}  options={actorOptions} />
            <Select className={styles.filter} value={actionFilter} onChange={setActionFilter} options={actionOptions} />
            <Select className={styles.filter} value={entityFilter} onChange={setEntityFilter} options={entityOptions} />
            <DatePicker.RangePicker
              key={datePickerKey}
              className={styles.dateFilter}
              allowClear
              onChange={(vals) => {
                if (!vals?.[0] || !vals[1]) { setDateRange(null); return; }
                setDateRange([vals[0].startOf('day').valueOf(), vals[1].endOf('day').valueOf()]);
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
          emptyDescription={hasFilters ? 'Adjust or clear filters.' : 'System activity will appear here when actions are recorded.'}
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
              {
                title: 'Actor', dataIndex: 'actorName', width: 160,
                render: (v: string, _r, i) => (
                  <div className={styles.actorCell}>
                    <div className={styles.actorCellAvatar}
                      style={{ background: ACTOR_COLORS[actorStats.findIndex(([a]) => a === v) % ACTOR_COLORS.length] || ACTOR_COLORS[0] }}>
                      {v.slice(0, 2).toUpperCase()}
                    </div>
                    <span>{v}</span>
                  </div>
                ),
              },
              {
                title: 'Action', dataIndex: 'action', width: 160,
                render: (v: string) => <span className={styles.actionTag}>{v}</span>,
              },
              { title: 'Entity',    dataIndex: 'entityType', width: 140 },
              { title: 'Entity ID', dataIndex: 'entityId',   width: 90,  render: (v) => v ?? '--' },
              {
                title: 'Change', dataIndex: 'newValue', width: 260,
                render: (v?: string) => v
                  ? <Typography.Text className={styles.changePreview} ellipsis={{ tooltip: false }}>{v}</Typography.Text>
                  : <span className={styles.noChange}>—</span>,
              },
              { title: 'Time', dataIndex: 'createdAt', width: 180, render: (v) => formatDateTime(v) },
              {
                title: '', fixed: 'right', width: 48,
                render: (_, record) => (
                  <Button type="text" icon={<EyeOutlined />} aria-label={`View ${record.id}`} onClick={() => setSelectedLog(record)} />
                ),
              },
            ]}
          />
        </QueryState>
      </Card>

      {/* ── Detail drawer ── */}
      <Drawer width={520} title="Audit Event Detail" open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)}>
        {selectedLog && (
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
        )}
      </Drawer>
    </div>
  );
}
