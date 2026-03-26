// src/core/repositories/admin/IAdminAuditLogRepository.ts - Contrato de persistencia para registrar trazas de auditoría admin.
import { IAdminAuditLogEntryInput } from "@/core/entities/admin/IAdminAuditLog";

export interface IAdminAuditLogRepository {
  write(entry: IAdminAuditLogEntryInput): Promise<void>;
}

