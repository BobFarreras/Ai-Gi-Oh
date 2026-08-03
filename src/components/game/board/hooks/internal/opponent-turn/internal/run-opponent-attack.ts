// src/components/game/board/hooks/internal/opponent-turn/internal/run-opponent-attack.ts - Anima el ataque ya decidido por el resolutor compartido.
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";
import { OpponentIntent } from "@/core/services/opponent/resolve-opponent-intent";
import { buildOpponentIntentAction } from "@/core/services/opponent/build-opponent-intent-action";
import { addRevealedId, removeRevealedId } from "../../trapPreview";
import { sleep } from "../../sleep";
import { IOpponentStepTimings, IOpponentTurnContext } from "../types";
import { clearTrapsAfterResolution, markTrapsBeforeWindup, previewTrapsAfterWindup } from "./animate-trap-reveal";
import { emitPlayerTrapDecision } from "./emit-player-trap-decision";
import { resolvePlayerTrapChoice } from "./resolve-player-trap-choice";

type AttackIntent = Extract<OpponentIntent, { kind: "ATTACK" }>;

export async function runOpponentAttack(
  context: IOpponentTurnContext,
  timings: IOpponentStepTimings,
  intent: AttackIntent,
): Promise<void> {
  const { gameState } = context;
  const opponentId = gameState.playerB.id;
  const { attackerInstanceId, defenderInstanceId } = intent.decision;
  context.setIsAnimating(true);
  context.setActiveAttackerId(attackerInstanceId);

  const targetEntity = defenderInstanceId
    ? gameState.playerA.activeEntities.find((entity) => entity.instanceId === defenderInstanceId) ?? null
    : null;
  const shouldRevealTarget = Boolean(targetEntity && targetEntity.mode === "SET");
  if (shouldRevealTarget && targetEntity) {
    context.setRevealedEntities((previous) => addRevealedId(previous, targetEntity.instanceId));
    await sleep(320);
  }

  const resolved = await resolvePlayerTrapChoice(context, intent.playerTrapPrompt);
  emitPlayerTrapDecision(context, intent.playerTrapPrompt, resolved.choice);
  markTrapsBeforeWindup(context, resolved);
  await sleep(timings.attackWindupMs);
  await previewTrapsAfterWindup(context, timings, resolved, attackerInstanceId);

  const action = buildOpponentIntentAction(intent, resolved.choice);
  const nextState = action
    ? context.applyTransition((state) => applyMatchAction(state, opponentId, action))
    : null;

  await sleep(timings.postResolutionMs);
  if (shouldRevealTarget && targetEntity) {
    context.setRevealedEntities((previous) => removeRevealedId(previous, targetEntity.instanceId));
  }
  clearTrapsAfterResolution(context, resolved);
  context.setIsAnimating(false);
  if (nextState && nextState.activePlayerId === nextState.playerA.id) {
    context.clearSelection();
    context.clearError();
  }
}
