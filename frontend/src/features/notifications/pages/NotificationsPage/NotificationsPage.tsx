import { Card, List, Space, Typography } from 'antd';
import { NotificationTypeTag } from '../../../../components/common/StatusTag';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { formatDateTime } from '../../../../lib/format';
import { useNotifications } from '../../hooks/useNotificationQueries';

export function NotificationsPage() {
  const notificationsQuery = useNotifications();

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title="Notifications"
        subtitle="Low stock, overdue debt, payment updates, and sales order alerts."
      />

      <Card className="panel-card">
        <QueryState
          isLoading={notificationsQuery.isLoading}
          isError={notificationsQuery.isError}
          error={notificationsQuery.error}
          hasData={Boolean(notificationsQuery.data?.length)}
        >
          <List
            dataSource={notificationsQuery.data ?? []}
            renderItem={(item) => (
              <List.Item>
                <div style={{ width: '100%' }}>
                  <div className="flex-between">
                    <Space>
                      <Typography.Text strong>{item.title}</Typography.Text>
                      <NotificationTypeTag type={item.type} />
                    </Space>
                    <Typography.Text type="secondary">{formatDateTime(item.createdAt)}</Typography.Text>
                  </div>
                  <Typography.Paragraph style={{ marginBottom: 4 }}>{item.message}</Typography.Paragraph>
                  <Typography.Text type="secondary">
                    Source: {item.source === 'api' ? 'Backend notification' : 'Derived business alert'}
                  </Typography.Text>
                </div>
              </List.Item>
            )}
          />
        </QueryState>
      </Card>
    </Space>
  );
}
