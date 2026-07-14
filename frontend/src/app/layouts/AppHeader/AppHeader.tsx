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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/auth';
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
];

interface AppHeaderProps {
  onOpenNavigation?: () => void;
}

export function AppHeader({ onOpenNavigation }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const notificationsQuery = useNotifications();
  const [searchValue, setSearchValue] = useState('');
  const unreadCount = (notificationsQuery.data ?? []).filter(
    (notification) => notification.readFlag === false,
  ).length;

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
          options={navigationOptions}
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
        <Dropdown
          trigger={['click']}
          menu={{
            onClick: ({ key }) => navigate(key),
            items: [
              { key: '/sales-orders/new', label: 'Create sales order' },
              { key: '/inventory', label: 'Receive stock' },
              { key: '/payments', label: 'Record payment' },
              { key: '/customers', label: 'Manage customers' },
            ],
          }}
        >
          <Button type="primary" icon={<PlusOutlined />}>
            Quick create <DownOutlined />
          </Button>
        </Dropdown>

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
