// src/infrastructure/persistence/supabase/SupabaseAnalyticsRepository.ts - Repositorio de escritura de analytics en Supabase via service_role.
import { SupabaseClient } from "@supabase/supabase-js";
import { IAnalyticsEventRow } from "@/core/entities/analytics/IAnalyticsEvent";
import { IAnalyticsSessionUpsert, IAnalyticsWriteRepository } from "@/core/repositories/analytics/IAnalyticsWriteRepository";

interface IAnalyticsEventDbRow {
  user_id: string | null;
  session_id: string;
  event_name: string;
  event_category: string;
  properties: Record<string, unknown>;
  page_url: string;
  device_info: Record<string, unknown>;
}

/** Mapea una entidad de dominio a una fila de base de datos (snake_case). */
function toDbRow(row: IAnalyticsEventRow): IAnalyticsEventDbRow {
  return {
    user_id: row.userId,
    session_id: row.sessionId,
    event_name: row.eventName,
    event_category: row.eventCategory,
    properties: row.properties,
    page_url: row.pageUrl,
    device_info: row.deviceInfo as unknown as Record<string, unknown>,
  };
}

export class SupabaseAnalyticsRepository implements IAnalyticsWriteRepository {
  constructor(private readonly client: SupabaseClient) {}

  /** Inserta un batch de eventos. Usa service_role que bypassa RLS. */
  async insertBatch(events: IAnalyticsEventRow[]): Promise<void> {
    if (events.length === 0) return;
    const rows = events.map(toDbRow);
    const { error } = await this.client.from("analytics_events").insert(rows);
    if (error) {
      // Analytics nunca debe romper el juego: logueamos pero no lanzamos.
      console.error("[analytics] Error insertando batch:", error.message);
    }
  }

  /** Upsert de sesión: crea si no existe, no sobreescribe started_at. */
  async upsertSession(session: IAnalyticsSessionUpsert): Promise<void> {
    const { error } = await this.client.from("analytics_sessions").upsert(
      {
        id: session.sessionId,
        user_id: session.userId,
        started_at: session.startedAt,
        ended_at: session.startedAt,
        device_type: session.deviceType,
        browser: session.browser,
        os: session.os,
        is_pwa: session.isPwa,
      },
      { onConflict: "id", ignoreDuplicates: false },
    );
    if (error) {
      console.error("[analytics] Error upserting session:", error.message);
    }
  }

  /** Actualiza ended_at y contadores de una sesión existente. */
  async updateSessionMeta(sessionId: string, eventsCount: number, pageViews: number): Promise<void> {
    const { error } = await this.client
      .from("analytics_sessions")
      .update({
        ended_at: new Date().toISOString(),
        events_count: eventsCount,
        page_views: pageViews,
        duration_seconds: undefined,
      })
      .eq("id", sessionId);
    if (error) {
      console.error("[analytics] Error updating session meta:", error.message);
    }
  }
}
