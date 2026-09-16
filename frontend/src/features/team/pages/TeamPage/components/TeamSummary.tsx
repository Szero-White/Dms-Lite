import {
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styles from '../TeamPage.module.css';

interface TeamSummaryProps {
  activeMembers: number;
  customRoles: number;
}

export function TeamSummary({ activeMembers, customRoles }: TeamSummaryProps) {
  const { t } = useTranslation();

  return (
    <section className={styles.accessRail} aria-label={t('team.title')}>
      <div className={styles.accessLead}>
        <span className={styles.accessKicker}>{t('team.tabs.members')}</span>
        <strong className={styles.accessPrimaryValue}>{activeMembers}</strong>
        <span className={styles.accessPrimaryLabel}>{t('team.summary.activeUsers')}</span>
      </div>

      <div className={styles.accessFlow} aria-hidden="true">
        <span className={styles.flowNode}><UserOutlined /></span>
        <span className={styles.flowLine} />
        <span className={styles.flowNode}><SafetyCertificateOutlined /></span>
      </div>

      <div className={styles.accessMetric}>
        <span className={styles.accessMetricLabel}>{t('team.summary.customRoles')}</span>
        <strong className={styles.accessMetricValue}>{customRoles}</strong>
        <span className={styles.accessMetricHint}>{t('team.tabs.roles')}</span>
      </div>
    </section>
  );
}
