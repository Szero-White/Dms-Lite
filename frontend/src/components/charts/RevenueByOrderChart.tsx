import { Column } from '@ant-design/charts';
import { Card, Empty } from 'antd';
import type { SalesOrder } from '../../types';
import { toNumber } from '../../lib/format';

interface RevenueByOrderChartProps {
  orders: SalesOrder[];
}

export function RevenueByOrderChart({
  orders,
}: RevenueByOrderChartProps) {
  const chartData = orders
    .filter((order) => order.status !== 'CANCELLED')
    .map((order) => ({
      orderCode: order.code,
      revenue: toNumber(order.totalAmount),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  return (
    <Card
      title="Revenue by Sales Order"
      className="panel-card report-chart-card"
    >
      {chartData.length ? (
        <Column
          data={chartData}
          xField="orderCode"
          yField="revenue"
          height={320}
          padding="auto"
          axis={{
            x: {
              title: false,
              labelAutoRotate: false,
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
            title: 'orderCode',
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
          style={{
            radiusTopLeft: 8,
            radiusTopRight: 8,
          }}
        />
      ) : (
        <div className="chart-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No sales data"
          />
        </div>
      )}
    </Card>
  );
}