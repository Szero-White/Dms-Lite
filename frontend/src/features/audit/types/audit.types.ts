export interface AuditLog {
  id: number;
  actorId?: number;
  actorName?: string;
  action: string;
  entityType: string;
  entityId?: number;
  newValue?: string;
  createdAt: string;
}

export interface AuditLogRow extends AuditLog {
  actorName: string;
}
