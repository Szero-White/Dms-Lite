import {
  BellOutlined,
  DollarOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Card,
  Input,
  List,
  Segmented,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { NotificationTypeTag } from '../../../../components/common/StatusTag';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { formatDateTime } from '../../../../lib/format';
import { useNotifications } from '../../hooks/useNotificationQueries';
import styles from './NotificationsPage.module.css';

type NotificationCategory = 'ALL' | 'UNREAD' | 'INVENTORY' | 'RECEIVABLES' | 'ORDERS';

function categoryForType(type: string): Exclude<NotificationCategory, 'ALL' | 'UNREAD'> | null {
  const normalizedType = type.toUpperCase();

  if (normalizedType.includes('STOCK') || normalizedType.includes('INVENTORY')) {
    return 'INVENTORY';
  }
  if (
    normalizedType.includes('DEBT') ||
    normalizedType.includes('PAYMENT') ||
    normalizedType.includes('RECEIVABLE')
  ) {
    return 'RECEIVABLES';
  }
  if (normalizedType.includes('ORDER') || normalizedType.includes('SALES')) {
    return 'ORDERS';
  }

  return null;
}

function relativeTime(value: string, t: TFunction) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));

  if (elapsedSeconds < 60) {
    return t('notifications.relative.justNow');
  }
  if (elapsedSeconds < 3600) {
    return t('notifications.relative.minutesAgo', { count: Math.floor(elapsedSeconds / 60) });
  }
  if (elapsedSeconds < 86400) {
    return t('notifications.relative.hoursAgo', { count: Math.floor(elapsedSeconds / 3600) });
  }
  if (elapsedSeconds < 604800) {
    return t('notifications.relative.daysAgo', { count: Math.floor(elapsedSeconds / 86400) });
  }

  return formatDateTime(value);
}

function iconForType(type: string) {
  const category = categoryForType(type);

  if (category === 'INVENTORY') {
    return <WarningOutlined />;
  }
  if (category === 'RECEIVABLES') {
    return <DollarOutlined />;
  }
  if (category === 'ORDERS') {
    return <ShoppingCartOutlined />;
  }

  return <BellOutlined />;
}

export function NotificationsPage() {
  const { t } = useTranslation();
  const notificationsQuery = useNotifications();
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('ALL');
  const [keyword, setKeyword] = useState('');
  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((item) => item.readFlag === false).length;
  const availableCategories = new Set(
    notifications.map((item) => categoryForType(item.type)).filter(Boolean),
  );
  const categoryOptions = [
    { label: t('notifications.filter.all'), value: 'ALL' },
    ...(unreadCount > 0 ? [{ label: `Unread (${unreadCount})`, value: 'UNREAD' }] : []),
    ...(availableCategories.has('INVENTORY') ? [{ label: t('notifications.filter.inventory'), value: 'INVENTORY' }] : []),
    ...(availableCategories.has('RECEIVABLES') ? [{ label: t('notifications.filter.receivables'), value: 'RECEIVABLES' }] : []),
    ...(availableCategories.has('ORDERS') ? [{ label: t('notifications.filter.orders'), value: 'ORDERS' }] : []),
  ];
  const filteredNotifications = useMemo(
    () => notifications.filter((item) => {
      const normalizedKeyword = keyword.trim().toLowerCase();
      const matchesKeyword = !normalizedKeyword || [item.title, item.message, item.type]
        .some((value) => value.toLowerCase().includes(normalizedKeyword));
      const matchesCategory = activeCategory === 'ALL' ||
        (activeCategory === 'UNREAD' && item.readFlag === false) ||
        categoryForType(item.type) === activeCategory;

      return matchesKeyword && matchesCategory;
    }),
    [activeCategory, keyword, notifications],
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
      />

      <Card className={`panel-card ${styles.activityCard}`}>
        <div className={styles.toolbar}>
          <Segmented
            className={styles.segmented}
            options={categoryOptions}
            value={activeCategory}
            onChange={(value) => setActiveCategory(value as NotificationCategory)}
          />
          <Input
            allowClear
            className={styles.search}
            prefix={<SearchOutlined />}
            placeholder={t('notifications.searchPlaceholder')}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <QueryState
          isLoading={notificationsQuery.isLoading}
          isError={notificationsQuery.isError}
          error={notificationsQuery.error}
          hasData={filteredNotifications.length > 0}
          emptyTitle={notifications.length ? t('notifications.empty.filteredTitle') : t('notifications.empty.title')}
          emptyDescription={notifications.length
            ? t('notifications.empty.filteredDescription')
            : t('notifications.empty.description')}
        >
          <List
            className={styles.activityList}
            dataSource={filteredNotifications}
            renderItem={(item) => (
              <List.Item className={`${styles.activityItem} ${item.readFlag === false ? styles.unread : ''}`}>
                <div className={`${styles.activityIcon} ${styles[categoryForType(item.type)?.toLowerCase() || 'defaultIcon']}`}>
                  {iconForType(item.type)}
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityHeader}>
                    <div className={styles.titleGroup}>
                      <Typography.Text className={styles.title}>
                        {item.title}
                      </Typography.Text>
                      {item.readFlag === false && <span className={styles.unreadDot} aria-label={t('notifications.unread')} />}
                      <NotificationTypeTag type={item.type} />
                    </div>
                    <Typography.Text
                      type="secondary"
                      className={styles.timestamp}
                      title={formatDateTime(item.createdAt)}
                    >
                      {relativeTime(item.createdAt, t)}
                    </Typography.Text>
                  </div>
                  <Typography.Paragraph className={styles.message}>
                    {item.message}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary" className={styles.source}>
                    {t('notifications.source.label', { source: item.source === 'api' ? t('notifications.source.api') : t('notifications.source.derived') })}
                  </Typography.Text>
                </div>
              </List.Item>
            )}
          />
        </QueryState>
      </Card>
    </div>
  );
}
