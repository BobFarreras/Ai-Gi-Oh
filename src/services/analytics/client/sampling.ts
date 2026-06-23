// src/services/analytics/client/sampling.ts - Control de sampling para eventos de alta frecuencia. Desactivado por defecto (100% tracking); útil solo a gran volumen.

/** Eventos de alta frecuencia que se muestrean (probabilidad de registro) cuando el sampling está activo. */
const SAMPLED_EVENTS: Record<string, number> = {
  card_played: 0.2,
  card_summoned: 0.2,
  attack_declared: 0.2,
};

/**
 * Flag de sampling. Por defecto OFF: a bajo volumen el muestreo solo resta señal y
 * dificulta validar. Activar (NEXT_PUBLIC_ANALYTICS_SAMPLING="true") solo si el
 * volumen de eventos crece lo bastante como para que el coste/ruido importe.
 */
function isSamplingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ANALYTICS_SAMPLING === "true";
}

/**
 * Decide si un evento debe descartarse por sampling.
 * Con sampling OFF (o evento no muestreado) nunca se descarta = 100% trackeado.
 */
export function shouldSample(eventName: string): boolean {
  if (!isSamplingEnabled()) return false;
  const rate = SAMPLED_EVENTS[eventName];
  if (!rate) return false;
  return Math.random() > rate;
}
