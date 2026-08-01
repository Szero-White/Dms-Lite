import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import styles from './LoginPage.module.css';
import formStyles from './LoginFormPanel.module.css';
import visualStyles from './LoginVisualPanel.module.css';
import previewStyles from './LoginPreview.module.css';

const demoAccounts = [
  { username: 'owner', password: '123456', role: 'Owner' },
  { username: 'sale', password: '123456', role: 'Sales' },
  { username: 'warehouse', password: '123456', role: 'Warehouse' },
  { username: 'accountant', password: '123456', role: 'Accountant' },
];

export function LoginPage() {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const [form] = Form.useForm();

  return (
    <main className={styles.shell}>
      <section className={formStyles.loginPane}>
        <div className={formStyles.loginContent}>
          <div className={formStyles.brand}>
            <div className={formStyles.brandMark} aria-hidden="true">
              D
            </div>
            <div>
              <div className={formStyles.brandName}>DMS Lite</div>
              <div className={formStyles.brandSubtitle}>
                {t('login.brandSubtitle')}
              </div>
            </div>
          </div>

          <header className={formStyles.formHeader}>
            <h1>{t('login.title')}</h1>
            <p>{t('login.subtitle')}</p>
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
            <Form.Item label={t('login.username')} name="username" rules={[{ required: true }]}>
              <Input
                autoComplete="username"
                prefix={<UserOutlined />}
                placeholder={t('login.usernamePlaceholder')}
                size="large"
              />
            </Form.Item>

            <Form.Item
              className={formStyles.passwordField}
              label={t('login.password')}
              name="password"
              rules={[{ required: true }]}
            >
              <Input.Password
                autoComplete="current-password"
                prefix={<LockOutlined />}
                placeholder={t('login.passwordPlaceholder')}
                size="large"
              />
            </Form.Item>

            <Button
              block
              className={formStyles.submitButton}
              size="large"
              type="primary"
              htmlType="submit"
              loading={submitting}
            >{t('login.signIn')}</Button>
          </Form>

          <details className={formStyles.demoAccounts}>
            <summary>{t('login.demoSummary')}</summary>
            <div className={formStyles.demoList}>
              {demoAccounts.map((account) => (
                <div className={formStyles.demoRow} key={account.username}>
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

      <aside className={visualStyles.visualPane}>
        <div className={visualStyles.visualContent}>
          <div className={previewStyles.productPreview} aria-hidden="true">
            <div className={previewStyles.previewTopbar}>
              <span className={previewStyles.previewLogo}>D</span>
              <span className={previewStyles.previewLine} />
              <span className={previewStyles.previewAvatar} />
            </div>
            <div className={previewStyles.previewBody}>
              <div className={previewStyles.previewSidebar}>
                <span className={previewStyles.previewNavActive} />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className={previewStyles.previewWorkspace}>
                <div className={previewStyles.previewHeading}>
                  <span />
                  <span />
                </div>
                <div className={previewStyles.previewMetrics}>
                  <div><span>{t('login.preview.sales')}</span><i /></div>
                  <div><span>{t('login.preview.inventory')}</span><i /></div>
                  <div><span>{t('login.preview.receivables')}</span><i /></div>
                </div>
                <div className={previewStyles.previewAnalytics}>
                  <div className={previewStyles.previewChart}>
                    <span /><span /><span /><span /><span /><span />
                  </div>
                  <div className={previewStyles.previewStatus}>
                    <div />
                    <span /><span /><span />
                  </div>
                </div>
                <div className={previewStyles.previewTable}>
                  <span /><span /><span /><span />
                </div>
              </div>
            </div>
          </div>

          <div className={visualStyles.visualCopy}>
            <span className={visualStyles.eyebrow}>{t('login.visualEyebrow')}</span>
            <h2>{t('login.visualTitle')}</h2>
            <p>{t('login.visualDescription')}</p>
            <ul>
              <li><span aria-hidden="true">&#10003;</span> {t('login.manageSales')}</li>
              <li><span aria-hidden="true">&#10003;</span> {t('login.controlInventory')}</li>
              <li><span aria-hidden="true">&#10003;</span> {t('login.trackReceivables')}</li>
            </ul>
          </div>
        </div>
      </aside>
    </main>
  );
}
