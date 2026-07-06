export const queryKeys = {
  auth: ['auth'] as const,
  products: ['products'] as const,
  customers: ['customers'] as const,
  customerDebt: (customerId: number | string) => ['customers', customerId, 'debt'] as const,
  salesOrders: ['sales-orders'] as const,
  inventoryStock: ['inventory', 'stock'] as const,
  inventoryHistory: ['inventory', 'history'] as const,
  dashboard: ['reports', 'dashboard'] as const,
  auditLogs: ['audit-logs'] as const,
  notifications: ['notifications'] as const,
};
