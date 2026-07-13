import {
  AppstoreOutlined,
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  DashboardOutlined,
  DollarOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Menu } from 'antd';
import {
  useLocation,
  useNavigate,
} from 'react-router-dom';
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
      {
        key: '/payments',
        icon: <DollarOutlined />,
        label: 'Payments',
      },
    ],
  },
  {
    type: 'group' as const,
    label: 'Operations',
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
      {
        key: '/audit-logs',
        icon: <AuditOutlined />,
        label: 'Audit Logs',
      },
    ],
  },
];

const routeItems = menuItems.flatMap((group) => group.children);

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey =
    routeItems.find((item) =>
      location.pathname.startsWith(item.key),
    )?.key ?? '/dashboard';

  return (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandBadge}>
          <ShopOutlined />
        </div>

        <div>
          <div className={styles.brandTitle}>
            DMS Lite
          </div>

          <div className={styles.brandSubtitle}>
            Distributor OS
          </div>
        </div>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={(event) => navigate(event.key)}
      />
    </div>
  );
}
