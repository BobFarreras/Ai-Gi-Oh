// src/components/game/board/hooks/internal/opponent-turn/internal/run-opponent-execution.ts - Anima la resolución de una ejecución ya activada por el rival.
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";
import { OpponentIntent } from "@/core/services/opponent/resolve-opponent-intent";
import { buildOpponentIntentAction } from "@/core/services/opponent/build-opponent-intent-action";
import { sleep } from "../../sleep";
import { IOpponentStepTimings, IOpponentTurnContext } from "../types";
import { clearTrapsAfterResolution, markTrapsBeforeWindup, previewTrapsAfterWindup } from "./animate-trap-reveal";
import { emitPlayerTrapDecision } from "./emit-player-trap-decision";
import { resolvePlayerTrapChoice } from "./resolve-player-trap-choice";

type ExecutionIntent = Extract<OpponentIntent, { kind: "RESOLVE_EXECUTION" }>;

export async function runOpponentExecution(
  context: IOpponentTurnContext,
  timings: IOpponentStepTimings,
  intent: ExecutionIntent,
): Promise<void> {
  const opponentId = context.gameState.playerB.id;
  const resolved = await resolvePlayerTrapChoice(context, intent.playerTrapPrompt);
  emitPlayerTrapDecision(context, intent.playerTrapPrompt, resolved.choice);

  context.setIsAnimating(true);
  context.setActiveAttackerId(intent.instanceId);
  markTrapsBeforeWindup(context, resolved);
  await sleep(timings.stepDelayMs);
  await previewTrapsAfterWindup(context, timings, resolved, intent.instanceId);

  const action = buildOpponentIntentAction(intent, resolved.choice);
  const nextState = action
    ? context.applyTransition((state) => applyMatchAction(state, opponentId, action))
    : null;

  await sleep(timings.postResolutionMs);
  clearTrapsAfterResolution(context, resolved);
  context.setIsAnimating(false);
  if (nextState && nextState.activePlayerId === nextState.playerA.id) {
    context.clearSelection();
    context.clearError();
  }
}
