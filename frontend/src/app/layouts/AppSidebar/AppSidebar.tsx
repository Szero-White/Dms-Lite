import {
  AppstoreOutlined,
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  HistoryOutlined,
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
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  canAccessPath,
  useAuth,
} from '../../../features/auth';
import { roleLabel } from '../../../lib/roleDisplay';
import styles from './AppSidebar.module.css';

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
  const { t } = useTranslation();
  const menuItems = useMemo(() => [
    {
      type: 'group' as const,
      label: t('sidebar.group.overview'),
      children: [
        {
          key: '/dashboard',
          icon: <DashboardOutlined />,
          label: t('app.navigation.dashboard'),
        },
      ],
    },
    {
      type: 'group' as const,
      label: t('sidebar.group.sales'),
      children: [
        {
          key: '/sales-orders',
          icon: <ShoppingCartOutlined />,
          label: t('app.navigation.salesOrders'),
        },
        {
          key: '/customers',
          icon: <TeamOutlined />,
          label: t('app.navigation.customers'),
        },
      ],
    },
    {
      type: 'group' as const,
      label: t('sidebar.group.catalogInventory'),
      children: [
        {
          key: '/products',
          icon: <AppstoreOutlined />,
          label: t('app.navigation.products'),
        },
        {
          key: '/inventory',
          icon: <InboxOutlined />,
          label: t('app.navigation.inventory'),
        },
      ],
    },
    {
      type: 'group' as const,
      label: t('sidebar.group.finance'),
      children: [
        {
          key: '/payments',
          icon: <DollarOutlined />,
          label: t('app.navigation.payments'),
        },
      ],
    },
    {
      type: 'group' as const,
      label: t('sidebar.group.insights'),
      children: [
        {
          key: '/reports',
          icon: <BarChartOutlined />,
          label: t('app.navigation.reports'),
        },
        {
          key: '/notifications',
          icon: <BellOutlined />,
          label: t('app.navigation.notifications'),
        },
      ],
    },
    {
      type: 'group' as const,
      label: t('sidebar.group.administration'),
      children: [
        {
          key: '/audit-logs',
          icon: <AuditOutlined />,
          label: t('app.navigation.auditLogs'),
        },
        {
          key: '/team',
          icon: <TeamOutlined />,
          label: t('app.navigation.teamAccess'),
        },
        {
          key: '/ai-history',
          icon: <HistoryOutlined />,
          label: t('app.navigation.aiHistory'),
        },
      ],
    },
  ], [t]);

  const visibleMenuItems = useMemo(() => menuItems
    .map((group) => ({
      ...group,
      children: group.children.filter((item) => canAccessPath(user, item.key)),
    }))
    .filter((group) => group.children.length > 0), [menuItems, user]);
  const routeItems = visibleMenuItems.flatMap((group) => group.children);
  const selectedKey =
    routeItems.find((item) =>
      location.pathname.startsWith(item.key),
    )?.key ?? routeItems[0]?.key;

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
            {t('sidebar.brandSubtitle')}
          </div>
        </div>
      </div>

      <Menu
        mode="inline"
        inlineCollapsed={collapsed}
        selectedKeys={selectedKey ? [selectedKey] : []}
        items={visibleMenuItems}
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
            <small>{roleLabel(user?.roles?.[0], t)}</small>
          </div>
        </div>

        {onToggleCollapse ? (
          <button
            type="button"
            className={styles.collapseButton}
            aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
            onClick={onToggleCollapse}
          >
            {collapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
            <span>{collapsed ? '>>' : t('sidebar.collapse')}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}