// src/services/performance/dev-performance-telemetry.ts - Telemetría de rendimiento en desarrollo para contar renders y medir latencias de interacción.
interface IInteractionSample {
  action: string;
  durationMs: number;
  status: "ok" | "error";
  timestampMs: number;
}

interface IRenderCounters {
  [component: string]: number;
}

interface IPerformanceStore {
  renders: IRenderCounters;
  interactions: IInteractionSample[];
}

interface IInteractionToken {
  action: string;
  startMs: number;
}

declare global {
  interface Window {
    __AIGIOH_PERF__?: IPerformanceStore;
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isEnabled(): boolean {
  if (!isBrowser()) return false;
  if (process.env.NODE_ENV === "production") return false;
  return window.localStorage.getItem("debug-performance") === "1";
}

function ensureStore(): IPerformanceStore | null {
  if (!isEnabled()) return null;
  if (!window.__AIGIOH_PERF__) {
    window.__AIGIOH_PERF__ = { renders: {}, interactions: [] };
  }
  return window.__AIGIOH_PERF__;
}

export function countRender(component: string): void {
  const store = ensureStore();
  if (!store) return;
  const current = store.renders[component] ?? 0;
  store.renders[component] = current + 1;
}

export function startInteraction(action: string): IInteractionToken | null {
  if (!ensureStore()) return null;
  return { action, startMs: performance.now() };
}

export function endInteraction(token: IInteractionToken | null, status: "ok" | "error"): void {
  const store = ensureStore();
  if (!store || !token) return;
  const durationMs = performance.now() - token.startMs;
  store.interactions.push({ action: token.action, durationMs, status, timestampMs: Date.now() });
  if (store.interactions.length > 250) {
    store.interactions.splice(0, store.interactions.length - 250);
  }
}

export function resetPerformanceTelemetry(): void {
  const store = ensureStore();
  if (!store) return;
  store.renders = {};
  store.interactions = [];
}
