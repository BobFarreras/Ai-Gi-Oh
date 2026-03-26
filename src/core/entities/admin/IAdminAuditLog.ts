// src/core/entities/admin/IAdminAuditLog.ts - Contrato de entrada de auditoría para operaciones administrativas sensibles.
export interface IAdminAuditLogEntryInput {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
}

