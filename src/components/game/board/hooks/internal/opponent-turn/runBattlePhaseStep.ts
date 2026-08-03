// src/components/game/board/hooks/internal/opponent-turn/runBattlePhaseStep.ts - Anima la fase de batalla del rival; qué juega lo decide el resolutor compartido.
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";
import { opponentAutoPick } from "@/core/services/opponent/opponent-auto-pick";
import { resolveOpponentIntent } from "@/core/services/opponent/resolve-opponent-intent";
import { buildOpponentIntentAction } from "@/core/services/opponent/build-opponent-intent-action";
import { sleep } from "../sleep";
import { IOpponentStepTimings, IOpponentTurnContext } from "./types";
import { runOpponentAttack } from "./internal/run-opponent-attack";

function isFirstTurnBattleBlocked(gameState: IOpponentTurnContext["gameState"], opponentId: string): boolean {
  return gameState.turn === 1 && gameState.startingPlayerId === opponentId;
}

async function advancePhase(context: IOpponentTurnContext, delayMs: number): Promise<void> {
  const opponentId = context.gameState.playerB.id;
  context.setIsAnimating(true);
  await sleep(delayMs);
  const nextState = context.applyTransition((state) =>
    applyMatchAction(state, opponentId, { type: "NEXT_PHASE", payload: {} }),
  );
  context.setIsAnimating(false);
  context.setActiveAttackerId(null);
  if (nextState && nextState.activePlayerId === nextState.playerA.id) {
    context.clearSelection();
    context.clearError();
  }
}

export async function runBattlePhaseStep(
  context: IOpponentTurnContext,
  timings: IOpponentStepTimings,
): Promise<boolean> {
  const { gameState } = context;
  const opponentId = gameState.playerB.id;
  const intent = resolveOpponentIntent({
    state: gameState,
    opponentId,
    strategy: context.strategy,
    autoPick: opponentAutoPick,
  });

  if (intent.kind === "ATTACK") {
    await runOpponentAttack(context, timings, intent);
    return true;
  }

  if (intent.kind === "CHANGE_ENTITY_MODE") {
    const action = buildOpponentIntentAction(intent);
    context.setIsAnimating(true);
    context.setActiveAttackerId(intent.decision.instanceId);
    await sleep(Math.max(180, Math.trunc(timings.stepDelayMs * 0.6)));
    if (action) context.applyTransition((state) => applyMatchAction(state, opponentId, action));
    context.setIsAnimating(false);
    context.setActiveAttackerId(null);
    return true;
  }

  // El bloqueo de primer turno solo cambia el ritmo de la animación, no la decisión.
  await advancePhase(context, isFirstTurnBattleBlocked(gameState, opponentId) ? 280 : 500);
  return true;
}
