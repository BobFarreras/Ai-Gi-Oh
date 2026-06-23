// src/services/analytics/client/sampling.ts - Control de sampling para eventos de alta frecuencia: reduce ruido sin perder señal de negocio.

/** Eventos de alta frecuencia que se muestrean (probabilidad de registro). */
const SAMPLED_EVENTS: Record<string, number> = {
  card_played: 0.2,
  card_summoned: 0.2,
  attack_declared: 0.2,
};

/**
 * Decide si un evento debe ser trackeado según su tasa de sampling.
 * Eventos no listados = 100% (siempre trackeados).
 */
export function shouldSample(eventName: string): boolean {
  const rate = SAMPLED_EVENTS[eventName];
  if (!rate) return false;
  return Math.random() > rate;
}
