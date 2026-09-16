import { Line } from '@ant-design/charts';
import {
  Card,
  Empty,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { getIntlLocale, toNumber } from '../../../../lib/format';
import { uiPalette } from '../../../../styles/palette';
import type { SalesReportOrder } from '../../../reports/types/salesReport.types';
import styles from './DashboardRevenueChart.module.css';

interface DashboardRevenueChartProps {
  orders: SalesReportOrder[];
  rangeDays?: number;
}

interface RevenueChartItem {
  dateKey: string;
  dateLabel: string;
  revenue: number;
}

function localDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function DashboardRevenueChart({
  orders,
  rangeDays = 7,
}: DashboardRevenueChartProps) {
  const { i18n, t } = useTranslation();
  const locale = getIntlLocale(i18n.language);
  const today = new Date();

  const chartData: RevenueChartItem[] = Array.from(
    { length: rangeDays },
    (_, index) => {
      const date = new Date(today);

      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - (rangeDays - 1 - index));

      return {
        dateKey: localDateKey(date),
        dateLabel: date.toLocaleDateString(locale, {
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
      order.status === 'COMPLETED',
    )
    .forEach((order) => {
      if (!order.reportDate) {
        return;
      }

      const recognitionDate = new Date(order.reportDate);

      const dateKey = localDateKey(recognitionDate);

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
      title={t('charts.revenueTrend.title')}
      className={`panel-card ${styles.card}`}
    >
      {hasRevenue ? (
        <Line
          data={chartData}
          xField="dateLabel"
          yField="revenue"
          height={280}
          smooth
          color={uiPalette.chart.primary}
          point={{
            size: 6,
            shape: 'circle',
            style: {
              fill: uiPalette.chart.primary,
              stroke: uiPalette.surface.card,
              lineWidth: 2,
            },
          }}
          line={{
            style: {
              stroke: uiPalette.chart.primary,
              lineWidth: 3,
              shadowColor: 'rgba(139, 124, 246, 0.22)',
              shadowBlur: 10,
            },
          }}
          axis={{
            x: {
              title: false,
              line: {
                style: {
                  stroke: uiPalette.chart.grid,
                },
              },
              tickLine: {
                style: {
                  stroke: uiPalette.chart.grid,
                },
              },
            },
            y: {
              title: t('reports.metric.revenue'),
              labelFormatter: (value: number) =>
                new Intl.NumberFormat(locale, {
                  notation: 'compact',
                  maximumFractionDigits: 1,
                }).format(value),
              line: {
                style: {
                  stroke: uiPalette.chart.grid,
                },
              },
              grid: {
                line: {
                  style: {
                    stroke: uiPalette.chart.grid,
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
            description={t('dashboard.chart.noConfirmedRevenue', { count: rangeDays })}
          />
        </div>
      )}
    </Card>
  );
}
