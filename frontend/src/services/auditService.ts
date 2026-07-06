import { apiClient, unwrapResponse } from './apiClient';
import { AuditLog, PageResponse } from '../types';

export async function fetchAuditLogs() {
  return unwrapResponse<PageResponse<AuditLog>>(apiClient.get('/audit-logs'));
}
