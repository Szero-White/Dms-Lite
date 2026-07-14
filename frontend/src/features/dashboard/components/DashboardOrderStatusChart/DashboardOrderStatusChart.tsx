import { Pie } from '@ant-design/charts';
import {
  Card,
  Empty,
} from 'antd';
import type { SalesOrder } from '../../../sales';
import styles from './DashboardOrderStatusChart.module.css';

interface DashboardOrderStatusChartProps {
  orders: SalesOrder[];
}

export function DashboardOrderStatusChart({
  orders,
}: DashboardOrderStatusChartProps) {
  const statusMap = orders.reduce<Record<string, number>>(
    (result, order) => {
      result[order.status] =
        (result[order.status] ?? 0) + 1;

      return result;
    },
    {},
  );

  const chartData = Object.entries(statusMap).map(
    ([status, count]) => ({
      status,
      count,
    }),
  );

  return (
    <Card
      title="Order Status"
      className={`panel-card ${styles.card}`}
    >
      {chartData.length ? (
        <Pie
          data={chartData}
          angleField="count"
          colorField="status"
          height={280}
          innerRadius={0.65}
          radius={0.85}
          color={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']}
          legend={{
            color: {
              position: 'bottom',
              rowPadding: 8,
            },
          }}
          label={{
            text: 'count',
            position: 'outside',
            style: {
              fontSize: 12,
              fontWeight: 500,
            },
          }}
          statistic={{
            title: {
              style: {
                fontSize: 14,
                color: '#64748b',
              },
              content: 'Total Orders',
            },
            content: {
              style: {
                fontSize: 24,
                fontWeight: 700,
                color: '#0f172a',
              },
              content: orders.length.toString(),
            },
          }}
          tooltip={{
            title: 'status',
            items: [
              {
                field: 'count',
                name: 'Orders',
              },
            ],
          }}
          pieStyle={{
            lineWidth: 0,
          }}
          animation={{
            appear: {
              animation: 'fade-in',
              duration: 1000,
            },
          }}
        />
      ) : (
        <div className={styles.empty}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No sales orders"
          />
        </div>
      )}
    </Card>
  );
}
