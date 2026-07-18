import {
  InboxOutlined,
  PlusOutlined,
  UserAddOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Button, Typography } from 'antd';
import { formatDateTime } from '../../../../../lib/format';
import styles from '../DashboardPage.module.css';

interface DashboardWelcomePanelProps {
  latestOrderCreatedAt?: string;
  onAddCustomer: () => void;
  onCreateOrder: () => void;
  onReceiveStock: () => void;
  onRecordPayment: () => void;
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
  return (
    <section className={styles.welcomePanel}>
      <div>
        <Typography.Text className={styles.welcomeEyebrow}>
          Distribution workspace
        </Typography.Text>
        <Typography.Title level={2} className={styles.welcomeTitle}>
          Welcome back, {userDisplayName}
        </Typography.Title>
        <Typography.Paragraph className={styles.welcomeDescription}>
          {latestOrderCreatedAt
            ? `Latest recorded order activity: ${formatDateTime(latestOrderCreatedAt)}`
            : 'No recorded sales order activity yet.'}
        </Typography.Paragraph>
      </div>
      <div className={styles.quickActions}>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreateOrder}>
          Create Order
        </Button>
        <Button icon={<InboxOutlined />} onClick={onReceiveStock}>
          Receive Stock
        </Button>
        <Button icon={<WalletOutlined />} onClick={onRecordPayment}>
          Record Payment
        </Button>
        <Button icon={<UserAddOutlined />} onClick={onAddCustomer}>
          Add Customer
        </Button>
      </div>
    </section>
  );
}
