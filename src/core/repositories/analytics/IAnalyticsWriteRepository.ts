// src/core/repositories/analytics/IAnalyticsWriteRepository.ts - Contrato de escritura para persistir batches de eventos y sesiones de telemetría.
import { IAnalyticsEventRow } from "@/core/entities/analytics/IAnalyticsEvent";

export interface IAnalyticsSessionUpsert {
  sessionId: string;
  userId: string | null;
  startedAt: string;
  deviceType: string;
  browser: string;
  os: string;
  isPwa: boolean;
}

export interface IAnalyticsWriteRepository {
  /** Inserta un batch de eventos de analytics. No lanza: si falla, el juego no se entera. */
  insertBatch(events: IAnalyticsEventRow[]): Promise<void>;

  /** Upsert de sesión de analytics: crea o actualiza sin duplicar. */
  upsertSession(session: IAnalyticsSessionUpsert): Promise<void>;

  /** Actualiza ended_at y events_count de una sesión existente. */
  updateSessionMeta(sessionId: string, eventsCount: number, pageViews: number): Promise<void>;
}
