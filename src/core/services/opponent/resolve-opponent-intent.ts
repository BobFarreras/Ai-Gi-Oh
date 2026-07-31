// src/core/services/opponent/resolve-opponent-intent.ts - Decide la jugada del rival de forma pura para que tablero y replay no diverjan.
import { GameState } from "@/core/use-cases/GameEngine";
import { findReactiveTraps } from "./find-reactive-traps";
import { pickOpponentPendingActionId } from "./pick-opponent-pending-action-id";
import { canActivateExecutionNow } from "./select-opponent-play";
import {
  IOpponentAttackDecision,
  IOpponentAutoPick,
  IOpponentModeChangeDecision,
  IOpponentPlayDecision,
  IOpponentStrategy,
} from "./types";

/** Únicos disparos del rival que pausan su turno para que decida el humano. */
export type PlayerTrapPromptTrigger = "ON_OPPONENT_ATTACK_DECLARED" | "ON_OPPONENT_EXECUTION_ACTIVATED";

/** Trampas del humano que el rival dispara y que exigen una decisión suya antes de resolver. */
export interface IPlayerTrapPrompt {
  trigger: PlayerTrapPromptTrigger;
  eligibleTrapInstanceIds: string[];
}

export interface IPlayerTrapChoice {
  activate: boolean;
  chosenTrapInstanceId?: string;
}

export type OpponentIntent =
  | { kind: "IDLE" }
  | { kind: "CANCEL_PENDING_TURN_ACTION" }
  | { kind: "RESOLVE_PENDING_TURN_ACTION"; selectedId: string }
  | { kind: "RESOLVE_EXECUTION"; instanceId: string; playerTrapPrompt: IPlayerTrapPrompt | null }
  | { kind: "ACTIVATE_SET_EXECUTION"; instanceId: string }
  | { kind: "PLAY"; decision: IOpponentPlayDecision }
  | { kind: "ATTACK"; decision: IOpponentAttackDecision; playerTrapPrompt: IPlayerTrapPrompt | null }
  | { kind: "CHANGE_ENTITY_MODE"; decision: IOpponentModeChangeDecision }
  | { kind: "NEXT_PHASE" };

interface IResolveOpponentIntentInput {
  state: GameState;
  opponentId: string;
  strategy: IOpponentStrategy;
  autoPick: IOpponentAutoPick;
}

function buildTrapPrompt(
  state: GameState,
  humanId: string,
  trigger: PlayerTrapPromptTrigger,
  defenderInstanceId?: string,
): IPlayerTrapPrompt | null {
  const traps = findReactiveTraps(state, humanId, trigger, defenderInstanceId ? { defenderInstanceId } : undefined);
  if (traps.length === 0) return null;
  return { trigger, eligibleTrapInstanceIds: traps.map((trap) => trap.instanceId) };
}

function resolveMainPhaseIntent(
  input: IResolveOpponentIntentInput,
  opponent: GameState["playerA"],
  human: GameState["playerA"],
): OpponentIntent {
  const { state } = input;
  if (state.pendingTurnAction?.playerId === input.opponentId) {
    const selectedId = pickOpponentPendingActionId(state, input.autoPick);
    return selectedId
      ? { kind: "RESOLVE_PENDING_TURN_ACTION", selectedId }
      : { kind: "CANCEL_PENDING_TURN_ACTION" };
  }
  const pendingExecution = opponent.activeExecutions.find((entity) => entity.mode === "ACTIVATE");
  if (pendingExecution) {
    return {
      kind: "RESOLVE_EXECUTION",
      instanceId: pendingExecution.instanceId,
      playerTrapPrompt: buildTrapPrompt(state, human.id, "ON_OPPONENT_EXECUTION_ACTIVATED"),
    };
  }
  const setExecutionToActivate = opponent.activeExecutions.find(
    (entity) => entity.mode === "SET" && canActivateExecutionNow(entity.card, opponent, human),
  );
  if (setExecutionToActivate) {
    return { kind: "ACTIVATE_SET_EXECUTION", instanceId: setExecutionToActivate.instanceId };
  }
  const playDecision = input.strategy.choosePlay(state, input.opponentId);
  return playDecision ? { kind: "PLAY", decision: playDecision } : { kind: "NEXT_PHASE" };
}

function resolveBattlePhaseIntent(input: IResolveOpponentIntentInput, human: GameState["playerA"]): OpponentIntent {
  const { state } = input;
  if (state.turn === 1 && state.startingPlayerId === input.opponentId) return { kind: "NEXT_PHASE" };
  const attackDecision = input.strategy.chooseAttack(state, input.opponentId);
  if (attackDecision) {
    return {
      kind: "ATTACK",
      decision: attackDecision,
      playerTrapPrompt: buildTrapPrompt(
        state,
        human.id,
        "ON_OPPONENT_ATTACK_DECLARED",
        attackDecision.defenderInstanceId,
      ),
    };
  }
  const modeChangeDecision = input.strategy.chooseModeChange?.(state, input.opponentId);
  return modeChangeDecision
    ? { kind: "CHANGE_ENTITY_MODE", decision: modeChangeDecision }
    : { kind: "NEXT_PHASE" };
}

/**
 * Única fuente de verdad de la IA: el tablero la usa para animar y el servidor para reproducir, de modo
 * que el cliente ya no puede elegir qué juega el rival.
 */
export function resolveOpponentIntent(input: IResolveOpponentIntentInput): OpponentIntent {
  const { state, opponentId } = input;
  if (state.activePlayerId !== opponentId) return { kind: "IDLE" };
  const isOpponentPlayerA = state.playerA.id === opponentId;
  const opponent = isOpponentPlayerA ? state.playerA : state.playerB;
  const human = isOpponentPlayerA ? state.playerB : state.playerA;
  if (state.phase === "MAIN_1") return resolveMainPhaseIntent(input, opponent, human);
  if (state.phase === "BATTLE") return resolveBattlePhaseIntent(input, human);
  return { kind: "IDLE" };
}
