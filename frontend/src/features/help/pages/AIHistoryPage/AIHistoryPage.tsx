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
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { formatDateTime } from '../../../../lib/format';
import { roleListLabel } from '../../../../lib/roleDisplay';
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
  const { t } = useTranslation();
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
        title: t('aiHistory.emptyFilteredTitle'),
        description: t('aiHistory.emptyFilteredDescription'),
      };
    }

    return {
      title: t('aiHistory.emptyTitle'),
      description: t('aiHistory.emptyDescription'),
    };
  }, [hasActiveFilter, t]);

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
        title={t('aiHistory.title')}
        subtitle={t('aiHistory.subtitle')}
      />

      <div className={styles.metricsGrid}>
        <Card className={`panel-card ${styles.metricCard}`}>
          <div className={styles.metricIcon}><HistoryOutlined /></div>
          <div>
            <Typography.Text type="secondary">{t('aiHistory.metric.matching')}</Typography.Text>
            <Typography.Title level={3}>{historyPage?.totalElements ?? 0}</Typography.Title>
          </div>
        </Card>
        <Card className={`panel-card ${styles.metricCard}`}>
          <div className={styles.metricIcon}><UserOutlined /></div>
          <div>
            <Typography.Text type="secondary">{t('aiHistory.metric.actors')}</Typography.Text>
            <Typography.Title level={3}>{actorCount}</Typography.Title>
          </div>
        </Card>
        <Card className={`panel-card ${styles.metricCard}`}>
          <div className={styles.metricIcon}><LockOutlined /></div>
          <div>
            <Typography.Text type="secondary">{t('aiHistory.metric.blocked')}</Typography.Text>
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
                { value: 'team', label: t('aiHistory.scope.team') },
                { value: 'mine', label: t('aiHistory.scope.mine') },
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
                { value: 'all', label: t('aiHistory.status.all') },
                { value: 'answered', label: t('aiHistory.status.answered') },
                { value: 'blocked', label: t('aiHistory.status.blocked') },
              ]}
            />
            <Input.Search
              className={styles.searchInput}
              allowClear
              enterButton
              prefix={<SearchOutlined />}
              value={searchDraft}
              placeholder={t('aiHistory.searchPlaceholder')}
              onChange={(event) => {
                setSearchDraft(event.target.value);
                if (!event.target.value) {
                  handleSearch('');
                }
              }}
              onSearch={handleSearch}
            />
          </div>
          <Button onClick={() => historyQuery.refetch()}>{t('common.refresh')}</Button>
        </div>

        <QueryState
          isLoading={historyQuery.isLoading}
          isError={historyQuery.isError}
          error={historyQuery.error}
          hasData={history.length > 0}
          emptyTitle={emptyCopy.title}
          emptyDescription={emptyCopy.description}
          emptyAction={hasActiveFilter ? <Button onClick={clearFilters}>{t('common.clearFilters')}</Button> : null}
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
                title: t('aiHistory.column.actor'),
                dataIndex: 'actorFullName',
                width: 210,
                render: (_, record) => (
                  <div className={styles.actorCell}>
                    <div className={styles.actorAvatar}><UserOutlined /></div>
                    <div>
                      <Typography.Text strong>{record.actorFullName || record.actorUsername}</Typography.Text>
                      <Typography.Paragraph type="secondary">
                        {record.actorRoles.length ? roleListLabel(record.actorRoles, t) : t('common.staff')}
                      </Typography.Paragraph>
                    </div>
                  </div>
                ),
              },
              {
                title: t('aiHistory.column.question'),
                dataIndex: 'question',
                width: 300,
                render: (value: string) => <Typography.Text ellipsis={{ tooltip: value }}>{value}</Typography.Text>,
              },
              {
                title: t('aiHistory.column.answerPreview'),
                dataIndex: 'answer',
                width: 340,
                render: (value: string) => <Typography.Text ellipsis={{ tooltip: value }}>{value}</Typography.Text>,
              },
              {
                title: t('common.status'),
                dataIndex: 'blocked',
                width: 120,
                render: (blocked: boolean) => blocked
                  ? <Tag color="red">{t('aiHistory.status.blocked')}</Tag>
                  : <Tag color="purple">{t('aiHistory.status.answered')}</Tag>,
              },
              {
                title: t('common.time'),
                dataIndex: 'createdAt',
                width: 170,
                render: (value: string) => formatDateTime(value),
              },
              {
                title: t('common.actions'),
                fixed: 'right',
                width: 104,
                render: (_, record) => (
                  <Space size={4}>
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      aria-label={t('aiHistory.viewDetail')}
                      onClick={() => setSelectedItem(record)}
                    />
                    <Popconfirm
                      title={t('aiHistory.deleteTitle')}
                      description={t('aiHistory.deleteDescription')}
                      okText={t('common.delete')}
                      okButtonProps={{ danger: true }}
                      onConfirm={() => deleteItem(record.id)}
                    >
                      <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        loading={deleteHistoryItem.isPending}
                        aria-label={t('aiHistory.deleteLabel')}
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
        title={t('aiHistory.detailTitle')}
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        extra={selectedItem ? (
          <Popconfirm
            title={t('aiHistory.deleteTitle')}
            okText={t('common.delete')}
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteItem(selectedItem.id)}
          >
            <Button danger icon={<DeleteOutlined />} loading={deleteHistoryItem.isPending}>{t('common.delete')}</Button>
          </Popconfirm>
        ) : null}
      >
        {selectedItem ? (
          <div className={styles.detailContent}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={t('aiHistory.detail.actor')}>{selectedItem.actorFullName || selectedItem.actorUsername}</Descriptions.Item>
              <Descriptions.Item label={t('aiHistory.detail.roles')}>{selectedItem.actorRoles.length ? roleListLabel(selectedItem.actorRoles, t) : '--'}</Descriptions.Item>
              <Descriptions.Item label={t('common.status')}>{selectedItem.blocked ? t('aiHistory.status.blocked') : t('aiHistory.status.answered')}</Descriptions.Item>
              <Descriptions.Item label={t('common.time')}>{formatDateTime(selectedItem.createdAt)}</Descriptions.Item>
              <Descriptions.Item label={t('aiHistory.detail.scopeNotice')}>{selectedItem.scopeNotice}</Descriptions.Item>
            </Descriptions>

            <section>
              <Typography.Title level={5}>{t('aiHistory.detail.question')}</Typography.Title>
              <div className={styles.detailBox}>{selectedItem.question}</div>
            </section>

            <section>
              <Typography.Title level={5}>{t('aiHistory.detail.answer')}</Typography.Title>
              <div className={styles.detailBox}>{selectedItem.answer}</div>
            </section>

            <section>
              <Typography.Title level={5}>{t('aiHistory.detail.relatedModules')}</Typography.Title>
              <div className={styles.tagList}>
                {selectedItem.relatedModules.length > 0
                  ? selectedItem.relatedModules.map((module) => <Tag color="purple" key={module}>{module}</Tag>)
                  : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('aiHistory.noModuleContext')} />}
              </div>
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}