import {
  BellOutlined,
  LogoutOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Dropdown,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useAuth } from '../../../features/auth';
import styles from './AppHeader.module.css';

const pageTitles = [
  {
    path: '/sales-orders/new',
    title: 'Create Sales Order',
    eyebrow: 'Sales',
  },
  {
    path: '/sales-orders',
    title: 'Sales Orders',
    eyebrow: 'Sales',
  },
  {
    path: '/customers',
    title: 'Customers',
    eyebrow: 'Sales',
  },
  {
    path: '/payments',
    title: 'Payments',
    eyebrow: 'Sales',
  },
  {
    path: '/products',
    title: 'Products',
    eyebrow: 'Operations',
  },
  {
    path: '/inventory',
    title: 'Inventory',
    eyebrow: 'Operations',
  },
  {
    path: '/reports',
    title: 'Reports',
    eyebrow: 'Insights',
  },
  {
    path: '/notifications',
    title: 'Notifications',
    eyebrow: 'Insights',
  },
  {
    path: '/audit-logs',
    title: 'Audit Logs',
    eyebrow: 'Insights',
  },
  {
    path: '/dashboard',
    title: 'Dashboard',
    eyebrow: 'Overview',
  },
];

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPage =
    pageTitles.find((page) =>
      location.pathname.startsWith(page.path),
    ) ?? pageTitles[pageTitles.length - 1];

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.header}>
      <div className={styles.brandInfo}>
        <Typography.Text
          type="secondary"
          className={styles.eyebrow}
        >
          {currentPage.eyebrow}
        </Typography.Text>

        <Typography.Title
          level={4}
          className={styles.title}
        >
          {currentPage.title}
        </Typography.Title>
      </div>

      <div className={styles.actions}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/sales-orders/new')}
        >
          New sales order
        </Button>

        <Button
          className={styles.iconButton}
          icon={<BellOutlined />}
          onClick={() => navigate('/notifications')}
        />

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
            <Avatar icon={<UserOutlined />} />

            <div className={styles.user}>
              <Typography.Text strong>
                {user?.fullName || user?.username}
              </Typography.Text>

              <Space
                size={6}
                className={styles.userMeta}
              >
                <Typography.Text type="secondary">
                  {user?.username}
                </Typography.Text>

                <Tag color="blue">
                  {user?.roles?.[0] || 'USER'}
                </Tag>
              </Space>
            </div>
          </button>
        </Dropdown>
      </div>
    </div>
  );
}
