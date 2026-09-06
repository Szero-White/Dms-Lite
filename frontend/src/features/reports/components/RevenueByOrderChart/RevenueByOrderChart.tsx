import { Column } from '@ant-design/charts';
import {
  Card,
  Empty,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { getIntlLocale, toNumber } from '../../../../lib/format';
import type { SalesReportOrder } from '../../types/salesReport.types';
import styles from './RevenueByOrderChart.module.css';

interface RevenueByOrderChartProps {
  orders: SalesReportOrder[];
}

export function RevenueByOrderChart({
  orders,
}: RevenueByOrderChartProps) {
  const { i18n, t } = useTranslation();
  const locale = getIntlLocale(i18n.language);
  const chartData = orders
    .filter((order) => order.status === 'COMPLETED')
    .map((order) => ({
      orderCode: order.code,
      revenue: toNumber(order.totalAmount),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  return (
    <Card
      title={t('charts.revenueByOrder.title')}
      className={`panel-card ${styles.card}`}
    >
      {chartData.length ? (
        <Column
          data={chartData}
          xField="orderCode"
          yField="revenue"
          height={280}
          padding="auto"
          axis={{
            x: {
              title: false,
              labelAutoRotate: false,
            },
            y: {
              title: t('reports.metric.revenue'),
              labelFormatter: (value: number) =>
                new Intl.NumberFormat(locale, {
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
                name: t('reports.metric.revenue'),
                valueFormatter: (value: number) =>
                  new Intl.NumberFormat(locale, {
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
        <div className={styles.empty}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('charts.empty.noSalesData')}
          />
        </div>
      )}
    </Card>
  );
}
