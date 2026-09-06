import {
  BellOutlined,
  DownOutlined,
  GlobalOutlined,
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
  Segmented,
  Tooltip,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  PERMISSIONS,
  canAccessPath,
  hasPermission,
  useAuth,
} from '../../../features/auth';
import { useNotifications } from '../../../features/notifications';
import { LANGUAGE_STORAGE_KEY, type SupportedLanguage } from '../../../i18n';
import { roleLabel } from '../../../lib/roleDisplay';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  onOpenNavigation?: () => void;
}

export function AppHeader({ onOpenNavigation }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const notificationsQuery = useNotifications();
  const [searchValue, setSearchValue] = useState('');
  const currentLanguage: SupportedLanguage = i18n.resolvedLanguage?.startsWith('vi') ? 'vi' : 'en';
  const navigationOptions = useMemo(
    () => [
      { value: '/dashboard', label: t('app.navigation.dashboard') },
      { value: '/sales-orders', label: t('app.navigation.salesOrders') },
      { value: '/invoices', label: t('app.navigation.invoices') },
      { value: '/products', label: t('app.navigation.products') },
      { value: '/customers', label: t('app.navigation.customers') },
      { value: '/inventory', label: t('app.navigation.inventory') },
      { value: '/payments', label: t('app.navigation.payments') },
      { value: '/reports', label: t('app.navigation.reports') },
      { value: '/notifications', label: t('app.navigation.notifications') },
      { value: '/audit-logs', label: t('app.navigation.auditLogs') },
      { value: '/team', label: t('app.navigation.teamAccess') },
      { value: '/ai-history', label: t('app.navigation.aiHistory') },
    ],
    [t],
  );
  const canViewNotifications = hasPermission(user, PERMISSIONS.NOTIFICATION_VIEW);
  const unreadCount = canViewNotifications
    ? (notificationsQuery.data ?? []).filter(
        (notification) => notification.readFlag === false,
      ).length
    : 0;
  const allowedNavigationOptions = useMemo(
    () => navigationOptions.filter((option) => canAccessPath(user, option.value)),
    [navigationOptions, user],
  );
  const quickCreateItems = useMemo(
    () => [
      hasPermission(user, PERMISSIONS.SALES_ORDER_CREATE) && canAccessPath(user, '/sales-orders/new')
        ? { key: '/sales-orders/new', label: t('app.header.createSalesOrder') }
        : null,
      hasPermission(user, PERMISSIONS.INVENTORY_MANAGE) && canAccessPath(user, '/inventory')
        ? { key: '/inventory', label: t('app.header.receiveStock') }
        : null,
      hasPermission(user, PERMISSIONS.PAYMENT_CREATE) && canAccessPath(user, '/payments')
        ? { key: '/payments', label: t('app.header.recordPayment') }
        : null,
      hasPermission(user, PERMISSIONS.CUSTOMER_MANAGE) && canAccessPath(user, '/customers')
        ? { key: '/customers', label: t('app.header.manageCustomers') }
        : null,
    ].filter(Boolean),
    [t, user],
  );

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function handleLanguageChange(value: string | number) {
    const nextLanguage: SupportedLanguage = value === 'vi' ? 'vi' : 'en';
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    void i18n.changeLanguage(nextLanguage);
  }

  return (
    <div className={styles.header}>
      <div className={styles.headerStart}>
        <Button
          className={styles.menuButton}
          icon={<MenuOutlined />}
          aria-label={t('app.header.openNavigation')}
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
            placeholder={t('app.search.placeholder')}
            aria-label={t('app.search.ariaLabel')}
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
              {t('app.header.quickCreate')} <DownOutlined />
            </Button>
          </Dropdown>
        ) : null}

        <Tooltip title={t('app.header.language')}>
          <div className={styles.languageSwitcher} aria-label={t('app.header.language')}>
            <GlobalOutlined />
            <Segmented
              size="small"
              value={currentLanguage}
              options={[
                { label: 'VI', value: 'vi' },
                { label: 'EN', value: 'en' },
              ]}
              onChange={handleLanguageChange}
            />
          </div>
        </Tooltip>

        {canViewNotifications ? (
          <Badge count={unreadCount} size="small" overflowCount={99}>
            <Button
              className={styles.iconButton}
              icon={<BellOutlined />}
              aria-label={
                unreadCount
                  ? t('app.header.unreadNotifications', { count: unreadCount })
                  : t('app.header.notifications')
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
                label: t('app.header.logout'),
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
                {roleLabel(user?.roles?.[0], t)}
              </Typography.Text>
            </div>
          </button>
        </Dropdown>
      </div>
    </div>
  );
}