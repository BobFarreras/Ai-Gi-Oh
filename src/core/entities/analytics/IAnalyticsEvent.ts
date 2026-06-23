// src/core/entities/analytics/IAnalyticsEvent.ts - Contratos de eventos de telemetría para ingesta y persistencia.

/** Categorías de eventos permitidas en analytics. */
export type AnalyticsEventCategory = "navigation" | "gameplay" | "shop" | "social" | "system";

/** Evento crudo emitido desde el cliente. */
export interface IAnalyticsEventInput {
  eventName: string;
  eventCategory: AnalyticsEventCategory;
  properties: Record<string, unknown>;
  pageUrl: string;
  timestamp: number;
  sessionId: string;
}

/** Batch de eventos enviado por el cliente al endpoint de ingesta. */
export interface IAnalyticsBatchInput {
  events: IAnalyticsEventInput[];
  deviceInfo: IAnalyticsDeviceInfo;
}

/** Información de dispositivo capturada una vez por sesión. */
export interface IAnalyticsDeviceInfo {
  type: string;
  browser: string;
  os: string;
  isPwa: boolean;
  screenResolution: string;
  viewportResolution: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

/** Evento listo para persistir en base de datos (con user_id derivado server-side). */
export interface IAnalyticsEventRow {
  userId: string | null;
  sessionId: string;
  eventName: string;
  eventCategory: AnalyticsEventCategory;
  properties: Record<string, unknown>;
  pageUrl: string;
  deviceInfo: IAnalyticsDeviceInfo;
}
