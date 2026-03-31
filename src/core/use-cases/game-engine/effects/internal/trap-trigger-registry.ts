// src/core/use-cases/game-engine/effects/internal/trap-trigger-registry.ts - Registry de eventos reactivos que mapea eventos del motor a triggers de trampa.
import { ITrapTriggerContext } from "@/core/use-cases/game-engine/effects/internal/trap-types";
import { resolveTrapTrigger } from "@/core/use-cases/game-engine/effects/resolve-trap-trigger";
import { GameState } from "@/core/use-cases/game-engine/state/types";

export type TrapReactiveEvent =
  | { type: "ATTACK_DECLARED"; context: Required<Pick<ITrapTriggerContext, "attackerPlayerId" | "attackerInstanceId">> }
  | { type: "DIRECT_ATTACK_DECLARED"; context: Required<Pick<ITrapTriggerContext, "attackerPlayerId" | "attackerInstanceId">> }
  | { type: "ENTITY_SET_PLAYED"; context: Required<Pick<ITrapTriggerContext, "summonedPlayerId" | "summonedInstanceId">> }
  | { type: "EXECUTION_BUFF_APPLIED"; context: Required<Pick<ITrapTriggerContext, "buffSourcePlayerId" | "buffStat" | "buffAmount">> }
  | { type: "EXECUTION_ACTIVATED" }
  | { type: "TRAP_ACTIVATED" };

export interface ITrapReactiveResolutionOptions {
  skipReactivePlayerIds?: string[];
  skipEventTypes?: TrapReactiveEvent["type"][];
}

/** Dispara resolución de trampa desde un evento reactivo del motor usando mapping centralizado. */
export function resolveReactiveTrapEvent(
  state: GameState,
  reactivePlayerId: string,
  event: TrapReactiveEvent,
  options?: ITrapReactiveResolutionOptions,
): GameState {
  if (options?.skipReactivePlayerIds?.includes(reactivePlayerId) && options?.skipEventTypes?.includes(event.type)) {
    return state;
  }
  if (event.type === "ATTACK_DECLARED") return resolveTrapTrigger(state, reactivePlayerId, "ON_OPPONENT_ATTACK_DECLARED", event.context);
  if (event.type === "DIRECT_ATTACK_DECLARED") return resolveTrapTrigger(state, reactivePlayerId, "ON_OPPONENT_DIRECT_ATTACK_DECLARED", event.context);
  if (event.type === "ENTITY_SET_PLAYED") return resolveTrapTrigger(state, reactivePlayerId, "ON_OPPONENT_ENTITY_SET_PLAYED", event.context);
  if (event.type === "EXECUTION_BUFF_APPLIED") return resolveTrapTrigger(state, reactivePlayerId, "ON_OPPONENT_STAT_BUFF_APPLIED", event.context);
  if (event.type === "EXECUTION_ACTIVATED") return resolveTrapTrigger(state, reactivePlayerId, "ON_OPPONENT_EXECUTION_ACTIVATED");
  return resolveTrapTrigger(state, reactivePlayerId, "ON_OPPONENT_TRAP_ACTIVATED");
}

export function getRegisteredTrapReactiveEvents(): ReadonlyArray<TrapReactiveEvent["type"]> {
  return ["ATTACK_DECLARED", "DIRECT_ATTACK_DECLARED", "ENTITY_SET_PLAYED", "EXECUTION_BUFF_APPLIED", "EXECUTION_ACTIVATED", "TRAP_ACTIVATED"];
}
