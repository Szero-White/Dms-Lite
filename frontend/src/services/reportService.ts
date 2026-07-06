import { apiClient, unwrapResponse } from './apiClient';
import { DashboardSummary } from '../types';

export async function fetchDashboardSummary() {
  return unwrapResponse<{
    revenueToday: string | number;
    revenueThisMonth: string | number;
    totalReceivable: string | number;
    productCount: number;
  }>(apiClient.get('/reports/dashboard'));
}

export function normalizeDashboardSummary(summary: {
  revenueToday: string | number;
  revenueThisMonth: string | number;
  totalReceivable: string | number;
  productCount: number;
}): Partial<DashboardSummary> {
  return {
    revenueToday: summary.revenueToday,
    revenueThisMonth: summary.revenueThisMonth,
    totalReceivable: summary.totalReceivable,
    productCount: summary.productCount,
  };
}
