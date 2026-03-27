// src/services/admin/internal/read-admin-audit-query.ts - Normaliza filtros de auditoría desde URL para servicios y API.
import { IAdminAuditLogPageQuery } from "@/core/entities/admin/IAdminAuditLog";

function readOptional(value: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function readPositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function readSection(value: string | null): IAdminAuditLogPageQuery["section"] {
  if (!value) return "ALL";
  if (value === "CATALOG" || value === "MARKET" || value === "STARTER" || value === "STORY" || value === "ALL") return value;
  return "ALL";
}

function readDatePreset(value: string | null): IAdminAuditLogPageQuery["datePreset"] {
  if (!value) return "ALL";
  if (value === "TODAY" || value === "LAST_7_DAYS" || value === "LAST_30_DAYS" || value === "CUSTOM" || value === "ALL") return value;
  return "ALL";
}

function toIsoDateString(value: Date): string {
  return value.toISOString();
}

function resolvePresetWindow(preset: IAdminAuditLogPageQuery["datePreset"]): { fromIso?: string; toIso?: string } {
  const now = new Date();
  if (preset === "TODAY") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { fromIso: toIsoDateString(start), toIso: toIsoDateString(now) };
  }
  if (preset === "LAST_7_DAYS") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { fromIso: toIsoDateString(start), toIso: toIsoDateString(now) };
  }
  if (preset === "LAST_30_DAYS") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { fromIso: toIsoDateString(start), toIso: toIsoDateString(now) };
  }
  return {};
}

/**
 * Traduce search params a query de auditoría con defaults seguros.
 */
export function readAdminAuditPageQuery(searchParams: URLSearchParams): IAdminAuditLogPageQuery {
  const datePreset = readDatePreset(searchParams.get("datePreset"));
  const presetWindow = resolvePresetWindow(datePreset);
  return {
    page: readPositiveInt(searchParams.get("page"), 1),
    pageSize: readPositiveInt(searchParams.get("pageSize"), 20),
    section: readSection(searchParams.get("section")),
    datePreset,
    action: readOptional(searchParams.get("action")),
    entityType: readOptional(searchParams.get("entityType")),
    actorUserId: readOptional(searchParams.get("actorUserId")),
    fromIso: datePreset === "CUSTOM" ? readOptional(searchParams.get("from")) : presetWindow.fromIso,
    toIso: datePreset === "CUSTOM" ? readOptional(searchParams.get("to")) : presetWindow.toIso,
  };
}
