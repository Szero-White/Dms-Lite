import { Line } from '@ant-design/charts';
import { Card, Empty } from 'antd';
import { toNumber } from '../../../../lib/format';
import type { SalesOrder } from '../../../../features/sales';
import styles from './DashboardRevenueChart.module.css';

interface DashboardRevenueChartProps {
  orders: SalesOrder[];
}

interface RevenueChartItem {
  dateKey: string;
  dateLabel: string;
  revenue: number;
}

export function DashboardRevenueChart({
  orders,
}: DashboardRevenueChartProps) {
  const today = new Date();

  const chartData: RevenueChartItem[] = Array.from(
    { length: 7 },
    (_, index) => {
      const date = new Date(today);

      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - (6 - index));

      return {
        dateKey: date.toISOString().slice(0, 10),
        dateLabel: date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
        }),
        revenue: 0,
      };
    },
  );

  const revenueMap = new Map(
    chartData.map((item) => [item.dateKey, item]),
  );

  orders
    .filter((order) =>
      ['COMPLETED', 'CONFIRMED'].includes(order.status),
    )
    .forEach((order) => {
      if (!order.createdAt) {
        return;
      }

      const createdDate = new Date(order.createdAt);

      const dateKey = [
        createdDate.getFullYear(),
        String(createdDate.getMonth() + 1).padStart(2, '0'),
        String(createdDate.getDate()).padStart(2, '0'),
      ].join('-');

      const chartItem = revenueMap.get(dateKey);

      if (chartItem) {
        chartItem.revenue += toNumber(order.totalAmount);
      }
    });

  const hasRevenue = chartData.some(
    (item) => item.revenue > 0,
  );

  return (
    <Card
      title="Revenue Trend"
      className={`panel-card ${styles.card}`}
    >
      {hasRevenue ? (
        <Line
          data={chartData}
          xField="dateLabel"
          yField="revenue"
          height={250}
          smooth
          point={{
            size: 5,
            shape: 'circle',
          }}
          axis={{
            x: {
              title: false,
            },
            y: {
              title: 'Revenue',
              labelFormatter: (value: number) =>
                new Intl.NumberFormat('vi-VN', {
                  notation: 'compact',
                  maximumFractionDigits: 1,
                }).format(value),
            },
          }}
          tooltip={{
            title: 'dateLabel',
            items: [
              {
                field: 'revenue',
                name: 'Revenue',
                valueFormatter: (value: number) =>
                  new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    maximumFractionDigits: 0,
                  }).format(value),
              },
            ],
          }}
        />
      ) : (
        <div className={styles.empty}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No confirmed revenue in the last 7 days"
          />
        </div>
      )}
    </Card>
  );
}
