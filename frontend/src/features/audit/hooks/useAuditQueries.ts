import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { fetchAuditLogs } from '../api/auditService';

export function useAuditLogs() {
  return useQuery({
    queryKey: queryKeys.auditLogs,
    queryFn: async () => {
      const page = await fetchAuditLogs();
      return page.content.map((log) => ({
        ...log,
        actorName: log.actorName || (log.actorId ? `User #${log.actorId}` : 'System'),
      }));
    },
  });
}
