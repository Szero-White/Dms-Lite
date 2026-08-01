import {
  BellOutlined,
  DownOutlined,
  LogoutOutlined,
  MenuOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  AutoComplete,
  Avatar,
  Badge,
  Button,
  Dropdown,
  Input,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PERMISSIONS,
  canAccessPath,
  hasPermission,
  useAuth,
} from '../../../features/auth';
import { useNotifications } from '../../../features/notifications';
import styles from './AppHeader.module.css';

const navigationOptions = [
  { value: '/dashboard', label: 'Dashboard' },
  { value: '/sales-orders', label: 'Sales Orders' },
  { value: '/products', label: 'Products' },
  { value: '/customers', label: 'Customers' },
  { value: '/inventory', label: 'Inventory' },
  { value: '/payments', label: 'Payments' },
  { value: '/reports', label: 'Reports' },
  { value: '/notifications', label: 'Notifications' },
  { value: '/audit-logs', label: 'Audit Logs' },
  { value: '/team', label: 'Team Access' },
  { value: '/ai-history', label: 'AI History' },
];

interface AppHeaderProps {
  onOpenNavigation?: () => void;
}

export function AppHeader({ onOpenNavigation }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const notificationsQuery = useNotifications();
  const [searchValue, setSearchValue] = useState('');
  const canViewNotifications = hasPermission(user, PERMISSIONS.NOTIFICATION_VIEW);
  const unreadCount = canViewNotifications
    ? (notificationsQuery.data ?? []).filter(
        (notification) => notification.readFlag === false,
      ).length
    : 0;
  const allowedNavigationOptions = useMemo(
    () => navigationOptions.filter((option) => canAccessPath(user, option.value)),
    [user],
  );
  const quickCreateItems = useMemo(
    () => [
      hasPermission(user, PERMISSIONS.SALES_ORDER_CREATE)
        ? { key: '/sales-orders/new', label: 'Create sales order' }
        : null,
      hasPermission(user, PERMISSIONS.INVENTORY_MANAGE)
        ? { key: '/inventory', label: 'Receive stock' }
        : null,
      hasPermission(user, PERMISSIONS.PAYMENT_CREATE)
        ? { key: '/payments', label: 'Record payment' }
        : null,
      hasPermission(user, PERMISSIONS.CUSTOMER_MANAGE)
        ? { key: '/customers', label: 'Manage customers' }
        : null,
    ].filter(Boolean),
    [user],
  );

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.header}>
      <div className={styles.headerStart}>
        <Button
          className={styles.menuButton}
          icon={<MenuOutlined />}
          aria-label="Open navigation"
          onClick={onOpenNavigation}
        />

        <AutoComplete
          className={styles.search}
          value={searchValue}
          options={allowedNavigationOptions}
          filterOption={(inputValue, option) =>
            String(option?.label ?? '')
              .toLowerCase()
              .includes(inputValue.toLowerCase())
          }
          onChange={setSearchValue}
          onSelect={(path: string) => {
            navigate(path);
            setSearchValue('');
          }}
        >
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search pages..."
            aria-label="Search application pages"
          />
        </AutoComplete>
      </div>

      <div className={styles.actions}>
        {quickCreateItems.length > 0 ? (
          <Dropdown
            trigger={['click']}
            menu={{
              onClick: ({ key }) => navigate(key),
              items: quickCreateItems,
            }}
          >
            <Button type="primary" icon={<PlusOutlined />}>
              Quick create <DownOutlined />
            </Button>
          </Dropdown>
        ) : null}

        {canViewNotifications ? (
          <Badge count={unreadCount} size="small" overflowCount={99}>
            <Button
              className={styles.iconButton}
              icon={<BellOutlined />}
              aria-label={
                unreadCount
                  ? `${unreadCount} unread notifications`
                  : 'Notifications'
              }
              onClick={() => navigate('/notifications')}
            />
          </Badge>
        ) : null}

        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Logout',
                onClick: handleLogout,
              },
            ],
          }}
        >
          <button
            type="button"
            className={styles.userButton}
          >
            <Avatar icon={<UserOutlined />} className={styles.avatar} />

            <div className={styles.user}>
              <Typography.Text strong>
                {user?.fullName || user?.username}
              </Typography.Text>

              <Typography.Text
                type="secondary"
                className={styles.userMeta}
              >
                {user?.roles?.[0] || 'USER'}
              </Typography.Text>
            </div>
          </button>
        </Dropdown>
      </div>
    </div>
  );
}
