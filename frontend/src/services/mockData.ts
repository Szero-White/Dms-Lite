import {
  AuditLog,
  Customer,
  DashboardSnapshot,
  DashboardSummary,
  DebtLeader,
  DebtTransaction,
  InventoryTransaction,
  NotificationItem,
  ProductRow,
  SalesOrder,
  TopSellingProduct,
} from '../types';
import { toNumber } from '../lib/format';

// Mock data only covers frontend demo gaps where backend APIs are not available yet.
// Keep shapes close to production API responses so they can be replaced with real endpoints later.

export function buildDashboardSnapshot(
  summary: Partial<DashboardSummary>,
  customers: Customer[],
  products: ProductRow[],
  orders: SalesOrder[],
): DashboardSnapshot {
  const topCustomersByDebt: DebtLeader[] = [...customers]
    .map((customer) => ({
      customerId: customer.id,
      customerName: customer.name,
      debtBalance: toNumber(customer.debtBalance),
    }))
    .sort((a, b) => b.debtBalance - a.debtBalance)
    .slice(0, 5);

  const sellingMap = new Map<number, TopSellingProduct>();
  orders
    .filter((order) => ['COMPLETED', 'CONFIRMED'].includes(order.status))
    .forEach((order) => {
      (order.items ?? []).forEach((item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        if (!product) {
          return;
        }

        const current = sellingMap.get(item.productId) ?? {
          productId: item.productId,
          productName: product.name,
          totalQuantity: 0,
          revenue: 0,
        };

        current.totalQuantity += item.quantity;
        current.revenue += toNumber(item.lineTotal);
        sellingMap.set(item.productId, current);
      });
    });

  return {
    summary: {
      revenueToday: summary.revenueToday ?? 0,
      revenueThisMonth: summary.revenueThisMonth ?? 0,
      totalReceivable: summary.totalReceivable ?? 0,
      payableDebt: summary.payableDebt ?? 8500000,
      lowStockItems: summary.lowStockItems ?? products.filter((product) => product.isLowStock).length,
      productCount: summary.productCount ?? products.length,
    },
    topCustomersByDebt,
    topSellingProducts: [...sellingMap.values()].sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 5),
  };
}

export function buildDerivedNotifications(
  customers: Customer[],
  products: ProductRow[],
  debtTransactions: DebtTransaction[],
  inventoryHistory: InventoryTransaction[],
): NotificationItem[] {
  const lowStock = products
    .filter((product) => product.isLowStock)
    .slice(0, 4)
    .map((product) => ({
      id: `low-stock-${product.id}`,
      type: 'LOW_STOCK',
      title: 'Low stock alert',
      message: `${product.name} is at ${product.stock} units, below minimum ${product.minStock}.`,
      createdAt: new Date().toISOString(),
      source: 'derived' as const,
    }));

  const overdueDebt = debtTransactions
    .filter((item) => item.direction === 'INCREASE' && toNumber(item.remainingAmount) > 0 && item.dueDate)
    .filter((item) => new Date(item.dueDate!).getTime() < Date.now())
    .slice(0, 4)
    .map((item) => {
      const customer = customers.find((candidate) => candidate.id === item.customerId);
      return {
        id: `overdue-${item.id}`,
        type: 'OVERDUE_DEBT',
        title: 'Overdue debt',
        message: `${customer?.name ?? 'Customer'} has overdue receivable of ${toNumber(item.remainingAmount).toLocaleString('en-US')} VND.`,
        createdAt: item.createdAt,
        source: 'derived' as const,
      };
    });

  const paymentRecorded = debtTransactions
    .filter((item) => item.sourceType === 'PAYMENT')
    .slice(0, 4)
    .map((item) => {
      const customer = customers.find((candidate) => candidate.id === item.customerId);
      return {
        id: `payment-${item.id}`,
        type: 'PAYMENT_RECORDED',
        title: 'Payment recorded',
        message: `${customer?.name ?? 'Customer'} paid ${toNumber(item.amount).toLocaleString('en-US')} VND.`,
        createdAt: item.createdAt,
        source: 'derived' as const,
      };
    });

  const stockMoves = inventoryHistory
    .filter((item) => item.sourceType === 'SALES_ORDER')
    .slice(0, 3)
    .map((item) => ({
      id: `sales-order-${item.id}`,
      type: 'SALES_ORDER_CONFIRMED',
      title: 'Sales order confirmed',
      message: `Inventory updated for product #${item.productId} after sales order confirmation.`,
      createdAt: item.createdAt,
      source: 'derived' as const,
    }));

  return [...lowStock, ...overdueDebt, ...paymentRecorded, ...stockMoves]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);
}

export function enrichAuditLogs(logs: AuditLog[]) {
  return logs.map((log) => ({
    ...log,
    actorName: log.actorId ? `User #${log.actorId}` : 'System',
  }));
}
