import {
  AlertOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  DashboardOutlined,
  DollarOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import styles from './AppSidebar.module.css';

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/sales-orders',
    icon: <ShoppingCartOutlined />,
    label: 'Sales Orders',
  },
  {
    key: '/products',
    icon: <AppstoreOutlined />,
    label: 'Products',
  },
  {
    key: '/customers',
    icon: <TeamOutlined />,
    label: 'Customers',
  },
  {
    key: '/inventory',
    icon: <InboxOutlined />,
    label: 'Inventory',
  },
  {
    key: '/payments',
    icon: <DollarOutlined />,
    label: 'Payments',
  },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: 'Reports',
  },
  {
    key: '/audit-logs',
    icon: <AuditOutlined />,
    label: 'Audit Logs',
  },
  {
    key: '/notifications',
    icon: <BellOutlined />,
    label: 'Notifications',
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey =
    menuItems.find((item) =>
      location.pathname.startsWith(item.key),
    )?.key ?? '/dashboard';

  return (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandBadge}>
          <AlertOutlined />
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