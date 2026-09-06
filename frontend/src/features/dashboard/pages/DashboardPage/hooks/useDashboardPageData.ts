import { useMemo } from 'react';
import type { Customer } from '../../../../customers';
import type { ProductRow } from '../../../../products';
import type { SalesReportOrder } from '../../../../reports/types/salesReport.types';
import type { SalesOrder } from '../../../../sales';
import type { DashboardRange } from '../dashboardPage.types';

interface UseDashboardPageDataParams {
  analyticsOrders: SalesReportOrder[];
  customers: Customer[];
  orders: SalesOrder[];
  products: ProductRow[];
  range: DashboardRange;
}

export function useDashboardPageData({
  analyticsOrders,
  customers,
  orders,
  products,
  range,
}: UseDashboardPageDataParams) {
  const customersMap = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.name])),
    [customers],
  );

  const attentionOrders = useMemo(
    () => orders.filter((order) => order.status === 'DRAFT'),
    [orders],
  );

  const healthyProducts = useMemo(
    () => products.filter((product) => product.active && !product.isLowStock && product.stock > 0),
    [products],
  );

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.isLowStock),
    [products],
  );

  const outOfStockProducts = useMemo(
    () => products.filter((product) => product.stock <= 0),
    [products],
  );

  const activeCustomers = useMemo(
    () => customers.filter((customer) => customer.active).length,
    [customers],
  );

  const latestOrder = useMemo(
    () =>
      [...orders].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )[0],
    [orders],
  );

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        )
        .slice(0, 4),
    [orders],
  );

  const rangeDays =
    range === 'TODAY'
      ? 1
      : range === '30_DAYS'
        ? 30
        : range === 'THIS_MONTH'
          ? new Date().getDate()
          : 7;


  return {
    activeCustomers,
    attentionOrders,
    customersMap,
    analyticsOrders,
    healthyProducts,
    latestOrder,
    lowStockProducts,
    outOfStockProducts,
    rangeDays,
    recentOrders,
  };
}
