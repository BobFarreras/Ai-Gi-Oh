// src/components/game/board/hooks/internal/opponent-turn/internal/animate-trap-reveal.ts - Coreografía compartida de revelado de trampas durante el turno rival.
import { addRevealedId, removeRevealedId } from "../../trapPreview";
import { sleep } from "../../sleep";
import { IOpponentStepTimings, IOpponentTurnContext } from "../types";
import { IResolvedPlayerTrapChoice } from "./resolve-player-trap-choice";

/** Solo se revela lo que el humano decidió activar; declinar no destapa su mano. */
function shouldReveal(resolved: IResolvedPlayerTrapChoice): boolean {
  return resolved.choice.activate && Boolean(resolved.chosenTrap);
}

export function markTrapsBeforeWindup(context: IOpponentTurnContext, resolved: IResolvedPlayerTrapChoice): void {
  if (!shouldReveal(resolved) || !resolved.chosenTrap) return;
  const trap = resolved.chosenTrap;
  context.setRevealedEntities((previous) => addRevealedId(previous, trap.instanceId));
  context.setSelectedCard(trap.card);
}

export async function previewTrapsAfterWindup(
  context: IOpponentTurnContext,
  timings: IOpponentStepTimings,
  resolved: IResolvedPlayerTrapChoice,
  focusInstanceId: string,
): Promise<void> {
  if (!shouldReveal(resolved)) return;
  if (resolved.chosenTrap) {
    context.setActiveAttackerId(resolved.chosenTrap.instanceId);
    await sleep(timings.trapPreviewMs);
    context.setActiveAttackerId(focusInstanceId);
  }
  if (resolved.counterTrap) {
    const counter = resolved.counterTrap;
    context.setRevealedEntities((previous) => addRevealedId(previous, counter.instanceId));
    context.setActiveAttackerId(counter.instanceId);
    context.setSelectedCard(counter.card);
    await sleep(timings.trapPreviewMs);
    context.setActiveAttackerId(focusInstanceId);
  }
}

export function clearTrapsAfterResolution(context: IOpponentTurnContext, resolved: IResolvedPlayerTrapChoice): void {
  if (shouldReveal(resolved)) {
    if (resolved.chosenTrap) {
      const trap = resolved.chosenTrap;
      context.setRevealedEntities((previous) => removeRevealedId(previous, trap.instanceId));
    }
    if (resolved.counterTrap) {
      const counter = resolved.counterTrap;
      context.setRevealedEntities((previous) => removeRevealedId(previous, counter.instanceId));
    }
  }
  context.setSelectedCard(null);
  context.setActiveAttackerId(null);
}
