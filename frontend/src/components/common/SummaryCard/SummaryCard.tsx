import {
  ArrowDownOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { Card, Progress, Space, Typography } from 'antd';
import type { ReactNode } from 'react';
import styles from './SummaryCard.module.css';

interface SummaryCardProps {
  title: string;
  value: ReactNode;
  note: string;
  icon?: ReactNode;
  trend?: number;
  progress?: number;
  variant?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

export function SummaryCard({
  title,
  value,
  note,
  icon,
  trend,
  progress,
  variant = 'blue',
}: SummaryCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <Card className={`${styles.card} ${styles[variant]}`}>
      <div className={styles.header}>
        <div>
          <Typography.Text className={styles.title}>
            {title}
          </Typography.Text>

          <Typography.Title
            level={2}
            className={styles.value}
          >
            {value}
          </Typography.Title>
        </div>

        {icon ? (
          <div className={styles.icon}>
            {icon}
          </div>
        ) : null}
      </div>

      {trend !== undefined ? (
        <Space size={6}>
          <Typography.Text
            className={
              isPositive
                ? styles.trendPositive
                : styles.trendNegative
            }
          >
            {isPositive ? (
              <ArrowUpOutlined />
            ) : (
              <ArrowDownOutlined />
            )}

            {' '}
            {Math.abs(trend)}%
          </Typography.Text>

          <Typography.Text type="secondary">
            vs previous period
          </Typography.Text>
        </Space>
      ) : null}

      {progress !== undefined ? (
        <Progress
          percent={progress}
          showInfo={false}
          size="small"
        />
      ) : null}

      <Typography.Text className={styles.note}>
        {note}
      </Typography.Text>
    </Card>
  );
}