import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
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
    <main className={styles.shell}>
      <section className={styles.loginPane}>
        <div className={styles.loginContent}>
          <div className={styles.brand}>
            <div className={styles.brandMark} aria-hidden="true">
              D
            </div>
            <div>
              <div className={styles.brandName}>DMS Lite</div>
              <div className={styles.brandSubtitle}>
                Distributor Operating System
              </div>
            </div>
          </div>

          <header className={styles.formHeader}>
            <h1>Welcome back</h1>
            <p>Enter your credentials to access your workspace.</p>
          </header>

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
              <Input
                autoComplete="username"
                prefix={<UserOutlined />}
                placeholder="Enter username"
                size="large"
              />
            </Form.Item>

            <Form.Item
              className={styles.passwordField}
              label="Password"
              name="password"
              rules={[{ required: true }]}
            >
              <Input.Password
                autoComplete="current-password"
                prefix={<LockOutlined />}
                placeholder="Enter password"
                size="large"
              />
            </Form.Item>

            <Button
              block
              className={styles.submitButton}
              size="large"
              type="primary"
              htmlType="submit"
              loading={submitting}
            >
              Sign in
            </Button>
          </Form>

          <details className={styles.demoAccounts}>
            <summary>Use a demo account</summary>
            <div className={styles.demoList}>
              {demoAccounts.map((account) => (
                <div className={styles.demoRow} key={account.username}>
                  <span>{account.role}</span>
                  <span aria-hidden="true">&mdash;</span>
                  <span>
                    {account.username} / {account.password}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      </section>

      <aside className={styles.visualPane}>
        <div className={styles.visualContent}>
          <div className={styles.productPreview} aria-hidden="true">
            <div className={styles.previewTopbar}>
              <span className={styles.previewLogo}>D</span>
              <span className={styles.previewLine} />
              <span className={styles.previewAvatar} />
            </div>
            <div className={styles.previewBody}>
              <div className={styles.previewSidebar}>
                <span className={styles.previewNavActive} />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className={styles.previewWorkspace}>
                <div className={styles.previewHeading}>
                  <span />
                  <span />
                </div>
                <div className={styles.previewMetrics}>
                  <div><span>Sales</span><i /></div>
                  <div><span>Inventory</span><i /></div>
                  <div><span>Receivables</span><i /></div>
                </div>
                <div className={styles.previewAnalytics}>
                  <div className={styles.previewChart}>
                    <span /><span /><span /><span /><span /><span />
                  </div>
                  <div className={styles.previewStatus}>
                    <div />
                    <span /><span /><span />
                  </div>
                </div>
                <div className={styles.previewTable}>
                  <span /><span /><span /><span />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.visualCopy}>
            <span className={styles.eyebrow}>DISTRIBUTION, SIMPLIFIED</span>
            <h2>One workspace for daily commercial operations.</h2>
            <p>Keep every order, stock movement, and customer balance visible to the right team.</p>
            <ul>
              <li><span aria-hidden="true">&#10003;</span> Manage sales</li>
              <li><span aria-hidden="true">&#10003;</span> Control inventory</li>
              <li><span aria-hidden="true">&#10003;</span> Track receivables</li>
            </ul>
          </div>
        </div>
      </aside>
    </main>
  );
}
