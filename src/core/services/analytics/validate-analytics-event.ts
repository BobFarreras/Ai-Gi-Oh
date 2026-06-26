// src/core/services/analytics/validate-analytics-event.ts - Validación de eventos de telemetría: allowlist de nombres, categorías y tamaño de payload.
import { ValidationError } from "@/core/errors/ValidationError";
import { AnalyticsEventCategory, IAnalyticsDeviceInfo, IAnalyticsEventInput } from "@/core/entities/analytics/IAnalyticsEvent";

/** Allowlist de nombres de evento permitidos. Cualquier evento fuera de esta lista se rechaza. */
export const ALLOWED_EVENT_NAMES = new Set<string>([
  // Navigation
  "session_started",
  "session_ended",
  "page_viewed",
  "hub_node_clicked",
  // Gameplay
  "duel_started",
  "duel_ended",
  "card_played",
  "card_summoned",
  "attack_declared",
  "fusion_performed",
  "trap_triggered",
  "turn_completed",
  // Shop
  "pack_purchased",
  "card_purchased",
  "nexus_earned",
  "nexus_spent",
  // Progression
  "story_node_completed",
  "story_chapter_completed",
  "tutorial_step_completed",
  "card_level_up",
  "card_xp_gained",
  // Live-ops / retención
  "daily_login_claimed",
  "mission_claimed",
  "event_item_redeemed",
  // Multiplayer
  "matchmaking_started",
  "matchmaking_completed",
  "multiplayer_match_ended",
  // System
  "error_occurred",
  "performance_degraded",
  "fx_profile_changed",
]);

/** Allowlist de categorías permitidas. */
export const ALLOWED_EVENT_CATEGORIES = new Set<AnalyticsEventCategory>([
  "navigation",
  "gameplay",
  "shop",
  "social",
  "system",
]);

/** Límite de tamaño del JSON de propiedades en bytes (32KB). */
const MAX_PROPERTIES_BYTES = 32_768;

/** Máximo número de eventos por batch. */
export const MAX_BATCH_SIZE = 100;

/** Máxima profundidad del objeto properties. */
const MAX_PROPERTIES_DEPTH = 5;

/** Mide la profundidad de un objeto anidado. */
function measureDepth(value: unknown, current: number = 0): number {
  if (current > MAX_PROPERTIES_DEPTH) return current;
  if (typeof value !== "object" || value === null) return current;
  let maxDepth = current;
  for (const child of Object.values(value as Record<string, unknown>)) {
    maxDepth = Math.max(maxDepth, measureDepth(child, current + 1));
  }
  return maxDepth;
}

/** Valida que un evento individual cumpla el allowlist y límites de tamaño. */
export function validateAnalyticsEvent(event: IAnalyticsEventInput): void {
  if (!ALLOWED_EVENT_NAMES.has(event.eventName)) {
    throw new ValidationError(`Evento de analytics no permitido: ${event.eventName}`);
  }
  if (!ALLOWED_EVENT_CATEGORIES.has(event.eventCategory)) {
    throw new ValidationError(`Categoría de analytics no permitida: ${event.eventCategory}`);
  }
  if (typeof event.sessionId !== "string" || !event.sessionId.trim()) {
    throw new ValidationError("Session ID de analytics es obligatorio.");
  }
  if (typeof event.pageUrl !== "string" || event.pageUrl.length > 500) {
    throw new ValidationError("pageUrl de analytics inválido o demasiado largo.");
  }
  const serialized = JSON.stringify(event.properties);
  if (serialized.length > MAX_PROPERTIES_BYTES) {
    throw new ValidationError("Propiedades de analytics exceden el tamaño máximo permitido.");
  }
  if (measureDepth(event.properties) > MAX_PROPERTIES_DEPTH) {
    throw new ValidationError("Propiedades de analytics exceden la profundidad máxima permitida.");
  }
}

/** Longitud máxima de cualquier campo string de deviceInfo. */
const MAX_DEVICE_INFO_STRING_LENGTH = 120;

/** Recorta un valor string desconocido a un string seguro y acotado, o "unknown" si no es string. */
function safeDeviceString(value: unknown): string {
  if (typeof value !== "string") return "unknown";
  return value.slice(0, MAX_DEVICE_INFO_STRING_LENGTH);
}

/** Devuelve un número finito no negativo, o undefined si el valor no es válido. */
function safeDeviceNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return undefined;
  return value;
}

/**
 * Saneamiento estricto de deviceInfo: solo se conservan los campos del allowlist, con strings
 * acotados y números validados. El cliente NO puede inyectar campos arbitrarios ni payloads gigantes
 * (este objeto se duplica en cada fila de evento).
 */
export function sanitizeDeviceInfo(raw: unknown): IAnalyticsDeviceInfo {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    type: safeDeviceString(source.type),
    browser: safeDeviceString(source.browser),
    os: safeDeviceString(source.os),
    isPwa: source.isPwa === true,
    screenResolution: safeDeviceString(source.screenResolution),
    viewportResolution: safeDeviceString(source.viewportResolution),
    deviceMemory: safeDeviceNumber(source.deviceMemory),
    hardwareConcurrency: safeDeviceNumber(source.hardwareConcurrency),
  };
}

/** Valida que un batch completo cumpla los límites de tamaño. */
export function validateAnalyticsBatch(events: IAnalyticsEventInput[]): void {
  if (events.length > MAX_BATCH_SIZE) {
    throw new ValidationError(`Batch de analytics excede el tamaño máximo (${MAX_BATCH_SIZE}).`);
  }
  for (const event of events) {
    validateAnalyticsEvent(event);
  }
}
