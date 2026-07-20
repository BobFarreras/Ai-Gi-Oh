// src/core/use-cases/game-engine/combat/resolve-reactive-trap-decision.ts - Resuelve la decisión del defensor
// (ficha 4, multi) sobre qué trampa reactiva activa —o pasar— ante un ataque que quedó en pausa.
import { GameRuleError } from "@/core/errors/GameRuleError";
import { executeAttack } from "@/core/use-cases/game-engine/combat/execute-attack";
import { GameState } from "@/core/use-cases/game-engine/state/types";

const REACTIVE_TRAP_EVENT_TYPES = ["ATTACK_DECLARED", "DIRECT_ATTACK_DECLARED"] as const;

/**
 * Continúa un ataque que quedó pausado esperando la decisión de trampa reactiva del DEFENSOR. Re-ejecuta el
 * MISMO ataque (mismo atacante/objetivo) con la elección del defensor, ahora SIN diferir:
 *  - `activate === false` (pasar): se salta la(s) trampa(s) reactiva(s) del defensor; el ataque resuelve sin ellas.
 *  - `activate === true`: se activa la trampa elegida (`chosenTrapInstanceId`), REVALIDADA en el motor de
 *    selección (un id que no esté entre las elegibles no activa NADA — cliente manipulado).
 * El estado final es el que habría producido `executeAttack` directo con esa elección, así que ambos clientes
 * (que aplican esta misma acción) convergen: determinista.
 */
export function resolveReactiveTrapDecision(
  state: GameState,
  defenderPlayerId: string,
  decision: { activate: boolean; chosenTrapInstanceId?: string },
): GameState {
  const pending = state.pendingReactiveTrapDecision;
  if (!pending) {
    throw new GameRuleError("No hay ninguna decisión de trampa reactiva pendiente.");
  }
  if (pending.defenderPlayerId !== defenderPlayerId) {
    throw new GameRuleError("Solo el defensor puede decidir su trampa reactiva.");
  }

  const cleared: GameState = { ...state, pendingReactiveTrapDecision: undefined };
  const declineCounterTrap = pending.declineCounterTrap
    ? { skipCounterTrapPlayerIds: [pending.attackerPlayerId] }
    : {};

  if (!decision.activate) {
    // Pasar: el ataque resuelve saltándose las trampas reactivas del defensor (mismo criterio que el motor).
    return executeAttack(cleared, pending.attackerPlayerId, pending.attackerInstanceId, pending.defenderInstanceId, {
      ...declineCounterTrap,
      skipReactivePlayerIds: [defenderPlayerId],
      skipTrapEventTypes: [...REACTIVE_TRAP_EVENT_TYPES],
    });
  }

  return executeAttack(cleared, pending.attackerPlayerId, pending.attackerInstanceId, pending.defenderInstanceId, {
    ...declineCounterTrap,
    chosenTrapInstanceId: decision.chosenTrapInstanceId,
  });
}
