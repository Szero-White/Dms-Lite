import { Card, Typography } from 'antd';

interface SummaryCardProps {
  title: string;
  value: React.ReactNode;
  note: string;
}

export function SummaryCard({ title, value, note }: SummaryCardProps) {
  return (
    <Card className="summary-card">
      <Typography.Text className="summary-card-title">{title}</Typography.Text>
      <Typography.Title level={2} className="summary-card-value">
        {value}
      </Typography.Title>
      <Typography.Text className="summary-card-note">{note}</Typography.Text>
    </Card>
  );
}
