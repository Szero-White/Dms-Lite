import {
  InboxOutlined,
  PlusOutlined,
  UserAddOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Button, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../../../../lib/format';
import styles from './DashboardWelcomePanel.module.css';

interface DashboardWelcomePanelProps {
  latestOrderCreatedAt?: string;
  onAddCustomer?: () => void;
  onCreateOrder?: () => void;
  onReceiveStock?: () => void;
  onRecordPayment?: () => void;
  userDisplayName: string;
}

export function DashboardWelcomePanel({
  latestOrderCreatedAt,
  onAddCustomer,
  onCreateOrder,
  onReceiveStock,
  onRecordPayment,
  userDisplayName,
}: DashboardWelcomePanelProps) {
  const { t } = useTranslation();
  const hasQuickActions = Boolean(
    onCreateOrder || onReceiveStock || onRecordPayment || onAddCustomer,
  );

  return (
    <section className={styles.welcomePanel}>
      <div>
        <Typography.Text className={styles.welcomeEyebrow}>
          {t('dashboard.welcome.eyebrow')}
        </Typography.Text>
        <Typography.Title level={2} className={styles.welcomeTitle}>
          {t('dashboard.welcome.title', { name: userDisplayName })}
        </Typography.Title>
        <Typography.Paragraph className={styles.welcomeDescription}>
          {latestOrderCreatedAt
            ? t('dashboard.welcome.latestActivity', { time: formatDateTime(latestOrderCreatedAt) })
            : t('dashboard.welcome.noActivity')}
        </Typography.Paragraph>
      </div>
      {hasQuickActions ? (
        <div className={styles.quickActions}>
          {onCreateOrder ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={onCreateOrder}>
              {t('dashboard.action.createOrder')}
            </Button>
          ) : null}
          {onReceiveStock ? (
            <Button icon={<InboxOutlined />} onClick={onReceiveStock}>
              {t('dashboard.action.receiveStock')}
            </Button>
          ) : null}
          {onRecordPayment ? (
            <Button icon={<WalletOutlined />} onClick={onRecordPayment}>
              {t('dashboard.action.recordPayment')}
            </Button>
          ) : null}
          {onAddCustomer ? (
            <Button icon={<UserAddOutlined />} onClick={onAddCustomer}>
              {t('dashboard.action.addCustomer')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
