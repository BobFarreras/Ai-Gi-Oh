// src/components/game/board/hooks/internal/opponent-turn/internal/run-opponent-play.ts - Anima el despliegue de carta ya decidido por el resolutor compartido.
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";
import { OpponentIntent } from "@/core/services/opponent/resolve-opponent-intent";
import { buildOpponentIntentAction } from "@/core/services/opponent/build-opponent-intent-action";
import { sleep } from "../../sleep";
import { IOpponentStepTimings, IOpponentTurnContext } from "../types";

type PlayIntent = Extract<OpponentIntent, { kind: "PLAY" }>;

export async function runOpponentPlay(
  context: IOpponentTurnContext,
  timings: IOpponentStepTimings,
  intent: PlayIntent,
): Promise<void> {
  const opponentId = context.gameState.playerB.id;
  const action = buildOpponentIntentAction(intent);
  context.setIsAnimating(true);
  const nextState = action
    ? context.applyTransition((state) => applyMatchAction(state, opponentId, action))
    : null;

  // Una magia activada de inmediato se enfoca para que se lea antes de resolverse.
  const activatesExecution = !intent.decision.fusionMaterialInstanceIds && intent.decision.mode === "ACTIVATE";
  if (activatesExecution && nextState) {
    const activatedExecution = [...nextState.playerB.activeExecutions]
      .reverse()
      .find((entity) => entity.card.id === intent.decision.cardId);
    context.setActiveAttackerId(activatedExecution?.instanceId ?? null);
  }
  await sleep(timings.stepDelayMs);
  context.setActiveAttackerId(null);
  context.setIsAnimating(false);
}
