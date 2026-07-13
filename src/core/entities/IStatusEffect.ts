// src/core/entities/IStatusEffect.ts - Efectos de estado multi-turno a nivel de jugador (base para cartas
// como "sin ataques directos N turnos" y, más adelante, daño/curación por turno). Vive en GameState y
// serializa/reproduce igual en multijugador.

/** Tipos de estado soportados. */
export type StatusEffectKind = "NO_DIRECT_ATTACKS" | "DAMAGE_OVER_TIME" | "HEAL_OVER_TIME";

export interface IActiveStatusEffect {
  /** Identificador determinista (mismo en ambos clientes). */
  id: string;
  kind: StatusEffectKind;
  /** Jugador afectado por el estado. */
  targetPlayerId: string;
  /** Turnos restantes del jugador afectado; `null` = hasta el final del duelo. */
  remainingTurns: number | null;
  /** Cuantía por turno (LP) para DAMAGE_OVER_TIME/HEAL_OVER_TIME. Ausente en estados sin magnitud. */
  magnitude?: number;
}
