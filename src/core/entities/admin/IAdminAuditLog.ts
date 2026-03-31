// src/core/entities/admin/IAdminAuditLog.ts - Contratos de escritura y lectura paginada de auditoría administrativa.
export interface IAdminAuditLogEntryInput {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
}

export interface IAdminAuditLogEntry {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  createdAtIso: string;
}

export interface IAdminAuditLogFilters {
  section?: "ALL" | "CATALOG" | "MARKET" | "STARTER" | "STORY";
  datePreset?: "ALL" | "TODAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "CUSTOM";
  action?: string;
  entityType?: string;
  actorUserId?: string;
  fromIso?: string;
  toIso?: string;
}

export interface IAdminAuditLogPageQuery extends IAdminAuditLogFilters {
  page: number;
  pageSize: number;
}

export interface IAdminAuditLogPage {
  items: IAdminAuditLogEntry[];
  page: number;
  pageSize: number;
  total: number;
}
