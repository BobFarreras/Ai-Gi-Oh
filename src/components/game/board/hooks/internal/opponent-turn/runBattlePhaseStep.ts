// src/components/game/board/hooks/internal/opponent-turn/runBattlePhaseStep.ts - Ejecuta paso de batalla del oponente con timings y resolución de trampas.
import { GameEngine } from "@/core/use-cases/GameEngine";
import { addRevealedId, removeRevealedId, toTrapEligibleOptions } from "../trapPreview";
import { findReactiveTrap, findReactiveTraps } from "@/core/services/opponent/find-reactive-traps";
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
    if (nextState) context.emitCommittedAction?.(opponentId, { type: "NEXT_PHASE", payload: {} });
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
    const modeChangeDecision = context.strategy.chooseModeChange?.(gameState, opponentId);
    if (modeChangeDecision) {
      context.setIsAnimating(true);
      context.setActiveAttackerId(modeChangeDecision.instanceId);
      await sleep(Math.max(180, Math.trunc(timings.stepDelayMs * 0.6)));
      const nextState = context.applyTransition((state) =>
        GameEngine.changeEntityMode(state, opponentId, modeChangeDecision.instanceId, modeChangeDecision.newMode),
      );
      if (nextState) context.emitCommittedAction?.(opponentId, { type: "CHANGE_ENTITY_MODE", payload: modeChangeDecision });
      context.setIsAnimating(false);
      context.setActiveAttackerId(null);
      return true;
    }
    context.setIsAnimating(true);
    await sleep(500);
    const nextState = context.applyTransition((state) => GameEngine.nextPhase(state));
    if (nextState) context.emitCommittedAction?.(opponentId, { type: "NEXT_PHASE", payload: {} });
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
  // Ficha 4: si el humano tiene varias trampas elegibles, elige cuál activar en el carrusel.
  const reactiveTraps = findReactiveTraps(gameState, gameState.playerA.id, "ON_OPPONENT_ATTACK_DECLARED", {
    defenderInstanceId: attackDecision.defenderInstanceId,
  });
  const trapDecision = reactiveTraps.length > 0
    ? await context.requestTrapActivationDecision(toTrapEligibleOptions(reactiveTraps), "ON_OPPONENT_ATTACK_DECLARED")
    : { activate: false };
  const shouldActivateReactiveTrap = trapDecision.activate;
  const chosenTrapInstanceId = trapDecision.chosenTrapInstanceId;
  // Trampa a animar: la elegida (o la primera como respaldo para el revelado).
  const reactiveTrap = shouldActivateReactiveTrap
    ? reactiveTraps.find((entity) => entity.instanceId === chosenTrapInstanceId) ?? reactiveTraps[0] ?? null
    : reactiveTraps[0] ?? null;
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
      chosenTrapInstanceId: shouldActivateReactiveTrap ? chosenTrapInstanceId : undefined,
    }),
  );
  if (nextState) {
    context.emitCommittedAction?.(opponentId, {
      type: "ATTACK",
      payload: {
        attackerInstanceId: attackDecision.attackerInstanceId,
        defenderInstanceId: attackDecision.defenderInstanceId,
        declineReactiveTrap: !shouldActivateReactiveTrap || undefined,
        chosenTrapInstanceId: shouldActivateReactiveTrap ? chosenTrapInstanceId : undefined,
      },
    });
  }
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
