import {
  AlertOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  DashboardOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

const items = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/sales-orders', icon: <ShoppingCartOutlined />, label: 'Sales Orders' },
  { key: '/products', icon: <AppstoreOutlined />, label: 'Products' },
  { key: '/customers', icon: <TeamOutlined />, label: 'Customers' },
  { key: '/inventory', icon: <InboxOutlined />, label: 'Inventory' },
  { key: '/payments', icon: <DollarOutlined />, label: 'Payments' },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
  { key: '/audit-logs', icon: <AuditOutlined />, label: 'Audit Logs' },
  { key: '/notifications', icon: <BellOutlined />, label: 'Notifications' },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey = items.find((item) => location.pathname.startsWith(item.key))?.key ?? '/dashboard';

  return (
    <div className="app-sidebar">
      <div className="brand-block">
        <div className="brand-badge">
          <AlertOutlined />
        </div>
        <div>
          <div className="brand-title">DMS Lite</div>
          <div className="brand-subtitle">Distributor OS</div>
        </div>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={items}
        onClick={(event) => navigate(event.key)}
        style={{ borderInlineEnd: 'none', background: 'transparent' }}
      />
    </div>
  );
}
