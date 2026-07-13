import { apiClient, unwrapResponse } from '../../../services/apiClient';
import { PageResponse } from '../../../types';
import { AuditLog } from '../types/audit.types';

export async function fetchAuditLogs() {
  return unwrapResponse<PageResponse<AuditLog>>(apiClient.get('/audit-logs'));
}
