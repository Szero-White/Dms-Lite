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

function relativeTime(value: string) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));

  if (elapsedSeconds < 60) {
    return 'Just now';
  }
  if (elapsedSeconds < 3600) {
    return `${Math.floor(elapsedSeconds / 60)}m ago`;
  }
  if (elapsedSeconds < 86400) {
    return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  }
  if (elapsedSeconds < 604800) {
    return `${Math.floor(elapsedSeconds / 86400)}d ago`;
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
  const notificationsQuery = useNotifications();
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('ALL');
  const [keyword, setKeyword] = useState('');
  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((item) => item.readFlag === false).length;
  const availableCategories = new Set(
    notifications.map((item) => categoryForType(item.type)).filter(Boolean),
  );
  const categoryOptions = [
    { label: 'All', value: 'ALL' },
    ...(unreadCount > 0 ? [{ label: `Unread (${unreadCount})`, value: 'UNREAD' }] : []),
    ...(availableCategories.has('INVENTORY') ? [{ label: 'Inventory', value: 'INVENTORY' }] : []),
    ...(availableCategories.has('RECEIVABLES') ? [{ label: 'Receivables', value: 'RECEIVABLES' }] : []),
    ...(availableCategories.has('ORDERS') ? [{ label: 'Orders', value: 'ORDERS' }] : []),
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
        title="Notifications"
        subtitle="Low stock, overdue debt, payment updates, and sales order alerts."
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
            placeholder="Search notifications"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <QueryState
          isLoading={notificationsQuery.isLoading}
          isError={notificationsQuery.isError}
          error={notificationsQuery.error}
          hasData={filteredNotifications.length > 0}
          emptyTitle={notifications.length ? 'No notifications match these filters' : 'No notifications yet'}
          emptyDescription={notifications.length
            ? 'Try another category or search term.'
            : 'Business alerts will appear here as activity is recorded.'}
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
                      {item.readFlag === false && <span className={styles.unreadDot} aria-label="Unread" />}
                      <NotificationTypeTag type={item.type} />
                    </div>
                    <Typography.Text
                      type="secondary"
                      className={styles.timestamp}
                      title={formatDateTime(item.createdAt)}
                    >
                      {relativeTime(item.createdAt)}
                    </Typography.Text>
                  </div>
                  <Typography.Paragraph className={styles.message}>
                    {item.message}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary" className={styles.source}>
                    Source: {item.source === 'api' ? 'Backend notification' : 'Derived business alert'}
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
