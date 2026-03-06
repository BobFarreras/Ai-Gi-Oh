// src/components/game/board/hooks/internal/opponent-turn/runBattlePhaseStep.ts - Ejecuta paso de batalla del oponente con timings y resolución de trampas.
import { GameEngine } from "@/core/use-cases/GameEngine";
import { addRevealedId, findReactiveTrap, removeRevealedId } from "../trapPreview";
import { sleep } from "../sleep";
import { IOpponentStepTimings, IOpponentTurnContext } from "./types";

export async function runBattlePhaseStep(context: IOpponentTurnContext, timings: IOpponentStepTimings): Promise<boolean> {
  const { gameState } = context;
  const opponentId = gameState.playerB.id;
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
  if (reactiveTrap) {
    context.setRevealedEntities((previous) => addRevealedId(previous, reactiveTrap.instanceId));
  }

  await sleep(timings.attackWindupMs);
  if (reactiveTrap) {
    context.setActiveAttackerId(reactiveTrap.instanceId);
    await sleep(timings.trapPreviewMs);
    context.setActiveAttackerId(attackDecision.attackerInstanceId);
  }

  const nextState = context.applyTransition((state) =>
    GameEngine.executeAttack(state, opponentId, attackDecision.attackerInstanceId, attackDecision.defenderInstanceId),
  );
  await sleep(timings.postResolutionMs);
  if (shouldRevealTargetBeforeBattle && targetEntity) {
    context.setRevealedEntities((previous) => removeRevealedId(previous, targetEntity.instanceId));
  }
  if (reactiveTrap) context.setRevealedEntities((previous) => removeRevealedId(previous, reactiveTrap.instanceId));
  context.setActiveAttackerId(null);
  context.setIsAnimating(false);

  if (nextState && nextState.activePlayerId === nextState.playerA.id) {
    context.clearSelection();
    context.clearError();
  }
  return true;
}
