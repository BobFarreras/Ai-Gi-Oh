// src/core/use-cases/game-engine/state/status-effects.ts - Reglas puras de los efectos de estado
// multi-turno: consulta (¿bloqueado?), alta con id determinista y tick al terminar el turno.
import { IActiveStatusEffect, StatusEffectKind } from "@/core/entities/IStatusEffect";

/** Especificación de un estado a añadir (sin id; el id se deriva de forma determinista al insertarlo). */
export interface IStatusEffectSpec {
  kind: StatusEffectKind;
  targetPlayerId: string;
  remainingTurns: number | null;
  /** Cuantía por turno (LP) para DAMAGE_OVER_TIME/HEAL_OVER_TIME. */
  magnitude?: number;
}

/** Resultado de aplicar los estados de daño/curación por turno al inicio del turno de un jugador. */
export interface IStatusEffectTurnStartOutcome {
  healthPoints: number;
  damageApplied: number;
  healApplied: number;
}

/** ¿El jugador tiene activo algún estado que le impide hacer ataques directos? */
export function isDirectAttackBlocked(statusEffects: readonly IActiveStatusEffect[] | undefined, playerId: string): boolean {
  return (statusEffects ?? []).some((status) => status.kind === "NO_DIRECT_ATTACKS" && status.targetPlayerId === playerId);
}

/**
 * Inserta nuevos estados con id determinista (`kind-target-turn`). Si ya existe un estado del mismo tipo
 * para el mismo jugador, lo REEMPLAZA (refresca su duración) en vez de acumular duplicados.
 */
export function addStatusEffects(
  current: readonly IActiveStatusEffect[] | undefined,
  specs: readonly IStatusEffectSpec[],
  turn: number,
): IActiveStatusEffect[] {
  let next = [...(current ?? [])];
  for (const spec of specs) {
    next = next.filter((status) => !(status.kind === spec.kind && status.targetPlayerId === spec.targetPlayerId));
    next.push({
      id: `${spec.kind}-${spec.targetPlayerId}-${turn}`,
      kind: spec.kind,
      targetPlayerId: spec.targetPlayerId,
      remainingTurns: spec.remainingTurns,
      ...(typeof spec.magnitude === "number" ? { magnitude: spec.magnitude } : {}),
    });
  }
  return next;
}

/**
 * Aplica al inicio del turno de `playerId` los estados de daño/curación por turno que le apuntan.
 * El daño reduce PV (mínimo 0) y la curación sube hasta `maxHealthPoints`. Puro y determinista.
 */
export function applyStatusEffectsAtTurnStart(
  statusEffects: readonly IActiveStatusEffect[] | undefined,
  playerId: string,
  currentHealth: number,
  maxHealth: number,
): IStatusEffectTurnStartOutcome {
  let healthPoints = currentHealth;
  let damageApplied = 0;
  let healApplied = 0;
  for (const status of statusEffects ?? []) {
    if (status.targetPlayerId !== playerId) continue;
    const magnitude = Math.max(0, status.magnitude ?? 0);
    if (magnitude === 0) continue;
    if (status.kind === "DAMAGE_OVER_TIME") {
      const next = Math.max(0, healthPoints - magnitude);
      damageApplied += healthPoints - next;
      healthPoints = next;
    } else if (status.kind === "HEAL_OVER_TIME") {
      const next = Math.min(maxHealth, healthPoints + magnitude);
      healApplied += next - healthPoints;
      healthPoints = next;
    }
  }
  return { healthPoints, damageApplied, healApplied };
}

/**
 * Descuenta 1 turno a los estados del jugador cuyo turno TERMINA y purga los expirados (igual criterio
 * que el bloqueo de entities: "N turnos" = N turnos reales del afectado). Los de duración `null` no expiran.
 */
export function tickStatusEffectsOnTurnEnd(
  statusEffects: readonly IActiveStatusEffect[] | undefined,
  outgoingPlayerId: string,
): IActiveStatusEffect[] {
  const result: IActiveStatusEffect[] = [];
  for (const status of statusEffects ?? []) {
    if (status.targetPlayerId !== outgoingPlayerId || status.remainingTurns === null) {
      result.push(status);
      continue;
    }
    const remaining = status.remainingTurns - 1;
    if (remaining > 0) result.push({ ...status, remainingTurns: remaining });
  }
  return result;
}
