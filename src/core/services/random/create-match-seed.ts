// src/core/services/random/create-match-seed.ts - Crea seeds únicas de partida para reproducibilidad y depuración de duelos.
export function createMatchSeed(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `seed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
