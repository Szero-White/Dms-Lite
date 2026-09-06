import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { fetchSalesReport, type SalesReportRange } from '../api/salesReportService';

interface UseSalesReportOptions extends SalesReportRange {
  enabled?: boolean;
}

export function useSalesReport(options: UseSalesReportOptions = {}) {
  return useQuery({
    queryKey: queryKeys.salesReport(options.from ?? null, options.to ?? null),
    queryFn: () => fetchSalesReport({ from: options.from, to: options.to }),
    enabled: options.enabled ?? true,
  });
}
