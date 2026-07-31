// src/core/use-cases/match/internal/derive-opponent-turn.ts - Reproduce el turno rival en servidor sin aceptar sus jugadas del cliente.
import { CombatProofError } from "@/core/errors/CombatProofError";
import { ICombatJournalEntry, IMatchActionPayload } from "@/core/entities/match";
import { opponentAutoPick } from "@/core/services/opponent/opponent-auto-pick";
import { IPlayerTrapChoice, resolveOpponentIntent } from "@/core/services/opponent/resolve-opponent-intent";
import { buildOpponentIntentAction } from "@/core/services/opponent/build-opponent-intent-action";
import { IOpponentAutoPick, IOpponentStrategy } from "@/core/services/opponent/types";
import { resolveWinnerPlayerId } from "@/core/services/turn/resolve-winner-player-id";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { GameState } from "@/core/use-cases/game-engine/state/types";

export const DEFAULT_MAX_OPPONENT_STEPS = 2000;

export interface IOpponentDerivation {
  strategy: IOpponentStrategy;
  autoPick?: IOpponentAutoPick;
  maxSteps?: number;
}

interface IDeriveOpponentTurnInput {
  state: GameState;
  opponentId: string;
  entries: ICombatJournalEntry[];
  cursor: number;
  derivation: IOpponentDerivation;
  applyAction: (state: GameState, actorPlayerId: string, action: IMatchActionPayload) => GameState;
  stepsTaken: number;
}

/** Extrae del journal la única decisión humana del turno rival: activar o no su trampa reactiva. */
function consumePlayerTrapChoice(entries: ICombatJournalEntry[], cursor: number): { choice: IPlayerTrapChoice; cursor: number } {
  const entry = entries[cursor];
  if (!entry || entry.action.type !== "RESOLVE_REACTIVE_TRAP") {
    throw new CombatProofError("Falta la decisión de trampa del jugador en el turno del rival.");
  }
  const payload = entry.action.payload;
  return {
    choice: { activate: Boolean(payload.activate), chosenTrapInstanceId: payload.chosenTrapInstanceId },
    cursor: cursor + 1,
  };
}

/**
 * Avanza el estado mientras sea turno del rival. Sus decisiones salen del resolutor compartido, así que
 * un cliente modificado no puede hacer que la IA se deje ganar.
 */
export function deriveOpponentTurn(input: IDeriveOpponentTurnInput): { state: GameState; cursor: number; stepsTaken: number } {
  const maxSteps = input.derivation.maxSteps ?? DEFAULT_MAX_OPPONENT_STEPS;
  const autoPick = input.derivation.autoPick ?? opponentAutoPick;
  let state = input.state;
  let cursor = input.cursor;
  let stepsTaken = input.stepsTaken;

  while (state.activePlayerId === input.opponentId && !resolveWinnerPlayerId(state)) {
    stepsTaken += 1;
    if (stepsTaken > maxSteps) throw new CombatProofError("El turno del rival no alcanza un final.");
    const intent = resolveOpponentIntent({
      state,
      opponentId: input.opponentId,
      strategy: input.derivation.strategy,
      autoPick,
    });
    if (intent.kind === "IDLE") break;
    if (intent.kind === "CANCEL_PENDING_TURN_ACTION") {
      state = GameEngine.cancelUnresolvablePendingTurnAction(state, input.opponentId);
      continue;
    }
    const prompt = "playerTrapPrompt" in intent ? intent.playerTrapPrompt : null;
    let choice: IPlayerTrapChoice = { activate: false };
    if (prompt) {
      const consumed = consumePlayerTrapChoice(input.entries, cursor);
      choice = consumed.choice;
      cursor = consumed.cursor;
    }
    const action = buildOpponentIntentAction(intent, choice);
    if (!action) break;
    state = input.applyAction(state, input.opponentId, action);
  }

  return { state, cursor, stepsTaken };
}
