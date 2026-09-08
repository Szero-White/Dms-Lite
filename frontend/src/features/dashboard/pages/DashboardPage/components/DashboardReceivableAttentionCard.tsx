import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, Card, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ReceivableDueTag } from '../../../../../components/common/ReceivableDueTag';
import { formatCurrency, formatDate } from '../../../../../lib/format';
import type { ReceivableAttention } from '../../../types/dashboard.types';
import styles from './DashboardReceivableAttentionCard.module.css';

interface DashboardReceivableAttentionCardProps {
  attention: ReceivableAttention;
  onOpenReceivables?: () => void;
}

export function DashboardReceivableAttentionCard({
  attention,
  onOpenReceivables,
}: DashboardReceivableAttentionCardProps) {
  const { i18n, t } = useTranslation();
  const totalAttentionCount = attention.overdueCount
    + attention.dueTodayCount
    + attention.dueSoonCount;

  return (
    <Card
      className={`panel-card ${styles.card}`}
      title={t('dashboard.attention.receivables.title')}
    >
      {totalAttentionCount === 0 ? (
        <div className={styles.clearState}>
          <CheckCircleOutlined />
          <div>
            <strong>{t('dashboard.attention.receivables.clearTitle')}</strong>
            <span>{t('dashboard.attention.receivables.clearDescription')}</span>
          </div>
        </div>
      ) : (
        <div className={styles.summaryGrid}>
          <AttentionMetric
            icon={<WarningOutlined />}
            label={t('dashboard.attention.receivables.overdue')}
            amount={attention.overdueAmount}
            count={attention.overdueCount}
            tone="danger"
          />
          <AttentionMetric
            icon={<ClockCircleOutlined />}
            label={t('dashboard.attention.receivables.dueToday')}
            amount={attention.dueTodayAmount}
            count={attention.dueTodayCount}
            tone="today"
          />
          <AttentionMetric
            icon={<CalendarOutlined />}
            label={t('dashboard.attention.receivables.dueSoon')}
            amount={attention.dueSoonAmount}
            count={attention.dueSoonCount}
            tone="warning"
          />
        </div>
      )}

      {attention.oldestOverdue ? (
        <div className={styles.oldestOverdue}>
          <div className={styles.oldestHeader}>
            <div>
              <Typography.Text strong>{attention.oldestOverdue.customerName}</Typography.Text>
              <Typography.Text type="secondary">
                {attention.oldestOverdue.salesOrderCode}
              </Typography.Text>
            </div>
            <Typography.Text strong className={styles.overdueAmount}>
              {formatCurrency(attention.oldestOverdue.remainingAmount, i18n.language)}
            </Typography.Text>
          </div>
          <div className={styles.oldestMeta}>
            <span>
              {t('dashboard.attention.receivables.dueDate', {
                date: formatDate(attention.oldestOverdue.dueDate, i18n.language),
              })}
            </span>
            <ReceivableDueTag
              status="OVERDUE"
              daysUntilDue={-attention.oldestOverdue.daysOverdue}
            />
          </div>
        </div>
      ) : null}

      {onOpenReceivables ? (
        <Button type="link" icon={<ArrowRightOutlined />} onClick={onOpenReceivables}>
          {t('dashboard.attention.receivables.open')}
        </Button>
      ) : null}
    </Card>
  );
}

interface AttentionMetricProps {
  icon: ReactNode;
  label: string;
  amount: string | number;
  count: number;
  tone: 'danger' | 'today' | 'warning';
}

function AttentionMetric({ icon, label, amount, count, tone }: AttentionMetricProps) {
  const { i18n, t } = useTranslation();

  return (
    <div className={`${styles.metric} ${styles[tone]}`}>
      <div className={styles.metricLabel}>
        <span className={styles.metricIcon}>{icon}</span>
        <span>{label}</span>
      </div>
      <div className={styles.metricValueRow}>
        <strong>{formatCurrency(amount, i18n.language)}</strong>
        <span>{t('dashboard.attention.receivables.itemCount', { count })}</span>
      </div>
    </div>
  );
}
