// src/core/use-cases/game-engine/logging/combat-log.ts - Crea y agrega eventos tipados del combatLog en estado inmutable.
import { CombatLogEventType, ICombatLogEvent } from "@/core/entities/ICombatLog";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function createCombatLogEvent(
  state: GameState,
  actorPlayerId: string,
  eventType: CombatLogEventType,
  payload: Record<string, unknown>,
): ICombatLogEvent {
  return {
    id: `${eventType}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    turn: state.turn,
    phase: state.phase,
    actorPlayerId,
    eventType,
    payload,
    timestamp: new Date().toISOString(),
  };
}

export function appendCombatLogEvent(
  state: GameState,
  actorPlayerId: string,
  eventType: CombatLogEventType,
  payload: Record<string, unknown>,
): GameState {
  return {
    ...state,
    combatLog: [...state.combatLog, createCombatLogEvent(state, actorPlayerId, eventType, payload)],
  };
}
