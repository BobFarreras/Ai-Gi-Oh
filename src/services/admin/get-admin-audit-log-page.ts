// src/services/admin/get-admin-audit-log-page.ts - Servicio server-side para obtener auditoría admin paginada con filtros y contexto visual.
import { IAdminAuditLogEntry, IAdminAuditLogPage } from "@/core/entities/admin/IAdminAuditLog";
import { GetAdminAuditLogPageUseCase } from "@/core/use-cases/admin/GetAdminAuditLogPageUseCase";
import { SupabaseAdminAuditLogRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminAuditLogRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { assertAdminAccess } from "@/services/admin/assert-admin-access";
import { readAdminAuditPageQuery } from "@/services/admin/internal/read-admin-audit-query";

interface IServerSearchParams {
  [key: string]: string | string[] | undefined;
}

interface IAdminAuditCardVisual {
  cardId: string;
  cardName: string;
  renderUrl: string | null;
}

interface ICardVisualRow {
  id: string;
  name: string;
  render_url: string | null;
}

export interface IAdminAuditLogRuntimePage {
  page: IAdminAuditLogPage;
  cardVisualById: Record<string, IAdminAuditCardVisual>;
}

function toUrlSearchParams(value: IServerSearchParams): URLSearchParams {
  const output = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(value)) {
    if (typeof rawValue === "string") output.set(key, rawValue);
  }
  return output;
}

function readCardIdFromEntry(entry: IAdminAuditLogEntry): string | null {
  if (entry.entityType === "cards_catalog") return entry.entityId;
  const payloadCardId = entry.payload.cardId;
  if (typeof payloadCardId === "string" && payloadCardId.trim().length > 0) return payloadCardId;
  return null;
}

async function loadCardVisualById(entries: IAdminAuditLogEntry[]): Promise<Record<string, IAdminAuditCardVisual>> {
  const cardIds = Array.from(new Set(entries.map(readCardIdFromEntry).filter((value): value is string => value !== null)));
  if (cardIds.length === 0) return {};
  const client = createSupabaseServiceRoleClient();
  const { data, error } = await client.from("cards_catalog").select("id,name,render_url").in("id", cardIds);
  if (error) return {};
  return ((data ?? []) as ICardVisualRow[]).reduce<Record<string, IAdminAuditCardVisual>>((accumulator, row) => {
    accumulator[row.id] = { cardId: row.id, cardName: row.name, renderUrl: row.render_url };
    return accumulator;
  }, {});
}

/**
 * Requiere sesión admin y devuelve la página solicitada de auditoría.
 */
export async function getAdminAuditLogPage(searchParams: IServerSearchParams): Promise<IAdminAuditLogRuntimePage> {
  await assertAdminAccess();
  const query = readAdminAuditPageQuery(toUrlSearchParams(searchParams));
  const repository = new SupabaseAdminAuditLogRepository(createSupabaseServiceRoleClient());
  const useCase = new GetAdminAuditLogPageUseCase(repository);
  const page = await useCase.execute(query);
  const cardVisualById = await loadCardVisualById(page.items);
  return { page, cardVisualById };
}
