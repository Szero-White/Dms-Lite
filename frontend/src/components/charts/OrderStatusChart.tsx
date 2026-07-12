import { Pie } from '@ant-design/charts';
import { Card, Empty } from 'antd';
import type { SalesOrder } from '../../types';

interface OrderStatusChartProps {
  orders: SalesOrder[];
}

export function OrderStatusChart({
  orders,
}: OrderStatusChartProps) {
  const statusMap = orders.reduce<Record<string, number>>(
    (result, order) => {
      result[order.status] = (result[order.status] ?? 0) + 1;
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
      title="Sales Order Status"
      className="panel-card report-chart-card"
    >
      {chartData.length ? (
        <Pie
          data={chartData}
          angleField="count"
          colorField="status"
          height={320}
          innerRadius={0.62}
          radius={0.9}
          legend={{
            color: {
              position: 'bottom',
              layout: {
                justifyContent: 'center',
              },
            },
          }}
          label={{
            text: (datum: {
              status: string;
              count: number;
            }) => `${datum.status}: ${datum.count}`,
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
          annotations={[
            {
              type: 'text',
              style: {
                text: `${orders.length}`,
                x: '50%',
                y: '46%',
                textAlign: 'center',
                fontSize: 28,
                fontWeight: 700,
              },
            },
            {
              type: 'text',
              style: {
                text: 'Orders',
                x: '50%',
                y: '57%',
                textAlign: 'center',
                fontSize: 13,
                fill: '#8c8c8c',
              },
            },
          ]}
        />
      ) : (
        <div className="chart-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No sales orders"
          />
        </div>
      )}
    </Card>
  );
}