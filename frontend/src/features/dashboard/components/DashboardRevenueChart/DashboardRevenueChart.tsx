import { Line } from '@ant-design/charts';
import {
  Card,
  Empty,
} from 'antd';
import { toNumber } from '../../../../lib/format';
import type { SalesOrder } from '../../../sales';
import styles from './DashboardRevenueChart.module.css';

interface DashboardRevenueChartProps {
  orders: SalesOrder[];
  rangeDays?: number;
}

interface RevenueChartItem {
  dateKey: string;
  dateLabel: string;
  revenue: number;
}

export function DashboardRevenueChart({
  orders,
  rangeDays = 7,
}: DashboardRevenueChartProps) {
  const today = new Date();

  const chartData: RevenueChartItem[] = Array.from(
    { length: rangeDays },
    (_, index) => {
      const date = new Date(today);

      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - (rangeDays - 1 - index));

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
          height={280}
          smooth
          color="#6366f1"
          point={{
            size: 6,
            shape: 'circle',
            style: {
              fill: '#6366f1',
              stroke: '#fff',
              lineWidth: 2,
            },
          }}
          line={{
            style: {
              stroke: '#6366f1',
              lineWidth: 3,
              shadowColor: 'rgba(99, 102, 241, 0.3)',
              shadowBlur: 10,
            },
          }}
          area={{
            style: {
              fill: 'l(270) 0:#ffffff 0.5:#eef2ff 1:#6366f1',
              fillOpacity: 0.3,
            },
          }}
          axis={{
            x: {
              title: false,
              line: {
                style: {
                  stroke: '#e2e8f0',
                },
              },
              tickLine: {
                style: {
                  stroke: '#e2e8f0',
                },
              },
            },
            y: {
              title: 'Revenue',
              labelFormatter: (value: number) =>
                new Intl.NumberFormat('vi-VN', {
                  notation: 'compact',
                  maximumFractionDigits: 1,
                }).format(value),
              line: {
                style: {
                  stroke: '#e2e8f0',
                },
              },
              grid: {
                line: {
                  style: {
                    stroke: '#f1f5f9',
                    lineDash: [4, 4],
                  },
                },
              },
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
          animation={{
            appear: {
              animation: 'path-in',
              duration: 1000,
            },
          }}
        />
      ) : (
        <div className={styles.empty}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={`No confirmed revenue in the last ${rangeDays} day${rangeDays === 1 ? '' : 's'}`}
          />
        </div>
      )}
    </Card>
  );
}
