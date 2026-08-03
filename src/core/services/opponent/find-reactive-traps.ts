// src/core/services/opponent/find-reactive-traps.ts - Localiza trampas reactivas elegibles con la misma condición que el motor.
import { TrapTrigger } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { findTriggeredTraps } from "@/core/use-cases/game-engine/effects/internal/trap-selection";
import { ITrapTriggerContext } from "@/core/use-cases/game-engine/effects/internal/trap-types";
import { GameState } from "@/core/use-cases/GameEngine";

/** Delega en el criterio del motor para que tablero y replay nunca ofrezcan otras trampas que él. */
export function findReactiveTraps(
  state: GameState,
  reactivePlayerId: string,
  trigger: TrapTrigger,
  context?: ITrapTriggerContext,
): IBoardEntity[] {
  const reactivePlayer = state.playerA.id === reactivePlayerId ? state.playerA : state.playerB;
  return findTriggeredTraps(reactivePlayer, trigger, context);
}

export function findReactiveTrap(
  state: GameState,
  reactivePlayerId: string,
  trigger: TrapTrigger,
  context?: ITrapTriggerContext,
): IBoardEntity | null {
  return findReactiveTraps(state, reactivePlayerId, trigger, context)[0] ?? null;
}
