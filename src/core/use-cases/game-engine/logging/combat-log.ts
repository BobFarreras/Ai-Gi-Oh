// src/core/use-cases/game-engine/logging/combat-log.ts - Crea y agrega eventos tipados del combatLog en estado inmutable.
import { CombatLogEventType, ICombatLogEvent } from "@/core/entities/ICombatLog";
import { defaultGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function createCombatLogEvent(
  state: GameState,
  actorPlayerId: string,
  eventType: CombatLogEventType,
  payload: Record<string, unknown>,
): ICombatLogEvent {
  const idFactory = state.idFactory ?? defaultGameEngineIdFactory;
  return {
    id: idFactory.createCombatLogEventId(eventType),
    turn: state.turn,
    phase: state.phase,
    actorPlayerId,
    eventType,
    payload,
    timestamp: idFactory.createTimestampIso(),
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
