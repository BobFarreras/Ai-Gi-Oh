// src/core/use-cases/match/replay-journal-to-state.ts - Reconstruye el estado de un combate desde su diario, derivando al rival.
import { CombatProofError } from "@/core/errors/CombatProofError";
import { ICombatJournalEntry, IMatchActionPayload } from "@/core/entities/match";
import { GameState } from "@/core/use-cases/game-engine/state/types";
import { deriveOpponentTurn, IOpponentDerivation } from "./internal/derive-opponent-turn";

interface IReplayJournalToStateInput {
  snapshot: GameState;
  entries: ICombatJournalEntry[];
  playerId: string;
  opponentId: string;
  derivation: IOpponentDerivation;
  applyAction: (state: GameState, actorPlayerId: string, action: IMatchActionPayload) => GameState;
}

/**
 * Intercala las acciones del jugador con los turnos que juega el rival. Lo usan el servidor para validar
 * y el cliente para retomar un combate a medias, de modo que ambos llegan exactamente al mismo estado.
 */
export function replayJournalToState(input: IReplayJournalToStateInput): GameState {
  const { entries } = input;
  let { state, cursor, stepsTaken } = deriveOpponentTurn({
    state: input.snapshot,
    opponentId: input.opponentId,
    entries,
    cursor: 0,
    derivation: input.derivation,
    applyAction: input.applyAction,
    stepsTaken: 0,
  });
  while (cursor < entries.length) {
    const entry = entries[cursor];
    cursor += 1;
    if (entry.action.type === "RESOLVE_REACTIVE_TRAP") {
      throw new CombatProofError("El journal declara una decisión de trampa fuera del turno del rival.");
    }
    state = input.applyAction(state, input.playerId, entry.action);
    ({ state, cursor, stepsTaken } = deriveOpponentTurn({
      state,
      opponentId: input.opponentId,
      entries,
      cursor,
      derivation: input.derivation,
      applyAction: input.applyAction,
      stepsTaken,
    }));
  }
  return state;
}
