import {
  AppstoreOutlined,
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  DashboardOutlined,
  DollarOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Menu } from 'antd';
import {
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useAuth } from '../../../features/auth';
import styles from './AppSidebar.module.css';

const menuItems = [
  {
    type: 'group' as const,
    label: 'Overview',
    children: [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      },
    ],
  },
  {
    type: 'group' as const,
    label: 'Sales',
    children: [
      {
        key: '/sales-orders',
        icon: <ShoppingCartOutlined />,
        label: 'Sales Orders',
      },
      {
        key: '/customers',
        icon: <TeamOutlined />,
        label: 'Customers',
      },
    ],
  },
  {
    type: 'group' as const,
    label: 'Catalog & Inventory',
    children: [
      {
        key: '/products',
        icon: <AppstoreOutlined />,
        label: 'Products',
      },
      {
        key: '/inventory',
        icon: <InboxOutlined />,
        label: 'Inventory',
      },
    ],
  },
  {
    type: 'group' as const,
    label: 'Finance',
    children: [
      {
        key: '/payments',
        icon: <DollarOutlined />,
        label: 'Payments',
      },
    ],
  },
  {
    type: 'group' as const,
    label: 'Insights',
    children: [
      {
        key: '/reports',
        icon: <BarChartOutlined />,
        label: 'Reports',
      },
      {
        key: '/notifications',
        icon: <BellOutlined />,
        label: 'Notifications',
      },
    ],
  },
  {
    type: 'group' as const,
    label: 'Administration',
    children: [
      {
        key: '/audit-logs',
        icon: <AuditOutlined />,
        label: 'Audit Logs',
      },
    ],
  },
];

const routeItems = menuItems.flatMap((group) => group.children);

interface AppSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}

export function AppSidebar({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const selectedKey =
    routeItems.find((item) =>
      location.pathname.startsWith(item.key),
    )?.key ?? '/dashboard';

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.brand}>
        <div className={styles.brandBadge}>
          <ShopOutlined />
        </div>

        <div className={styles.brandCopy}>
          <div className={styles.brandTitle}>
            DMS Lite
          </div>

          <div className={styles.brandSubtitle}>
            Distribution workspace
          </div>
        </div>
      </div>

      <Menu
        mode="inline"
        inlineCollapsed={collapsed}
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={(event) => {
          navigate(event.key);
          onNavigate?.();
        }}
      />

      <div className={styles.sidebarFooter}>
        <div className={styles.userSummary}>
          <Avatar size={32} icon={<UserOutlined />} />
          <div className={styles.userCopy}>
            <span>{user?.fullName || user?.username}</span>
            <small>{user?.roles?.[0] || 'USER'}</small>
          </div>
        </div>

        {onToggleCollapse ? (
          <button
            type="button"
            className={styles.collapseButton}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={onToggleCollapse}
          >
            {collapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
            <span>Collapse</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
