import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { enrichAuditLogs } from '../../../services/mockData';
import { fetchAuditLogs } from '../api/auditService';

export function useAuditLogs() {
  return useQuery({
    queryKey: queryKeys.auditLogs,
    queryFn: async () => {
      const page = await fetchAuditLogs();
      return enrichAuditLogs(page.content);
    },
  });
}
