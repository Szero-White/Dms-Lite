import { apiClient, unwrapResponse } from '../../../services/apiClient';
import type { SalesReport } from '../types/salesReport.types';

export interface SalesReportRange {
  from?: string;
  to?: string;
}

export async function fetchSalesReport(range: SalesReportRange = {}) {
  return unwrapResponse<SalesReport>(
    apiClient.get('/reports/sales', {
      params: {
        ...(range.from ? { from: range.from } : {}),
        ...(range.to ? { to: range.to } : {}),
      },
    }),
  );
}
