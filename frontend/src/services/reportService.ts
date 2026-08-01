import { apiClient, unwrapResponse } from './apiClient';
import type { DashboardSnapshot, DashboardSummary } from '../features/dashboard';

interface DashboardResponse {
  revenueToday: string | number;
  revenueThisMonth: string | number;
  totalReceivable: string | number;
  payableDebt: string | number;
  lowStockItems: number;
  productCount: number;
  topCustomersByDebt: DashboardSnapshot['topCustomersByDebt'];
  topSellingProducts: DashboardSnapshot['topSellingProducts'];
}

export async function fetchDashboardSnapshot() {
  const response = await unwrapResponse<DashboardResponse>(apiClient.get('/reports/dashboard'));

  return {
    summary: normalizeDashboardSummary(response),
    topCustomersByDebt: response.topCustomersByDebt ?? [],
    topSellingProducts: response.topSellingProducts ?? [],
  } satisfies DashboardSnapshot;
}

export async function fetchDashboardSummary() {
  const snapshot = await fetchDashboardSnapshot();

  return snapshot.summary;
}

export function normalizeDashboardSummary(summary: Partial<DashboardSummary>): DashboardSummary {
  return {
    revenueToday: summary.revenueToday ?? 0,
    revenueThisMonth: summary.revenueThisMonth ?? 0,
    totalReceivable: summary.totalReceivable ?? 0,
    payableDebt: summary.payableDebt ?? 0,
    lowStockItems: summary.lowStockItems ?? 0,
    productCount: summary.productCount ?? 0,
  };
}
