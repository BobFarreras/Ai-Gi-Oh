// src/infrastructure/persistence/supabase/admin/SupabaseAdminAuditLogRepository.ts - Implementa inserción de auditoría admin en Supabase.
import { SupabaseClient } from "@supabase/supabase-js";
import { IAdminAuditLogEntryInput, IAdminAuditLogPage, IAdminAuditLogPageQuery } from "@/core/entities/admin/IAdminAuditLog";
import { ValidationError } from "@/core/errors/ValidationError";
import { IAdminAuditLogReadRepository } from "@/core/repositories/admin/IAdminAuditLogReadRepository";
import { IAdminAuditLogRepository } from "@/core/repositories/admin/IAdminAuditLogRepository";

interface IAdminAuditLogRow {
  id: string;
  actor_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export class SupabaseAdminAuditLogRepository implements IAdminAuditLogRepository, IAdminAuditLogReadRepository {
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

  async listPage(query: IAdminAuditLogPageQuery): Promise<IAdminAuditLogPage> {
    const from = (query.page - 1) * query.pageSize;
    const to = from + query.pageSize - 1;
    let builder = this.client
      .from("admin_audit_log")
      .select("id,actor_user_id,action,entity_type,entity_id,payload,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (query.section === "CATALOG") builder = builder.ilike("action", "ADMIN_CATALOG_%");
    if (query.section === "MARKET") builder = builder.ilike("action", "ADMIN_MARKET_%");
    if (query.section === "STARTER") builder = builder.ilike("action", "ADMIN_STARTER_%");
    if (query.section === "STORY") builder = builder.ilike("action", "ADMIN_STORY_%");
    if (query.action) builder = builder.eq("action", query.action);
    if (query.entityType) builder = builder.eq("entity_type", query.entityType);
    if (query.actorUserId) builder = builder.eq("actor_user_id", query.actorUserId);
    if (query.fromIso) builder = builder.gte("created_at", query.fromIso);
    if (query.toIso) builder = builder.lte("created_at", query.toIso);
    const { data, count, error } = await builder;
    if (error) throw new ValidationError("No se pudo leer la auditoría administrativa.");
    return {
      items: ((data ?? []) as IAdminAuditLogRow[]).map((row) => ({
        id: row.id,
        actorUserId: row.actor_user_id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        payload: row.payload ?? {},
        createdAtIso: row.created_at,
      })),
      page: query.page,
      pageSize: query.pageSize,
      total: count ?? 0,
    };
  }
}
