import {
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Space,
  Typography,
} from 'antd';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from './LoginPage.module.css';

const demoAccounts = [
  { username: 'owner', password: '123456', role: 'Owner' },
  { username: 'sale', password: '123456', role: 'Sales' },
  { username: 'warehouse', password: '123456', role: 'Warehouse' },
  { username: 'accountant', password: '123456', role: 'Accountant' },
];

export function LoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const [form] = Form.useForm();

  return (
    <div className={styles.shell}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <Typography.Text className={styles.eyebrow}>DMS Lite</Typography.Text>
          <Typography.Title style={{ color: '#fff', marginBottom: 12 }}>
            Sales, Inventory & Receivable Management
          </Typography.Title>
          <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, maxWidth: 560 }}>
            Built for small distributors who need tighter visibility on stock, order execution, receivable debt,
            and daily operating discipline.
          </Typography.Paragraph>
          <Row gutter={[16, 16]}>
            {demoAccounts.map((account) => (
              <Col xs={24} sm={12} key={account.username}>
                <Card size="small" className={styles.demoCard}>
                  <Space direction="vertical" size={2}>
                    <Typography.Text strong>{account.role}</Typography.Text>
                    <Typography.Text>{account.username} / {account.password}</Typography.Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      <Card className={styles.loginCard}>
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div>
            <Typography.Title level={3} style={{ marginBottom: 4 }}>
              Welcome back
            </Typography.Title>
            <Typography.Text type="secondary">Sign in to continue managing orders, stock, and receivables.</Typography.Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{ username: 'owner', password: '123456' }}
            onFinish={async (values) => {
              setSubmitting(true);
              try {
                await login(values);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Form.Item label="Username" name="username" rules={[{ required: true }]}>
              <Input prefix={<UserOutlined />} size="large" />
            </Form.Item>
            <Form.Item label="Password" name="password" rules={[{ required: true }]}>
              <Input.Password prefix={<LockOutlined />} size="large" />
            </Form.Item>
            <Button block size="large" type="primary" htmlType="submit" loading={submitting}>
              Login to DMS Lite
            </Button>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
