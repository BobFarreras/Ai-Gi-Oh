// src/services/analytics/client/analytics-buffer.ts - Singleton vanilla de telemetría: track() es push O(1), sin React state, sin re-render. Flush via requestIdleCallback + sendBeacon.
import { AnalyticsEventCategory, IAnalyticsDeviceInfo, IAnalyticsEventInput } from "@/core/entities/analytics/IAnalyticsEvent";
import { captureDeviceInfo } from "./device-info";
import { shouldSample } from "./sampling";

const BUFFER_SIZE = 50;
const FLUSH_INTERVAL_MS = 30_000;

/** Lee el feature flag en cada llamada para permitir cambios en tests y runtime. */
function isAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";
}

let buffer: IAnalyticsEventInput[] = [];
let sessionId = "";
let deviceInfo: IAnalyticsDeviceInfo | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let initialized = false;

/** Genera un ID de sesión único. */
function generateSessionId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Envía el buffer al endpoint de analytics via sendBeacon (no bloquea el hilo). */
function flush(): void {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, BUFFER_SIZE);
  const payload = JSON.stringify({ events: batch, deviceInfo: deviceInfo ?? {} });
  try {
    navigator.sendBeacon("/api/analytics/batch", payload);
  } catch {
    // Analytics nunca debe romper el juego.
  }
}

/** Programa un flush fuera del frame budget usando requestIdleCallback. */
function scheduleFlush(): void {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(flush);
  } else {
    setTimeout(flush, 50);
  }
}

/**
 * Trackea un evento de analytics. Fire-and-forget: push O(1), sin React, sin re-render.
 * Si analytics está desactivado o falla, el juego no se entera.
 */
export function track(eventName: string, eventCategory: AnalyticsEventCategory, properties: Record<string, unknown> = {}): void {
  if (!isAnalyticsEnabled() || !initialized) return;
  try {
    if (shouldSample(eventName)) return;
    buffer.push({
      eventName,
      eventCategory,
      properties,
      pageUrl: typeof window !== "undefined" ? window.location.pathname : "",
      timestamp: Date.now(),
      sessionId,
    });
    if (buffer.length >= BUFFER_SIZE) scheduleFlush();
  } catch {
    // Analytics nunca debe romper el juego.
  }
}

/** Inicializa la sesión de analytics: captura device info, registra session_started y configura listeners de flush. */
export function initAnalytics(): void {
  if (!isAnalyticsEnabled() || initialized) return;
  if (typeof window === "undefined") return;

  initialized = true;
  sessionId = generateSessionId();
  deviceInfo = captureDeviceInfo();

  // Evento de inicio de sesión.
  track("session_started", "system", { ...deviceInfo });

  // Flush periódico cada 30s.
  flushTimer = setInterval(scheduleFlush, FLUSH_INTERVAL_MS);

  // Flush al ocultar la pestaña o navegar fuera (sobrevive a cierre).
  const handleVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") flush();
  };
  const handlePageHide = (): void => flush();
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", handlePageHide);
}

/** Trackea un page view. Llamar en cada cambio de ruta. */
export function trackPageView(page: string): void {
  track("page_viewed", "navigation", { page });
}

/** Fuerza el flush del buffer (para tests o cierre controlado). */
export function flushAnalytics(): void {
  flush();
}

/** Resetea el estado del buffer (para tests). */
export function resetAnalyticsForTests(): void {
  buffer = [];
  sessionId = "";
  deviceInfo = null;
  initialized = false;
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}
