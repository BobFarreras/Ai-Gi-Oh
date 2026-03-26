// src/core/use-cases/admin/WriteAdminAuditLogUseCase.ts - Normaliza y persiste eventos de auditoría para cambios administrativos.
import { IAdminAuditLogEntryInput } from "@/core/entities/admin/IAdminAuditLog";
import { ValidationError } from "@/core/errors/ValidationError";
import { IAdminAuditLogRepository } from "@/core/repositories/admin/IAdminAuditLogRepository";

function assertNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) throw new ValidationError(`El campo ${field} es obligatorio para auditoría admin.`);
}

export class WriteAdminAuditLogUseCase {
  constructor(private readonly repository: IAdminAuditLogRepository) {}

  /**
   * Registra un evento de auditoría validando identificadores mínimos.
   */
  async execute(entry: IAdminAuditLogEntryInput): Promise<void> {
    assertNonEmpty(entry.actorUserId, "actorUserId");
    assertNonEmpty(entry.action, "action");
    assertNonEmpty(entry.entityType, "entityType");
    assertNonEmpty(entry.entityId, "entityId");
    await this.repository.write(entry);
  }
}

