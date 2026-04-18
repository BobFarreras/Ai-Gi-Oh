// src/components/landing/internal/landing-access-code-storage.ts - Utilidades para persistir temporalmente el access code capturado en landing.
const ACCESS_CODE_MIN_LENGTH = 3;
const ACCESS_CODE_MAX_LENGTH = 24;

export const LANDING_PENDING_ACCESS_CODE_STORAGE_KEY = "aigi.pending-access-code";

/**
 * Normaliza y valida access code para reutilizarlo como nickname inicial.
 */
export function normalizeLandingAccessCode(value: string): string | null {
  const candidate = value.trim();
  if (candidate.length < ACCESS_CODE_MIN_LENGTH || candidate.length > ACCESS_CODE_MAX_LENGTH) return null;
  return candidate;
}

