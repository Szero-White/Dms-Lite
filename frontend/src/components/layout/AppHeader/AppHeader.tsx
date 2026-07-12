import {
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Tag,
  Typography,
} from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../../hooks/useAuth';
import styles from './AppHeader.module.css';

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.header}>
      <div className={styles.brandInfo}>
        <Typography.Title
          level={4}
          className={styles.title}
        >
          DMS Lite
        </Typography.Title>

        <Typography.Text
          type="secondary"
          className={styles.subtitle}
        >
          Sales, Inventory & Receivable Management
        </Typography.Text>
      </div>

      <div className={styles.actions}>
        <Avatar icon={<UserOutlined />} />

        <div className={styles.user}>
          <Typography.Text strong>
            {user?.fullName || user?.username}
          </Typography.Text>

          <div className={styles.userMeta}>
            <Typography.Text type="secondary">
              {user?.username}
            </Typography.Text>

            <Tag color="blue">
              {user?.roles?.[0] || 'USER'}
            </Tag>
          </div>
        </div>

        <Button
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}