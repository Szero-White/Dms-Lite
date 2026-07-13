import { BellOutlined } from '@ant-design/icons';
import { Card, List, Typography } from 'antd';
import { NotificationTypeTag } from '../../../../components/common/StatusTag';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { formatDateTime } from '../../../../lib/format';
import { useNotifications } from '../../hooks/useNotificationQueries';
import styles from './NotificationsPage.module.css';

export function NotificationsPage() {
  const notificationsQuery = useNotifications();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Notifications"
        subtitle="Low stock, overdue debt, payment updates, and sales order alerts."
      />

      <Card className={`panel-card ${styles.activityCard}`}>
        <QueryState
          isLoading={notificationsQuery.isLoading}
          isError={notificationsQuery.isError}
          error={notificationsQuery.error}
          hasData={Boolean(notificationsQuery.data?.length)}
        >
          <List
            className={styles.activityList}
            dataSource={notificationsQuery.data ?? []}
            renderItem={(item) => (
              <List.Item className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  <BellOutlined />
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityHeader}>
                    <div className={styles.titleGroup}>
                      <Typography.Text className={styles.title}>
                        {item.title}
                      </Typography.Text>
                      <NotificationTypeTag type={item.type} />
                    </div>
                    <Typography.Text type="secondary" className={styles.timestamp}>
                      {formatDateTime(item.createdAt)}
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
