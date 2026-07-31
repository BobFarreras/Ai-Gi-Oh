// src/components/game/board/hooks/internal/opponent-turn/internal/resolve-player-trap-choice.ts - Pregunta al humano por su trampa reactiva y resuelve las entities a animar.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { findReactiveTrap } from "@/core/services/opponent/find-reactive-traps";
import { IPlayerTrapChoice, IPlayerTrapPrompt } from "@/core/services/opponent/resolve-opponent-intent";
import { toTrapEligibleOptions } from "../../trapPreview";
import { IOpponentTurnContext } from "../types";

export interface IResolvedPlayerTrapChoice {
  choice: IPlayerTrapChoice;
  /** Trampa a previsualizar: la elegida, con la primera elegible como respaldo del revelado. */
  chosenTrap: IBoardEntity | null;
  counterTrap: IBoardEntity | null;
}

const DECLINED: IResolvedPlayerTrapChoice = {
  choice: { activate: false },
  chosenTrap: null,
  counterTrap: null,
};

/**
 * La decisión es del humano, así que se pregunta aquí y viaja al journal como acción suya; el rival
 * solo aporta el disparo que la provoca.
 */
export async function resolvePlayerTrapChoice(
  context: IOpponentTurnContext,
  prompt: IPlayerTrapPrompt | null,
): Promise<IResolvedPlayerTrapChoice> {
  if (!prompt) return DECLINED;
  const { gameState } = context;
  const eligibleTraps = prompt.eligibleTrapInstanceIds
    .map((instanceId) => gameState.playerA.activeExecutions.find((entity) => entity.instanceId === instanceId))
    .filter((entity): entity is IBoardEntity => Boolean(entity));
  if (eligibleTraps.length === 0) return DECLINED;
  const decision = await context.requestTrapActivationDecision(toTrapEligibleOptions(eligibleTraps), prompt.trigger);
  const chosenTrap = decision.activate
    ? eligibleTraps.find((entity) => entity.instanceId === decision.chosenTrapInstanceId) ?? eligibleTraps[0] ?? null
    : eligibleTraps[0] ?? null;
  return {
    choice: { activate: decision.activate, chosenTrapInstanceId: decision.chosenTrapInstanceId },
    chosenTrap,
    counterTrap: chosenTrap
      ? findReactiveTrap(gameState, gameState.playerB.id, "ON_OPPONENT_TRAP_ACTIVATED")
      : null,
  };
}
