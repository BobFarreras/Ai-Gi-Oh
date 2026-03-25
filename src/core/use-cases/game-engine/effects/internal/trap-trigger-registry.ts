// src/core/use-cases/game-engine/effects/internal/trap-trigger-registry.ts - Registry de eventos reactivos que mapea eventos del motor a triggers de trampa.
import { ITrapTriggerContext } from "@/core/use-cases/game-engine/effects/internal/trap-types";
import { resolveTrapTrigger } from "@/core/use-cases/game-engine/effects/resolve-trap-trigger";
import { GameState } from "@/core/use-cases/game-engine/state/types";

export type TrapReactiveEvent =
  | { type: "ATTACK_DECLARED"; context: Required<Pick<ITrapTriggerContext, "attackerPlayerId" | "attackerInstanceId">> }
  | { type: "EXECUTION_ACTIVATED" }
  | { type: "TRAP_ACTIVATED" };

/** Dispara resolución de trampa desde un evento reactivo del motor usando mapping centralizado. */
export function resolveReactiveTrapEvent(state: GameState, reactivePlayerId: string, event: TrapReactiveEvent): GameState {
  if (event.type === "ATTACK_DECLARED") return resolveTrapTrigger(state, reactivePlayerId, "ON_OPPONENT_ATTACK_DECLARED", event.context);
  if (event.type === "EXECUTION_ACTIVATED") return resolveTrapTrigger(state, reactivePlayerId, "ON_OPPONENT_EXECUTION_ACTIVATED");
  return resolveTrapTrigger(state, reactivePlayerId, "ON_OPPONENT_TRAP_ACTIVATED");
}

export function getRegisteredTrapReactiveEvents(): ReadonlyArray<TrapReactiveEvent["type"]> {
  return ["ATTACK_DECLARED", "EXECUTION_ACTIVATED", "TRAP_ACTIVATED"];
}
