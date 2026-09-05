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
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { NotificationTypeTag } from '../../../../components/common/StatusTag';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { formatDateTime } from '../../../../lib/format';
import {
  useMarkNotificationRead,
  useNotifications,
} from '../../hooks/useNotificationQueries';
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
    normalizedType.includes('RECEIVABLE') ||
    normalizedType.includes('INVOICE')
  ) {
    return 'RECEIVABLES';
  }
  if (normalizedType.includes('ORDER') || normalizedType.includes('SALES')) {
    return 'ORDERS';
  }

  return null;
}

function relativeTime(value: string, t: TFunction, language?: string) {
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

  return formatDateTime(value, language);
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

function localizedNotificationTitle(type: string, t: TFunction) {
  return t(`notifications.types.${type}.title`, {
    defaultValue: t('notifications.types.UNKNOWN.title'),
  });
}

function localizedEntityFallback(value: string, entity: 'product' | 'customer', t: TFunction) {
  const prefix = entity === 'product' ? 'Product' : 'Customer';
  const match = value.match(new RegExp(`^${prefix} #(\\d+)$`));

  if (!match) {
    return value;
  }

  return t(`notifications.entity.${entity}Fallback`, { id: match[1] });
}

function localizedNotificationMessage(item: { type: string; message: string }, t: TFunction) {
  const lowStockMatch = item.message.match(/^(.+) is at (\d+) units, below minimum (\d+)\.?$/);
  if (item.type === 'LOW_STOCK' && lowStockMatch) {
    return t('notifications.types.LOW_STOCK.message', {
      product: localizedEntityFallback(lowStockMatch[1], 'product', t),
      quantity: lowStockMatch[2],
      minimum: lowStockMatch[3],
    });
  }

  const overdueDebtMatch = item.message.match(/^(.+) has overdue receivable of (.+) VND\.?$/);
  if (item.type === 'OVERDUE_DEBT' && overdueDebtMatch) {
    return t('notifications.types.OVERDUE_DEBT.message', {
      customer: localizedEntityFallback(overdueDebtMatch[1], 'customer', t),
      amount: overdueDebtMatch[2],
    });
  }

  const paymentMatch = item.message.match(/^(.+) paid (.+) VND\.?$/);
  if (item.type === 'PAYMENT_RECORDED' && paymentMatch) {
    return t('notifications.types.PAYMENT_RECORDED.message', {
      customer: localizedEntityFallback(paymentMatch[1], 'customer', t),
      amount: paymentMatch[2],
    });
  }

  const confirmedOrderMatch = item.message.match(/^Order (.+) has been confirmed\.?$/);
  if (item.type === 'SALES_ORDER_CONFIRMED' && confirmedOrderMatch) {
    return t('notifications.types.SALES_ORDER_CONFIRMED.orderMessage', {
      orderCode: confirmedOrderMatch[1],
    });
  }

  const stockMovementMatch = item.message.match(/^Inventory updated for product #(.+) after sales order confirmation\.?$/);
  if (item.type === 'SALES_ORDER_CONFIRMED' && stockMovementMatch) {
    return t('notifications.types.SALES_ORDER_CONFIRMED.message', {
      productId: stockMovementMatch[1],
    });
  }

  const cancelledOrderMatch = item.message.match(/^Order (.+) has been cancelled\.?$/);
  if (item.type === 'SALES_ORDER_CANCELLED' && cancelledOrderMatch) {
    return t('notifications.types.SALES_ORDER_CANCELLED.message', {
      orderCode: cancelledOrderMatch[1],
    });
  }

  const invoiceIssuedMatch = item.message.match(/^Invoice (.+) has been issued\.?$/);
  if (item.type === 'INVOICE_ISSUED' && invoiceIssuedMatch) {
    return t('notifications.types.INVOICE_ISSUED.message', {
      invoiceCode: invoiceIssuedMatch[1],
    });
  }

  // Never render an unknown backend sentence directly. That would re-introduce
  // mixed-language UI as soon as a new notification type is added server-side.
  return t('notifications.types.UNKNOWN.message');
}

export function NotificationsPage() {
  const { i18n, t } = useTranslation();
  const notificationsQuery = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('ALL');
  const [keyword, setKeyword] = useState('');
  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((item) => item.readFlag === false).length;
  const availableCategories = new Set(
    notifications.map((item) => categoryForType(item.type)).filter(Boolean),
  );
  useEffect(() => {
    if (activeCategory === 'UNREAD' && unreadCount === 0) {
      setActiveCategory('ALL');
    }
  }, [activeCategory, unreadCount]);

  const categoryOptions = [
    { label: t('notifications.filter.all'), value: 'ALL' },
    ...(unreadCount > 0 ? [{ label: t('notifications.filter.unreadCount', { count: unreadCount }), value: 'UNREAD' }] : []),
    ...(availableCategories.has('INVENTORY') ? [{ label: t('notifications.filter.inventory'), value: 'INVENTORY' }] : []),
    ...(availableCategories.has('RECEIVABLES') ? [{ label: t('notifications.filter.receivables'), value: 'RECEIVABLES' }] : []),
    ...(availableCategories.has('ORDERS') ? [{ label: t('notifications.filter.orders'), value: 'ORDERS' }] : []),
  ];
  const filteredNotifications = useMemo(
    () => notifications.filter((item) => {
      const normalizedKeyword = keyword.trim().toLowerCase();
      const localizedTitle = localizedNotificationTitle(item.type, t);
      const localizedMessage = localizedNotificationMessage(item, t);
      const matchesKeyword = !normalizedKeyword || [item.title, item.message, localizedTitle, localizedMessage, item.type]
        .some((value) => value.toLowerCase().includes(normalizedKeyword));
      const matchesCategory = activeCategory === 'ALL' ||
        (activeCategory === 'UNREAD' && item.readFlag === false) ||
        categoryForType(item.type) === activeCategory;

      return matchesKeyword && matchesCategory;
    }),
    [activeCategory, keyword, notifications, t],
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
            renderItem={(item) => {
              const isUnread = item.readFlag === false;

              return (
                <List.Item
                  className={`${styles.activityItem} ${isUnread ? styles.unread : ''} ${styles.interactiveItem}`}
                  role="button"
                  tabIndex={0}
                  aria-label={isUnread ? t('notifications.action.markRead') : undefined}
                  onClick={() => markReadMutation.mutate(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      markReadMutation.mutate(item);
                    }
                  }}
                >
                  <div className={`${styles.activityIcon} ${styles[categoryForType(item.type)?.toLowerCase() || 'defaultIcon']}`}>
                    {iconForType(item.type)}
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityHeader}>
                      <div className={styles.titleGroup}>
                        <Typography.Text className={styles.title}>
                          {localizedNotificationTitle(item.type, t)}
                        </Typography.Text>
                        {isUnread && <span className={styles.unreadDot} aria-label={t('notifications.unread')} />}
                        <NotificationTypeTag type={item.type} />
                      </div>
                      <Typography.Text
                        type="secondary"
                        className={styles.timestamp}
                        title={formatDateTime(item.createdAt, i18n.language)}
                      >
                        {relativeTime(item.createdAt, t, i18n.language)}
                      </Typography.Text>
                    </div>
                    <Typography.Paragraph className={styles.message}>
                      {localizedNotificationMessage(item, t)}
                    </Typography.Paragraph>
                    <Typography.Text type="secondary" className={styles.source}>
                      {t('notifications.source.label', { source: item.source === 'api' ? t('notifications.source.api') : t('notifications.source.derived') })}
                    </Typography.Text>
                  </div>
                </List.Item>
              );
            }}
          />
        </QueryState>
      </Card>
    </div>
  );
}
