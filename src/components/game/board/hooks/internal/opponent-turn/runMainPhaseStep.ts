// src/components/game/board/hooks/internal/opponent-turn/runMainPhaseStep.ts - Anima la fase principal del rival; qué juega lo decide el resolutor compartido.
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";
import { resolveOpponentIntent } from "@/core/services/opponent/resolve-opponent-intent";
import { buildOpponentIntentAction } from "@/core/services/opponent/build-opponent-intent-action";
import { IOpponentAutoPick } from "@/core/services/opponent/types";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { sleep } from "../sleep";
import { IOpponentStepTimings, IOpponentTurnContext } from "./types";
import { runOpponentExecution } from "./internal/run-opponent-execution";
import { runOpponentPlay } from "./internal/run-opponent-play";

function clearBoardIfTurnPassed(context: IOpponentTurnContext, nextState: ReturnType<IOpponentTurnContext["applyTransition"]>): void {
  if (nextState && nextState.activePlayerId === nextState.playerA.id) {
    context.clearSelection();
    context.clearError();
  }
}

async function applyOpponentAction(
  context: IOpponentTurnContext,
  intent: Parameters<typeof buildOpponentIntentAction>[0],
  delays: { before: number; after: number },
): Promise<void> {
  const opponentId = context.gameState.playerB.id;
  const action = buildOpponentIntentAction(intent);
  context.setIsAnimating(true);
  await sleep(delays.before);
  const nextState = action
    ? context.applyTransition((state) => applyMatchAction(state, opponentId, action))
    : null;
  await sleep(delays.after);
  context.setIsAnimating(false);
  clearBoardIfTurnPassed(context, nextState);
}

export async function runMainPhaseStep(
  context: IOpponentTurnContext,
  timings: IOpponentStepTimings,
  autoPick: IOpponentAutoPick,
): Promise<boolean> {
  const opponentId = context.gameState.playerB.id;
  const intent = resolveOpponentIntent({
    state: context.gameState,
    opponentId,
    strategy: context.strategy,
    autoPick,
  });

  switch (intent.kind) {
    case "CANCEL_PENDING_TURN_ACTION":
      // No viaja por el journal: el servidor la deriva igual al reproducir el turno rival.
      context.applyTransition((state) => GameEngine.cancelUnresolvablePendingTurnAction(state, opponentId));
      context.setIsAnimating(false);
      return true;
    case "RESOLVE_PENDING_TURN_ACTION":
      await applyOpponentAction(context, intent, { before: timings.stepDelayMs, after: timings.postResolutionMs });
      return true;
    case "RESOLVE_EXECUTION":
      await runOpponentExecution(context, timings, intent);
      return true;
    case "ACTIVATE_SET_EXECUTION":
      await applyOpponentAction(context, intent, { before: timings.stepDelayMs, after: 0 });
      return true;
    case "PLAY":
      await runOpponentPlay(context, timings, intent);
      return true;
    case "NEXT_PHASE":
      await applyOpponentAction(context, intent, { before: 500, after: 0 });
      return true;
    default:
      return true;
  }
}
