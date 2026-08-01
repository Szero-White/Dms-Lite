import {
  DeleteOutlined,
  EyeOutlined,
  HistoryOutlined,
  LockOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { formatDateTime } from '../../../../lib/format';
import {
  useDeleteHelpHistoryItem,
  useHelpHistory,
} from '../../hooks/useHelpAssistant';
import type { HelpInteraction } from '../../types/help.types';
import styles from './AIHistoryPage.module.css';

type HistoryStatusFilter = 'all' | 'answered' | 'blocked';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function statusToBlocked(status: HistoryStatusFilter) {
  if (status === 'blocked') {
    return true;
  }

  if (status === 'answered') {
    return false;
  }

  return undefined;
}

export function AIHistoryPage() {
  const [mineOnly, setMineOnly] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedItem, setSelectedItem] = useState<HelpInteraction | null>(null);
  const historyQuery = useHelpHistory({
    mineOnly,
    keyword,
    blocked: statusToBlocked(statusFilter),
    page,
    size: pageSize,
  });
  const deleteHistoryItem = useDeleteHelpHistoryItem();

  const historyPage = historyQuery.data;
  const history = historyPage?.content ?? [];
  const blockedCount = history.filter((item) => item.blocked).length;
  const actorCount = new Set(history.map((item) => item.actorId)).size;
  const hasActiveFilter = Boolean(keyword) || statusFilter !== 'all';

  const emptyCopy = useMemo(() => {
    if (hasActiveFilter) {
      return {
        title: 'No AI history matches these filters',
        description: 'Try another keyword or status filter.',
      };
    }

    return {
      title: 'No AI history yet',
      description: 'Assistant questions will appear after employees use Workflow Buddy.',
    };
  }, [hasActiveFilter]);

  function resetToFirstPage() {
    setPage(0);
  }

  function handleScopeChange(value: string | number) {
    setMineOnly(value === 'mine');
    resetToFirstPage();
  }

  function handleSearch(value: string) {
    setKeyword(value.trim());
    resetToFirstPage();
  }

  function clearFilters() {
    setSearchDraft('');
    setKeyword('');
    setStatusFilter('all');
    resetToFirstPage();
  }

  function deleteItem(interactionId: number) {
    deleteHistoryItem.mutate(interactionId, {
      onSuccess: () => {
        if (selectedItem?.id === interactionId) {
          setSelectedItem(null);
        }
      },
    });
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="AI History"
        subtitle="Review role-scoped assistant questions and blocked attempts across your team."
      />

      <div className={styles.metricsGrid}>
        <Card className={`panel-card ${styles.metricCard}`}>
          <div className={styles.metricIcon}><HistoryOutlined /></div>
          <div>
            <Typography.Text type="secondary">Matching interactions</Typography.Text>
            <Typography.Title level={3}>{historyPage?.totalElements ?? 0}</Typography.Title>
          </div>
        </Card>
        <Card className={`panel-card ${styles.metricCard}`}>
          <div className={styles.metricIcon}><UserOutlined /></div>
          <div>
            <Typography.Text type="secondary">Askers on this page</Typography.Text>
            <Typography.Title level={3}>{actorCount}</Typography.Title>
          </div>
        </Card>
        <Card className={`panel-card ${styles.metricCard}`}>
          <div className={styles.metricIcon}><LockOutlined /></div>
          <div>
            <Typography.Text type="secondary">Blocked on this page</Typography.Text>
            <Typography.Title level={3}>{blockedCount}</Typography.Title>
          </div>
        </Card>
      </div>

      <Card className={`panel-card table-panel-card ${styles.historyCard}`}>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <Segmented
              value={mineOnly ? 'mine' : 'team'}
              onChange={handleScopeChange}
              options={[
                { value: 'team', label: 'Team history' },
                { value: 'mine', label: 'My history' },
              ]}
            />
            <Select<HistoryStatusFilter>
              className={styles.statusSelect}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                resetToFirstPage();
              }}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'answered', label: 'Answered' },
                { value: 'blocked', label: 'Blocked' },
              ]}
            />
            <Input.Search
              className={styles.searchInput}
              allowClear
              enterButton
              prefix={<SearchOutlined />}
              value={searchDraft}
              placeholder="Search actor, role, question or answer"
              onChange={(event) => {
                setSearchDraft(event.target.value);
                if (!event.target.value) {
                  handleSearch('');
                }
              }}
              onSearch={handleSearch}
            />
          </div>
          <Button onClick={() => historyQuery.refetch()}>Refresh</Button>
        </div>

        <QueryState
          isLoading={historyQuery.isLoading}
          isError={historyQuery.isError}
          error={historyQuery.error}
          hasData={history.length > 0}
          emptyTitle={emptyCopy.title}
          emptyDescription={emptyCopy.description}
          emptyAction={hasActiveFilter ? <Button onClick={clearFilters}>Clear filters</Button> : null}
          onRetry={() => historyQuery.refetch()}
        >
          <Table<HelpInteraction>
            rowKey="id"
            size="small"
            sticky
            scroll={{ x: 1080 }}
            dataSource={history}
            pagination={{
              current: page + 1,
              pageSize,
              total: historyPage?.totalElements ?? 0,
              showSizeChanger: true,
              pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage - 1);
                setPageSize(nextPageSize);
              },
            }}
            columns={[
              {
                title: 'Actor',
                dataIndex: 'actorFullName',
                width: 210,
                render: (_, record) => (
                  <div className={styles.actorCell}>
                    <div className={styles.actorAvatar}><UserOutlined /></div>
                    <div>
                      <Typography.Text strong>{record.actorFullName || record.actorUsername}</Typography.Text>
                      <Typography.Paragraph type="secondary">
                        {record.actorRoles.join(', ') || 'Staff'}
                      </Typography.Paragraph>
                    </div>
                  </div>
                ),
              },
              {
                title: 'Question',
                dataIndex: 'question',
                width: 300,
                render: (value: string) => <Typography.Text ellipsis={{ tooltip: value }}>{value}</Typography.Text>,
              },
              {
                title: 'Answer Preview',
                dataIndex: 'answer',
                width: 340,
                render: (value: string) => <Typography.Text ellipsis={{ tooltip: value }}>{value}</Typography.Text>,
              },
              {
                title: 'Status',
                dataIndex: 'blocked',
                width: 120,
                render: (blocked: boolean) => blocked ? <Tag color="red">Blocked</Tag> : <Tag color="purple">Answered</Tag>,
              },
              {
                title: 'Time',
                dataIndex: 'createdAt',
                width: 170,
                render: (value: string) => formatDateTime(value),
              },
              {
                title: 'Actions',
                fixed: 'right',
                width: 104,
                render: (_, record) => (
                  <Space size={4}>
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      aria-label="View AI history detail"
                      onClick={() => setSelectedItem(record)}
                    />
                    <Popconfirm
                      title="Delete this AI history item?"
                      description="Only Owner can remove assistant history records."
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => deleteItem(record.id)}
                    >
                      <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        loading={deleteHistoryItem.isPending}
                        aria-label="Delete AI history item"
                      />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </QueryState>
      </Card>

      <Drawer
        width={620}
        title="AI Interaction Detail"
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        extra={selectedItem ? (
          <Popconfirm
            title="Delete this AI history item?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteItem(selectedItem.id)}
          >
            <Button danger icon={<DeleteOutlined />} loading={deleteHistoryItem.isPending}>Delete</Button>
          </Popconfirm>
        ) : null}
      >
        {selectedItem ? (
          <div className={styles.detailContent}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Actor">{selectedItem.actorFullName || selectedItem.actorUsername}</Descriptions.Item>
              <Descriptions.Item label="Roles">{selectedItem.actorRoles.join(', ') || '--'}</Descriptions.Item>
              <Descriptions.Item label="Status">{selectedItem.blocked ? 'Blocked' : 'Answered'}</Descriptions.Item>
              <Descriptions.Item label="Time">{formatDateTime(selectedItem.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Scope notice">{selectedItem.scopeNotice}</Descriptions.Item>
            </Descriptions>

            <section>
              <Typography.Title level={5}>Question</Typography.Title>
              <div className={styles.detailBox}>{selectedItem.question}</div>
            </section>

            <section>
              <Typography.Title level={5}>Answer</Typography.Title>
              <div className={styles.detailBox}>{selectedItem.answer}</div>
            </section>

            <section>
              <Typography.Title level={5}>Related Modules</Typography.Title>
              <div className={styles.tagList}>
                {selectedItem.relatedModules.length > 0
                  ? selectedItem.relatedModules.map((module) => <Tag color="purple" key={module}>{module}</Tag>)
                  : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No module context" />}
              </div>
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
