// src/components/game/board/hooks/internal/opponent-turn/runMainPhaseStep.ts - Ejecuta el paso principal del turno rival resolviendo pendientes y acciones jugables.
import { GameEngine } from "@/core/use-cases/GameEngine";
import { addRevealedId, findReactiveTrap, removeRevealedId } from "../trapPreview";
import { sleep } from "../sleep";
import { IOpponentAutoPick, IOpponentStepTimings, IOpponentTurnContext } from "./types";

export async function runMainPhaseStep(
  context: IOpponentTurnContext,
  timings: IOpponentStepTimings,
  autoPick: IOpponentAutoPick,
): Promise<boolean> {
  const { gameState } = context;
  const opponentId = gameState.playerB.id;

  if (gameState.pendingTurnAction?.playerId === opponentId) {
    const selectedId = autoPick.chooseCardToDiscard(gameState.playerB.hand)?.id ?? null;
    if (!selectedId) return true;
    context.setIsAnimating(true);
    await sleep(timings.stepDelayMs);
    const nextState = context.applyTransition((state) => GameEngine.resolvePendingTurnAction(state, opponentId, selectedId));
    await sleep(timings.postResolutionMs);
    context.setIsAnimating(false);
    if (nextState && nextState.activePlayerId === nextState.playerA.id) {
      context.clearSelection();
      context.clearError();
    }
    return true;
  }

  const pendingExecution = gameState.playerB.activeExecutions.find((entity) => entity.mode === "ACTIVATE");
  if (pendingExecution) {
    const reactiveTrap = findReactiveTrap(gameState, gameState.playerA.id, "ON_OPPONENT_EXECUTION_ACTIVATED");
    context.setIsAnimating(true);
    context.setActiveAttackerId(pendingExecution.instanceId);
    if (reactiveTrap) context.setRevealedEntities((previous) => addRevealedId(previous, reactiveTrap.instanceId));
    await sleep(timings.stepDelayMs);
    if (reactiveTrap) {
      context.setActiveAttackerId(reactiveTrap.instanceId);
      await sleep(timings.trapPreviewMs);
      context.setActiveAttackerId(pendingExecution.instanceId);
    }
    const nextState = context.applyTransition((state) => GameEngine.resolveExecution(state, opponentId, pendingExecution.instanceId));
    await sleep(timings.postResolutionMs);
    if (reactiveTrap) context.setRevealedEntities((previous) => removeRevealedId(previous, reactiveTrap.instanceId));
    context.setActiveAttackerId(null);
    context.setIsAnimating(false);
    if (nextState && nextState.activePlayerId === nextState.playerA.id) {
      context.clearSelection();
      context.clearError();
    }
    return true;
  }

  const playDecision = context.strategy.choosePlay(gameState, opponentId);
  if (playDecision) {
    context.setIsAnimating(true);
    const nextState = playDecision.fusionMaterialInstanceIds
      ? context.applyTransition((state) =>
          GameEngine.fuseCards(
            state,
            opponentId,
            playDecision.cardId,
            playDecision.fusionMaterialInstanceIds!,
            playDecision.mode === "DEFENSE" ? "DEFENSE" : "ATTACK",
          ),
        )
      : context.applyTransition((state) => GameEngine.playCard(state, opponentId, playDecision.cardId, playDecision.mode));
    if (!playDecision.fusionMaterialInstanceIds && playDecision.mode === "ACTIVATE" && nextState) {
      const activatedExecution = [...nextState.playerB.activeExecutions].reverse().find((entity) => entity.card.id === playDecision.cardId);
      context.setActiveAttackerId(activatedExecution?.instanceId ?? null);
    }
    await sleep(timings.stepDelayMs);
    context.setActiveAttackerId(null);
    context.setIsAnimating(false);
    return true;
  }

  context.setIsAnimating(true);
  await sleep(500);
  context.applyTransition((state) => GameEngine.nextPhase(state));
  context.setIsAnimating(false);
  return true;
}
