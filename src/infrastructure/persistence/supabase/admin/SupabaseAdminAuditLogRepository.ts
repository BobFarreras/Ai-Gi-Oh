// src/infrastructure/persistence/supabase/admin/SupabaseAdminAuditLogRepository.ts - Implementa inserción de auditoría admin en Supabase.
import { SupabaseClient } from "@supabase/supabase-js";
import { IAdminAuditLogEntryInput } from "@/core/entities/admin/IAdminAuditLog";
import { ValidationError } from "@/core/errors/ValidationError";
import { IAdminAuditLogRepository } from "@/core/repositories/admin/IAdminAuditLogRepository";

export class SupabaseAdminAuditLogRepository implements IAdminAuditLogRepository {
  constructor(private readonly client: SupabaseClient) {}

  async write(entry: IAdminAuditLogEntryInput): Promise<void> {
    const auditId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `audit-${Date.now()}`;
    const { error } = await this.client.from("admin_audit_log").insert({
      id: auditId,
      actor_user_id: entry.actorUserId,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      payload: entry.payload,
    });
    if (error) throw new ValidationError("No se pudo registrar el evento de auditoría admin.");
  }
}

