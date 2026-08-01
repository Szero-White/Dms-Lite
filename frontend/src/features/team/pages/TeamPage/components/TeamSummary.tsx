import {
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Card,
  Typography,
} from 'antd';
import styles from '../TeamPage.module.css';

interface TeamSummaryProps {
  activeMembers: number;
  customRoles: number;
}

export function TeamSummary({ activeMembers, customRoles }: TeamSummaryProps) {
  return (
    <div className={styles.summaryGrid}>
      <Card className={`panel-card ${styles.summaryCard}`}>
        <div className={styles.summaryIcon}><UserOutlined /></div>
        <div>
          <Typography.Text type="secondary">Active users</Typography.Text>
          <Typography.Title level={3}>{activeMembers}</Typography.Title>
        </div>
      </Card>
      <Card className={`panel-card ${styles.summaryCard}`}>
        <div className={styles.summaryIcon}><SafetyCertificateOutlined /></div>
        <div>
          <Typography.Text type="secondary">Custom roles</Typography.Text>
          <Typography.Title level={3}>{customRoles}</Typography.Title>
        </div>
      </Card>
    </div>
  );
}
