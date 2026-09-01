import { CheckOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import styles from './LoginPage.module.css';
import formStyles from './LoginFormPanel.module.css';
import visualStyles from './LoginVisualPanel.module.css';
import previewStyles from './LoginPreview.module.css';
import { DEFAULT_DEMO_ACCOUNT, DEMO_ACCOUNTS, type DemoAccount } from './demoAccounts';

export function LoginPage() {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const [form] = Form.useForm();
  const selectedUsername = Form.useWatch('username', form);

  const selectDemoAccount = (account: DemoAccount) => {
    form.setFieldsValue({
      username: account.username,
      password: account.password,
    });
  };

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
            initialValues={{
              username: DEFAULT_DEMO_ACCOUNT.username,
              password: DEFAULT_DEMO_ACCOUNT.password,
            }}
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
            >
              {t('login.signIn')}
            </Button>
          </Form>

          <section className={formStyles.demoAccounts} aria-labelledby="demo-accounts-title">
            <div className={formStyles.demoHeader}>
              <strong id="demo-accounts-title">{t('login.demoSummary')}</strong>
              <span>{t('login.demoHint')}</span>
            </div>

            <div className={formStyles.demoGrid}>
              {DEMO_ACCOUNTS.map((account) => {
                const selected = selectedUsername === account.username;

                return (
                  <button
                    className={formStyles.demoAccountCard}
                    type="button"
                    key={account.username}
                    onClick={() => selectDemoAccount(account)}
                    aria-pressed={selected}
                  >
                    <span className={formStyles.demoAccountHeader}>
                      <span className={formStyles.demoBadge} aria-hidden="true">
                        {account.badge}
                      </span>
                      <strong>{account.role}</strong>
                      {selected && (
                        <CheckOutlined
                          className={formStyles.demoSelectedIcon}
                          aria-hidden="true"
                        />
                      )}
                    </span>

                    <span className={formStyles.demoCredentials}>
                      <span className={formStyles.demoCredentialRow}>
                        <span>{t('login.username')}</span>
                        <strong>{account.username}</strong>
                      </span>
                      <span className={formStyles.demoCredentialRow}>
                        <span>{t('login.password')}</span>
                        <strong>{account.password}</strong>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
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
