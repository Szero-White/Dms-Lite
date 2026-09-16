import { useMemo } from 'react';
import type { ProductRow } from '../../../../products';
import type { SalesReportOrder } from '../../../../reports/types/salesReport.types';
import type { SalesOrder } from '../../../../sales';
import type { DashboardRange } from '../dashboardPage.types';
import { newestFirst } from '../../../../../lib/tableSorting';

interface UseDashboardPageDataParams {
  analyticsOrders: SalesReportOrder[];
  orders: SalesOrder[];
  products: ProductRow[];
  range: DashboardRange;
}

export function useDashboardPageData({
  analyticsOrders,
  orders,
  products,
  range,
}: UseDashboardPageDataParams) {
  const attentionOrders = useMemo(
    () => orders.filter((order) => order.status === 'DRAFT'),
    [orders],
  );

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.isLowStock),
    [products],
  );

  const outOfStockProducts = useMemo(
    () => products.filter((product) => product.stock <= 0),
    [products],
  );

  const latestOrder = useMemo(() => newestFirst(orders)[0], [orders]);

  const rangeDays =
    range === 'TODAY'
      ? 1
      : range === '30_DAYS'
        ? 30
        : range === 'THIS_MONTH'
          ? new Date().getDate()
          : 7;


  return {
    attentionOrders,
    analyticsOrders,
    latestOrder,
    lowStockProducts,
    outOfStockProducts,
    rangeDays,
  };
}
