import {
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Card,
  Typography,
} from 'antd';
import { useTranslation } from 'react-i18next';
import styles from '../TeamPage.module.css';

interface TeamSummaryProps {
  activeMembers: number;
  customRoles: number;
}

export function TeamSummary({ activeMembers, customRoles }: TeamSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.summaryGrid}>
      <Card className={`panel-card ${styles.summaryCard}`}>
        <div className={styles.summaryIcon}><UserOutlined /></div>
        <div>
          <Typography.Text type="secondary">{t('team.summary.activeUsers')}</Typography.Text>
          <Typography.Title level={3}>{activeMembers}</Typography.Title>
        </div>
      </Card>
      <Card className={`panel-card ${styles.summaryCard}`}>
        <div className={styles.summaryIcon}><SafetyCertificateOutlined /></div>
        <div>
          <Typography.Text type="secondary">{t('team.summary.customRoles')}</Typography.Text>
          <Typography.Title level={3}>{customRoles}</Typography.Title>
        </div>
      </Card>
    </div>
  );
}