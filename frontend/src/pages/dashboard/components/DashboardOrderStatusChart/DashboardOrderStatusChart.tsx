import { Pie } from '@ant-design/charts';
import { Card, Empty } from 'antd';
import type { SalesOrder } from '../../../../types';
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
          height={250}
          innerRadius={0.62}
          radius={0.9}
          legend={{
            color: {
              position: 'bottom',
            },
          }}
          label={{
            text: 'count',
            position: 'outside',
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
