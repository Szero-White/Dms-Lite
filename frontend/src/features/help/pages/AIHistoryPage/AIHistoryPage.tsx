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
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TableMultiSelectFilter } from '../../../../components/common/TableMultiSelectFilter';
import { SemanticStatusTag } from '../../../../components/common/StatusTag';
import { QueryState } from '../../../../components/common/QueryState';
import { getTableSortOrder, TABLE_SORT_DIRECTIONS, TABLE_SORTER_TOOLTIP } from '../../../../lib/tableSorting';
import { formatDateTime } from '../../../../lib/format';
import { roleListLabel } from '../../../../lib/roleDisplay';
import {
  useDeleteHelpHistoryItem,
  useHelpHistory,
} from '../../hooks/useHelpAssistant';
import {
  aiStatusTranslationKey,
  answerSourceTranslationKey,
  generationProviderTranslationKey,
} from '../../utils/answerProvenance';
import type { HelpAnswerSource, HelpHistorySortDirection, HelpHistorySortField, HelpInteraction } from '../../types/help.types';
import { AssistantArtwork } from '../../components/FloatingHelpAssistant/AssistantArtwork';
import styles from './AIHistoryPage.module.css';

type HistoryStatusFilter = 'answered' | 'blocked';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function statusToBlocked(statusFilters: HistoryStatusFilter[]) {
  if (statusFilters.length !== 1) {
    return undefined;
  }

  return statusFilters[0] === 'blocked';
}

export function AIHistoryPage() {
  const { t } = useTranslation();
  const [mineOnly, setMineOnly] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  const [statusFilters, setStatusFilters] = useState<HistoryStatusFilter[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<HelpHistorySortField>();
  const [sortDirection, setSortDirection] = useState<HelpHistorySortDirection>();
  const [selectedItem, setSelectedItem] = useState<HelpInteraction | null>(null);
  const historyQuery = useHelpHistory({
    mineOnly,
    keyword,
    blocked: statusToBlocked(statusFilters),
    page,
    size: pageSize,
    sortBy,
    sortDirection,
  });
  const deleteHistoryItem = useDeleteHelpHistoryItem();

  const historyPage = historyQuery.data;
  const history = historyPage?.content ?? [];
  const blockedCount = history.filter((item) => item.blocked).length;
  const actorCount = new Set(history.map((item) => item.actorId)).size;
  const hasActiveFilter = Boolean(keyword) || statusFilters.length > 0;

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
    setStatusFilters([]);
    resetToFirstPage();
  }

  const sortOrder = (field: HelpHistorySortField) =>
    getTableSortOrder(sortBy, sortDirection, field);

  function handleSort(field: HelpHistorySortField, order: 'ascend' | 'descend' | null | undefined) {
    if (!order) {
      setSortBy(undefined);
      setSortDirection(undefined);
      resetToFirstPage();
      return;
    }
    setSortBy(field);
    setSortDirection(order === 'ascend' ? 'ASC' : 'DESC');
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
      <section className={styles.activityHero}>
        <div className={styles.heroContent}>
          <div className={styles.heroEyebrow}>
            <span className={styles.heroEyebrowIcon}><HistoryOutlined /></span>
            <span>{t('aiHistory.scope.team')}</span>
          </div>
          <Typography.Title level={1} className={styles.heroTitle}>{t('aiHistory.title')}</Typography.Title>
          <Typography.Paragraph className={styles.heroSubtitle}>{t('aiHistory.subtitle')}</Typography.Paragraph>

          <div className={styles.metricRail}>
            <div className={`${styles.metricItem} ${styles.metricItemPrimary}`}>
              <div className={styles.metricIcon}><HistoryOutlined /></div>
              <div className={styles.metricCopy}>
                <Typography.Text>{t('aiHistory.metric.matching')}</Typography.Text>
                <strong>{historyPage?.totalElements ?? 0}</strong>
              </div>
            </div>
            <div className={styles.metricDivider} aria-hidden="true" />
            <div className={styles.metricItem}>
              <div className={styles.metricIcon}><UserOutlined /></div>
              <div className={styles.metricCopy}>
                <Typography.Text>{t('aiHistory.metric.actors')}</Typography.Text>
                <strong>{actorCount}</strong>
              </div>
            </div>
            <div className={styles.metricDivider} aria-hidden="true" />
            <div className={`${styles.metricItem} ${blockedCount > 0 ? styles.metricItemAttention : ''}`}>
              <div className={styles.metricIcon}><LockOutlined /></div>
              <div className={styles.metricCopy}>
                <Typography.Text>{t('aiHistory.metric.blocked')}</Typography.Text>
                <strong>{blockedCount}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.heroVisualHalo} />
          <AssistantArtwork variant="hero" />
        </div>
      </section>

      <Card className={`panel-card workspace-surface table-panel-card ${styles.historyCard}`}>
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
            <TableMultiSelectFilter
              ariaLabel={t('aiHistory.status.all')}
              className={styles.statusSelect}
              value={statusFilters}
              onChange={(values) => {
                setStatusFilters(values);
                resetToFirstPage();
              }}
              placeholder={t('aiHistory.status.all')}
              options={[
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
            className={styles.historyTable}
            size="small"
            scroll={{ x: 1266 }}
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={TABLE_SORTER_TOOLTIP}
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
            onChange={(_pagination, _filters, sorter, extra) => {
              if (extra.action !== 'sort') {
                return;
              }

              const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
              const key = activeSorter?.columnKey;
              if (!activeSorter?.order) {
                setSortBy(undefined);
                setSortDirection(undefined);
                resetToFirstPage();
              } else if (typeof key === 'string') {
                handleSort(key as HelpHistorySortField, activeSorter.order);
              }
            }}
            columns={[
              {
                title: t('aiHistory.column.actor'),
                dataIndex: 'actorFullName',
                key: 'ACTOR',
                sorter: true,
                sortOrder: sortOrder('ACTOR'),
                width: 190,
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
                key: 'QUESTION',
                sorter: true,
                sortOrder: sortOrder('QUESTION'),
                width: 260,
                render: (value: string) => <Typography.Text ellipsis={{ tooltip: value }}>{value}</Typography.Text>,
              },
              {
                title: t('aiHistory.column.answerPreview'),
                dataIndex: 'answer',
                key: 'ANSWER',
                sorter: true,
                sortOrder: sortOrder('ANSWER'),
                width: 300,
                render: (value: string) => <Typography.Text ellipsis={{ tooltip: value }}>{value}</Typography.Text>,
              },
              {
                title: t('aiHistory.column.source'),
                dataIndex: 'answerSource',
                key: 'SOURCE',
                sorter: true,
                sortOrder: sortOrder('SOURCE'),
                width: 140,
                render: (source: HelpAnswerSource) => (
                  <Tag>
                    {t(answerSourceTranslationKey(source))}
                  </Tag>
                ),
              },
              {
                title: t('common.status'),
                dataIndex: 'blocked',
                key: 'STATUS',
                sorter: true,
                sortOrder: sortOrder('STATUS'),
                fixed: 'right',
                width: 120,
                render: (blocked: boolean) => blocked
                  ? <SemanticStatusTag tone="danger">{t('aiHistory.status.blocked')}</SemanticStatusTag>
                  : <SemanticStatusTag tone="success">{t('aiHistory.status.answered')}</SemanticStatusTag>,
              },
              {
                title: t('common.time'),
                dataIndex: 'createdAt',
                key: 'NEWEST',
                sorter: true,
                sortOrder: sortOrder('NEWEST'),
                fixed: 'right',
                width: 160,
                render: (value: string) => formatDateTime(value),
              },
              {
                title: t('common.actions'),
                fixed: 'right',
                width: 96,
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
              <Descriptions.Item label={t('aiHistory.detail.answerSource')}>
                {t(answerSourceTranslationKey(selectedItem.answerSource))}
              </Descriptions.Item>
              <Descriptions.Item label={t('aiHistory.detail.generationProvider')}>
                {t(generationProviderTranslationKey(selectedItem.generationProvider))}
              </Descriptions.Item>
              <Descriptions.Item label={t('aiHistory.detail.aiStatus')}>
                {t(aiStatusTranslationKey(selectedItem.answerSource, selectedItem.generationProvider))}
              </Descriptions.Item>
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
                  ? selectedItem.relatedModules.map((module) => <Tag key={module}>{module}</Tag>)
                  : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('aiHistory.noModuleContext')} />}
              </div>
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
