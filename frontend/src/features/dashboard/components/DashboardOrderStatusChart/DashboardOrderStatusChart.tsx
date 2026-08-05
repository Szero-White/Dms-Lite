import { Pie } from '@ant-design/charts';
import {
  Card,
  Empty,
} from 'antd';
import { useTranslation } from 'react-i18next';
import type { SalesOrder } from '../../../sales';
import styles from './DashboardOrderStatusChart.module.css';

interface DashboardOrderStatusChartProps {
  orders: SalesOrder[];
}

export function DashboardOrderStatusChart({
  orders,
}: DashboardOrderStatusChartProps) {
  const { t } = useTranslation();
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
      title={t('charts.orderStatus.title')}
      className={`panel-card ${styles.card}`}
    >
      {chartData.length ? (
        <Pie
          data={chartData}
          angleField="count"
          colorField="label"
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
              content: t('dashboard.chart.totalOrders'),
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
            title: 'label',
            items: [
              {
                field: 'count',
                name: t('reports.metric.orders'),
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
            description={t('charts.empty.noSalesOrders')}
          />
        </div>
      )}
    </Card>
  );
}
