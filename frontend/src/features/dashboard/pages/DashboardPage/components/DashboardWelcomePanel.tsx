import {
  InboxOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Button, Typography } from 'antd';
import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../../../../lib/format';
import { DashboardMascot } from './DashboardMascot/DashboardMascot';
import styles from './DashboardWelcomePanel.module.css';

interface QuickActionItem {
  key: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  primary: boolean;
}

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

  const quickActions = useMemo<QuickActionItem[]>(() => ([
    onCreateOrder ? {
      key: 'create-order',
      icon: <PlusOutlined /> as ReactNode,
      label: t('dashboard.action.createOrder'),
      onClick: onCreateOrder,
      primary: true,
    } : null,
    onReceiveStock ? {
      key: 'receive-stock',
      icon: <InboxOutlined /> as ReactNode,
      label: t('dashboard.action.receiveStock'),
      onClick: onReceiveStock,
      primary: false,
    } : null,
    onRecordPayment ? {
      key: 'record-payment',
      icon: <WalletOutlined /> as ReactNode,
      label: t('dashboard.action.recordPayment'),
      onClick: onRecordPayment,
      primary: false,
    } : null,
    onAddCustomer ? {
      key: 'add-customer',
      icon: <UserAddOutlined /> as ReactNode,
      label: t('dashboard.action.addCustomer'),
      onClick: onAddCustomer,
      primary: false,
    } : null,
  ].filter((value): value is QuickActionItem => Boolean(value))), [onAddCustomer, onCreateOrder, onReceiveStock, onRecordPayment, t]);

  const latestActivityText = latestOrderCreatedAt
    ? t('dashboard.welcome.latestActivity', { time: formatDateTime(latestOrderCreatedAt) })
    : t('dashboard.welcome.noActivity');

  return (
    <section className={styles.welcomePanel}>
      <div className={styles.copyColumn}>
        <div className={styles.copyTop}>
          <Typography.Text className={styles.welcomeEyebrow}>
            {t('dashboard.welcome.eyebrow')}
          </Typography.Text>
          <Typography.Title level={2} className={styles.welcomeTitle}>
            {t('dashboard.welcome.title', { name: userDisplayName })}
          </Typography.Title>
          <Typography.Paragraph className={styles.welcomeDescription}>
            {latestActivityText}
          </Typography.Paragraph>
        </div>

        <div className={styles.heroBody}>
          <div className={styles.mascotStoryCard}>
            <span className={styles.storyBadge}>
              <ThunderboltOutlined />
              {t('dashboard.welcome.workspaceReady')}
            </span>
            <span className={styles.mascotSpeechTitle}>
              {t('dashboard.welcome.mascotGreeting', { name: userDisplayName })}
            </span>
            <span className={styles.mascotSpeechText}>
              {t('dashboard.welcome.mascotCaption')}
            </span>
            <div className={styles.highlightRow}>
              {quickActions.slice(0, 3).map((action) => (
                <span key={action.key} className={styles.highlightChip}>
                  {action.label}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.heroMascotStage}>
            <DashboardMascot size="jumbo" />
          </div>
        </div>
      </div>

      <div className={styles.rightRail}>
        <div className={styles.snapshotCard}>
          <div className={styles.snapshotHeader}>
            <div>
              <Typography.Text className={styles.snapshotLabel}>
                {t('dashboard.welcome.snapshotTitle')}
              </Typography.Text>
              <Typography.Text className={styles.snapshotDescription}>
                {t('dashboard.welcome.liveStatusValue')}
              </Typography.Text>
            </div>
            <span className={styles.livePill}>{t('dashboard.welcome.liveStatus')}</span>
          </div>

          <div className={styles.snapshotStats}>
            <div>
              <span>{t('dashboard.welcome.shortcuts')}</span>
              <strong>{quickActions.length}</strong>
            </div>
            <div>
              <span>{t('dashboard.welcome.latestLabel')}</span>
              <strong>{latestOrderCreatedAt ? t('dashboard.welcome.updated') : t('dashboard.welcome.pending')}</strong>
            </div>
          </div>

          <div className={styles.quickActionBadges}>
            {quickActions.map((action) => (
              <span key={action.key} className={styles.quickActionBadge}>{action.label}</span>
            ))}
          </div>
        </div>

        <div className={styles.actionCluster}>
          {quickActions.length ? (
            <div className={styles.quickActions}>
              {quickActions.map((action) => (
                <Button key={action.key} type={action.primary ? 'primary' : 'default'} icon={action.icon} onClick={action.onClick}>
                  {action.label}
                </Button>
              ))}
            </div>
          ) : null}

          <div className={styles.assistantCard}>
            <div className={styles.assistantPulse} aria-hidden="true" />
            <div>
              <Typography.Text className={styles.assistantLabel}>
                {t('dashboard.welcome.mascotTitle')}
              </Typography.Text>
              <Typography.Text className={styles.assistantHint}>
                {t('dashboard.welcome.mascotHint')}
              </Typography.Text>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
