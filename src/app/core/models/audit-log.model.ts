// AuditLogResponse
export interface AuditLog {
  id: string;
  username?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  timestamp?: string;
  details?: string;
}
