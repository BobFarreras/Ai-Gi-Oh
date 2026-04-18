// src/services/player-profile/resolve-default-nickname-from-email.ts - Resuelve nickname inicial estable a partir del email autenticado.
export function resolveDefaultNicknameFromEmail(email: string | null, fallback = "Operador"): string {
  if (!email) return fallback;
  const candidate = email.split("@")[0]?.trim() ?? "";
  return candidate.length >= 3 ? candidate : fallback;
}

