import { apiClient, unwrapResponse } from '../../../services/apiClient';
import type {
  DashboardSnapshot,
  DashboardSummary,
  ReceivableAttention,
} from '../types/dashboard.types';

interface DashboardResponse {
  revenueToday: string | number;
  revenueThisMonth: string | number;
  totalReceivable: string | number;
  lowStockItems: number;
  productCount: number;
  topCustomersByDebt: DashboardSnapshot['topCustomersByDebt'];
  topSellingProducts: DashboardSnapshot['topSellingProducts'];
}

export const EMPTY_RECEIVABLE_ATTENTION: ReceivableAttention = {
  overdueAmount: 0,
  overdueCount: 0,
  dueTodayAmount: 0,
  dueTodayCount: 0,
  dueSoonAmount: 0,
  dueSoonCount: 0,
  oldestOverdue: null,
};

export async function fetchDashboardSnapshot() {
  const response = await unwrapResponse<DashboardResponse>(apiClient.get('/reports/dashboard'));

  return {
    summary: normalizeDashboardSummary(response),
    topCustomersByDebt: response.topCustomersByDebt ?? [],
    topSellingProducts: response.topSellingProducts ?? [],
  } satisfies DashboardSnapshot;
}

export async function fetchDashboardReceivableAttention() {
  const response = await unwrapResponse<Partial<ReceivableAttention>>(
    apiClient.get('/reports/dashboard/receivable-attention'),
  );

  return {
    overdueAmount: response.overdueAmount ?? 0,
    overdueCount: response.overdueCount ?? 0,
    dueTodayAmount: response.dueTodayAmount ?? 0,
    dueTodayCount: response.dueTodayCount ?? 0,
    dueSoonAmount: response.dueSoonAmount ?? 0,
    dueSoonCount: response.dueSoonCount ?? 0,
    oldestOverdue: response.oldestOverdue ?? null,
  } satisfies ReceivableAttention;
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
    lowStockItems: summary.lowStockItems ?? 0,
    productCount: summary.productCount ?? 0,
  };
}
