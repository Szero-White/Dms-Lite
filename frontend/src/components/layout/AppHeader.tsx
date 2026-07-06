import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Space, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-header">
      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>
          DMS Lite
        </Typography.Title>
        <Typography.Text type="secondary">Sales, Inventory & Receivable Management</Typography.Text>
      </div>
      <Space size="middle">
        <Avatar icon={<UserOutlined />} />
        <div className="user-box">
          <Typography.Text strong>{user?.fullName || user?.username}</Typography.Text>
          <Space size={8}>
            <Typography.Text type="secondary">{user?.username}</Typography.Text>
            <Tag color="blue">{user?.roles?.[0] || 'USER'}</Tag>
          </Space>
        </div>
        <Button
          icon={<LogoutOutlined />}
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          Logout
        </Button>
      </Space>
    </div>
  );
}
