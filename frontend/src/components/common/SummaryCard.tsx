import {
  ArrowDownOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { Card, Progress, Space, Typography } from 'antd';
import type { ReactNode } from 'react';

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
    <Card className={`summary-card summary-card-${variant}`}>
      <div className="summary-card-header">
        <div>
          <Typography.Text className="summary-card-title">
            {title}
          </Typography.Text>

          <Typography.Title
            level={2}
            className="summary-card-value"
          >
            {value}
          </Typography.Title>
        </div>

        {icon ? (
          <div className="summary-card-icon">
            {icon}
          </div>
        ) : null}
      </div>

      {trend !== undefined ? (
        <Space size={6}>
          <Typography.Text
            className={
              isPositive
                ? 'summary-trend-positive'
                : 'summary-trend-negative'
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

      <Typography.Text className="summary-card-note">
        {note}
      </Typography.Text>
    </Card>
  );
}