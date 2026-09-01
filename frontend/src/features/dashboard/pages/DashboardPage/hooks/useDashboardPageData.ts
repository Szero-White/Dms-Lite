import { useMemo } from 'react';
import type { Customer } from '../../../../customers';
import type { ProductRow } from '../../../../products';
import type { SalesOrder } from '../../../../sales';
import type { DashboardRange } from '../dashboardPage.types';
import { getRangeStart } from '../dashboardPage.utils';

interface UseDashboardPageDataParams {
  customers: Customer[];
  orders: SalesOrder[];
  products: ProductRow[];
  range: DashboardRange;
}

export function useDashboardPageData({
  customers,
  orders,
  products,
  range,
}: UseDashboardPageDataParams) {
  const filteredOrders = useMemo(() => {
    const rangeStart = getRangeStart(range).getTime();

    return orders.filter((order) => new Date(order.createdAt).getTime() >= rangeStart);
  }, [orders, range]);

  const customersMap = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.name])),
    [customers],
  );

  const attentionOrders = useMemo(
    () => filteredOrders.filter((order) => order.status === 'DRAFT'),
    [filteredOrders],
  );

  const completedOrders = useMemo(
    () =>
      filteredOrders.filter((order) =>
        order.status === 'COMPLETED',
      ),
    [filteredOrders],
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
    completedOrders,
    customersMap,
    filteredOrders,
    healthyProducts,
    latestOrder,
    lowStockProducts,
    outOfStockProducts,
    rangeDays,
    recentOrders,
  };
}
