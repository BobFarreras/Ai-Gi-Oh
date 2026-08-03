// src/components/game/board/hooks/internal/player-actions/useExecutePlayAction.internal.ts - Encapsula reglas auxiliares de jugada para mantener el hook principal legible y con SRP.
import { BattleMode } from "@/core/entities/IPlayer";
import { GameState, GameEngine } from "@/core/use-cases/GameEngine";
import { LocalActionEmitter } from "@/components/game/board/multiplayer/local-action-emitter";
import { sleep } from "../sleep";
import { executionEffectAppliesBuff } from "@/core/services/effects/execution-buff-detection";
import { addRevealedId, removeRevealedId } from "../trapPreview";
import { findReactiveTrap } from "@/core/services/opponent/find-reactive-traps";
import { PLAYER_POST_RESOLUTION_MS, PLAYER_TRAP_PREVIEW_MS } from "./constants";
import { IUsePlayerActionsParams, RequestTrapActivationDecision } from "./types";

interface IBoardUiError {
  code: "GAME_RULE_ERROR" | "NOT_FOUND_ERROR";
  message: string;
}

type IApplyTransition = IUsePlayerActionsParams["applyTransition"];
type ISetRevealedEntities = IUsePlayerActionsParams["setRevealedEntities"];
type ISetSelectedCard = IUsePlayerActionsParams["setSelectedCard"];
type ISetActiveAttackerId = IUsePlayerActionsParams["setActiveAttackerId"];

interface IAttemptZoneReplacementInput {
  gameState: GameState;
  selectedCardReference: string;
  mode: BattleMode;
  zone: "ENTITIES" | "EXECUTIONS";
  fullZoneMessage: string;
  setPendingEntityReplacement: IUsePlayerActionsParams["setPendingEntityReplacement"];
  setPendingEntityReplacementTargetId: IUsePlayerActionsParams["setPendingEntityReplacementTargetId"];
  setLastError: IUsePlayerActionsParams["setLastError"];
}

interface IExecuteActivationInput {
  gameState: GameState;
  selectedCardReference: string;
  applyTransition: IApplyTransition;
  requestTrapActivationDecision: RequestTrapActivationDecision;
  clearSelection: IUsePlayerActionsParams["clearSelection"];
  setIsAnimating: IUsePlayerActionsParams["setIsAnimating"];
  setLastError: IUsePlayerActionsParams["setLastError"];
  setRevealedEntities: ISetRevealedEntities;
  setActiveAttackerId: ISetActiveAttackerId;
  setSelectedCard: ISetSelectedCard;
  emitLocalAction: LocalActionEmitter;
}

export function resolvePlayErrorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim().length > 0 ? error.message : "No se pudo jugar la carta.";
}

// Intenta reproducir la jugada para detectar el error de zona llena y activar flujo de reemplazo.
export function attemptZoneReplacementOnFull(input: IAttemptZoneReplacementInput): boolean {
  try {
    GameEngine.playCard(input.gameState, input.gameState.playerA.id, input.selectedCardReference, input.mode);
  } catch (error: unknown) {
    const message = resolvePlayErrorMessage(error);
    if (!message.includes(input.fullZoneMessage)) {
      input.setLastError({ code: "GAME_RULE_ERROR", message });
      return true;
    }
  }
  input.setPendingEntityReplacement({ cardId: input.selectedCardReference, mode: input.mode, zone: input.zone });
  input.setPendingEntityReplacementTargetId(null);
  input.setLastError(null);
  return true;
}

export async function executeActivationPlay(input: IExecuteActivationInput): Promise<void> {
  input.setIsAnimating(true);
  const playedState = input.applyTransition((state) => GameEngine.playCard(state, state.playerA.id, input.selectedCardReference, "ACTIVATE"));
  if (!playedState) {
    input.setIsAnimating(false);
    return;
  }

  const executionId = playedState.playerA.activeExecutions.at(-1)?.instanceId;
  if (!executionId) {
    const notFoundError: IBoardUiError = { code: "NOT_FOUND_ERROR", message: "No se pudo localizar la ejecución recién activada." };
    input.setLastError(notFoundError);
    input.setIsAnimating(false);
    return;
  }

  // Sincronizar la jugada de la carta de magia/ejecución al rival.
  input.emitLocalAction({ type: "PLAY_CARD", payload: { cardId: input.selectedCardReference, mode: "ACTIVATE" } });

  input.clearSelection();
  await sleep(1500);
  // Una ejecución dispara ON_OPPONENT_EXECUTION_ACTIVATED y, SOLO si aplica un buff, ON_OPPONENT_STAT_BUFF_APPLIED.
  // La de buff (OpenClaw) solo se considera si la magia jugada realmente buffea; si no, no debe revelarse.
  const playedExecution = playedState.playerA.activeExecutions.find((entity) => entity.instanceId === executionId);
  const appliesBuff = executionEffectAppliesBuff(playedExecution?.card.effect);
  const reactiveTrap =
    findReactiveTrap(input.gameState, input.gameState.playerB.id, "ON_OPPONENT_EXECUTION_ACTIVATED") ??
    (appliesBuff ? findReactiveTrap(input.gameState, input.gameState.playerB.id, "ON_OPPONENT_STAT_BUFF_APPLIED") : null);
  const playerCounterTrap = reactiveTrap
    ? findReactiveTrap(input.gameState, input.gameState.playerA.id, "ON_OPPONENT_TRAP_ACTIVATED")
    : null;

  if (reactiveTrap) {
    input.setRevealedEntities((previous) => addRevealedId(previous, reactiveTrap.instanceId));
    input.setActiveAttackerId(reactiveTrap.instanceId);
    input.setSelectedCard(reactiveTrap.card);
    await sleep(PLAYER_TRAP_PREVIEW_MS);
  }
  // El jugador decide si activa su contra-trampa (Nullify) para negar la trampa rival.
  const activateCounterTrap = playerCounterTrap
    ? (await input.requestTrapActivationDecision([{ card: playerCounterTrap.card, instanceId: playerCounterTrap.instanceId }], "ON_OPPONENT_TRAP_ACTIVATED")).activate
    : false;
  if (playerCounterTrap && activateCounterTrap) {
    input.setRevealedEntities((previous) => addRevealedId(previous, playerCounterTrap.instanceId));
    input.setActiveAttackerId(playerCounterTrap.instanceId);
    input.setSelectedCard(playerCounterTrap.card);
    await sleep(PLAYER_TRAP_PREVIEW_MS);
  }

  const declineCounterTrap = Boolean(playerCounterTrap) && !activateCounterTrap;
  const resolvedState = input.applyTransition((state) =>
    GameEngine.resolveExecution(state, state.playerA.id, executionId, declineCounterTrap ? { skipCounterTrapPlayerIds: [state.playerA.id] } : undefined),
  );
  if (resolvedState) {
    // Sincronizar la RESOLUCIÓN del efecto (daño, trampas reactivas, etc.) al rival.
    input.emitLocalAction({ type: "RESOLVE_EXECUTION", payload: { instanceId: executionId, declineCounterTrap: declineCounterTrap || undefined } });
  }
  if (reactiveTrap) {
    await sleep(PLAYER_POST_RESOLUTION_MS);
    input.setRevealedEntities((previous) => removeRevealedId(previous, reactiveTrap.instanceId));
  }
  if (playerCounterTrap && activateCounterTrap) {
    await sleep(PLAYER_POST_RESOLUTION_MS);
    input.setRevealedEntities((previous) => removeRevealedId(previous, playerCounterTrap.instanceId));
  }

  input.setSelectedCard(null);
  input.setActiveAttackerId(null);
  input.setIsAnimating(false);
}
