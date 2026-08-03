// src/components/game/board/hooks/internal/opponent-turn/internal/emit-player-trap-decision.ts - Envía al journal la única decisión humana del turno rival.
import { IPlayerTrapChoice, IPlayerTrapPrompt } from "@/core/services/opponent/resolve-opponent-intent";
import { IOpponentTurnContext } from "../types";

/**
 * El servidor deriva por sí mismo lo que juega el rival, así que del turno rival solo viaja al journal
 * lo que el servidor no puede saber: si el humano activó una trampa reactiva y cuál.
 */
export function emitPlayerTrapDecision(
  context: IOpponentTurnContext,
  prompt: IPlayerTrapPrompt | null,
  choice: IPlayerTrapChoice,
): void {
  if (!prompt) return;
  context.emitCommittedAction?.(context.gameState.playerA.id, {
    type: "RESOLVE_REACTIVE_TRAP",
    payload: { activate: choice.activate, chosenTrapInstanceId: choice.chosenTrapInstanceId },
  });
}
