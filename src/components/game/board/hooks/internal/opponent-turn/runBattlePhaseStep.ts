// src/components/game/board/hooks/internal/opponent-turn/runBattlePhaseStep.ts - Ejecuta paso de batalla del oponente con timings y resolución de trampas.
import { GameEngine } from "@/core/use-cases/GameEngine";
import { addRevealedId, findReactiveTrap, removeRevealedId } from "../trapPreview";
import { sleep } from "../sleep";
import { IOpponentStepTimings, IOpponentTurnContext } from "./types";

function isFirstTurnBattleBlocked(gameState: IOpponentTurnContext["gameState"], opponentId: string): boolean {
  return gameState.turn === 1 && gameState.startingPlayerId === opponentId;
}

export async function runBattlePhaseStep(context: IOpponentTurnContext, timings: IOpponentStepTimings): Promise<boolean> {
  const { gameState } = context;
  const opponentId = gameState.playerB.id;
  if (isFirstTurnBattleBlocked(gameState, opponentId)) {
    context.setIsAnimating(true);
    await sleep(280);
    const nextState = context.applyTransition((state) => GameEngine.nextPhase(state));
    context.setIsAnimating(false);
    context.setActiveAttackerId(null);
    if (nextState && nextState.activePlayerId === nextState.playerA.id) {
      context.clearSelection();
      context.clearError();
    }
    return true;
  }
  const attackDecision = context.strategy.chooseAttack(gameState, opponentId);

  if (!attackDecision) {
    context.setIsAnimating(true);
    await sleep(500);
    const nextState = context.applyTransition((state) => GameEngine.nextPhase(state));
    context.setIsAnimating(false);
    if (nextState && nextState.activePlayerId === nextState.playerA.id) {
      context.clearSelection();
      context.clearError();
    }
    return true;
  }

  context.setIsAnimating(true);
  context.setActiveAttackerId(attackDecision.attackerInstanceId);
  const targetEntity = attackDecision.defenderInstanceId
    ? gameState.playerA.activeEntities.find((entity) => entity.instanceId === attackDecision.defenderInstanceId) ?? null
    : null;
  const shouldRevealTargetBeforeBattle = Boolean(targetEntity && targetEntity.mode === "SET");
  if (shouldRevealTargetBeforeBattle && targetEntity) {
    context.setRevealedEntities((previous) => addRevealedId(previous, targetEntity.instanceId));
    await sleep(320);
  }
  const reactiveTrap = findReactiveTrap(gameState, gameState.playerA.id, "ON_OPPONENT_ATTACK_DECLARED");
  const shouldActivateReactiveTrap = reactiveTrap
    ? await context.requestTrapActivationDecision(reactiveTrap.card, "ON_OPPONENT_ATTACK_DECLARED")
    : false;
  const opponentCounterTrap = reactiveTrap
    ? findReactiveTrap(gameState, gameState.playerB.id, "ON_OPPONENT_TRAP_ACTIVATED")
    : null;
  if (reactiveTrap && shouldActivateReactiveTrap) {
    context.setRevealedEntities((previous) => addRevealedId(previous, reactiveTrap.instanceId));
    context.setSelectedCard(reactiveTrap.card);
  }

  await sleep(timings.attackWindupMs);
  if (reactiveTrap && shouldActivateReactiveTrap) {
    context.setActiveAttackerId(reactiveTrap.instanceId);
    await sleep(timings.trapPreviewMs);
    context.setActiveAttackerId(attackDecision.attackerInstanceId);
  }
  if (opponentCounterTrap && shouldActivateReactiveTrap) {
    context.setRevealedEntities((previous) => addRevealedId(previous, opponentCounterTrap.instanceId));
    context.setActiveAttackerId(opponentCounterTrap.instanceId);
    context.setSelectedCard(opponentCounterTrap.card);
    await sleep(timings.trapPreviewMs);
    context.setActiveAttackerId(attackDecision.attackerInstanceId);
  }

  const nextState = context.applyTransition((state) =>
    GameEngine.executeAttack(state, opponentId, attackDecision.attackerInstanceId, attackDecision.defenderInstanceId, {
      skipReactivePlayerIds: shouldActivateReactiveTrap ? [] : [state.playerA.id],
      skipTrapEventTypes: shouldActivateReactiveTrap ? [] : ["ATTACK_DECLARED"],
    }),
  );
  await sleep(timings.postResolutionMs);
  if (shouldRevealTargetBeforeBattle && targetEntity) {
    context.setRevealedEntities((previous) => removeRevealedId(previous, targetEntity.instanceId));
  }
  if (reactiveTrap && shouldActivateReactiveTrap) context.setRevealedEntities((previous) => removeRevealedId(previous, reactiveTrap.instanceId));
  if (opponentCounterTrap && shouldActivateReactiveTrap) context.setRevealedEntities((previous) => removeRevealedId(previous, opponentCounterTrap.instanceId));
  context.setSelectedCard(null);
  context.setActiveAttackerId(null);
  context.setIsAnimating(false);

  if (nextState && nextState.activePlayerId === nextState.playerA.id) {
    context.clearSelection();
    context.clearError();
  }
  return true;
}
