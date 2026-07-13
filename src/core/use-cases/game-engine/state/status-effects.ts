// src/core/use-cases/game-engine/state/status-effects.ts - Reglas puras de los efectos de estado
// multi-turno: consulta (¿bloqueado?), alta con id determinista y tick al terminar el turno.
import { IActiveStatusEffect, StatusEffectKind } from "@/core/entities/IStatusEffect";

/** Especificación de un estado a añadir (sin id; el id se deriva de forma determinista al insertarlo). */
export interface IStatusEffectSpec {
  kind: StatusEffectKind;
  targetPlayerId: string;
  remainingTurns: number | null;
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
    });
  }
  return next;
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
