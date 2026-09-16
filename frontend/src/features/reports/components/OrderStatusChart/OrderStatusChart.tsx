import { Pie } from '@ant-design/charts';
import {
  Card,
  Empty,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { uiPalette } from '../../../../styles/palette';
import type { SalesReportOrder } from '../../types/salesReport.types';
import styles from './OrderStatusChart.module.css';

interface OrderStatusChartProps {
  orders: SalesReportOrder[];
}

export function OrderStatusChart({
  orders,
}: OrderStatusChartProps) {
  const { t } = useTranslation();
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
      label: t(`status.sales.${status}`, { defaultValue: t('status.sales.UNKNOWN') }),
      count,
    }),
  );

  return (
    <Card
      title={t('charts.salesOrderStatus.title')}
      className={`panel-card analysis-surface ${styles.card}`}
    >
      {chartData.length ? (
        <Pie
          data={chartData}
          angleField="count"
          colorField="label"
          height={280}
          innerRadius={0.62}
          radius={0.9}
          color={[uiPalette.semantic.warning, uiPalette.semantic.success, uiPalette.semantic.danger]}
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
              label: string;
              count: number;
            }) => `${datum.label}: ${datum.count}`,
            position: 'outside',
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
          annotations={[
            {
              type: 'text',
              style: {
                text: `${orders.length}`,
                x: '50%',
                y: '46%',
                textAlign: 'center',
                fontSize: 24,
                fontWeight: 600,
                fill: uiPalette.text.primary,
              },
            },
            {
              type: 'text',
              style: {
                text: t('reports.metric.orders'),
                x: '50%',
                y: '57%',
                textAlign: 'center',
                fontSize: 13,
                fill: uiPalette.text.muted,
              },
            },
          ]}
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
