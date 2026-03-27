// src/core/repositories/admin/IAdminAuditLogReadRepository.ts - Contrato de consulta paginada de trazas de auditoría admin.
import { IAdminAuditLogPage, IAdminAuditLogPageQuery } from "@/core/entities/admin/IAdminAuditLog";

export interface IAdminAuditLogReadRepository {
  listPage(query: IAdminAuditLogPageQuery): Promise<IAdminAuditLogPage>;
}

