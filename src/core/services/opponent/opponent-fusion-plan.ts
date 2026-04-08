// src/core/services/opponent/opponent-fusion-plan.ts - Planifica jugadas de preparación de fusión para el bot sin depender de dificultad.
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { IOpponentPlayDecision } from "@/core/services/opponent/types";
import { IPlayableCardDecision } from "@/core/services/opponent/select-opponent-play";
import { resolveFusionMaterialGaps } from "@/core/services/opponent/opponent-fusion-execution";
import { GameState } from "@/core/use-cases/GameEngine";

function matchesFusionMaterialGap(card: ICard, recipeId: string, opponent: IPlayer): boolean {
  if (card.type !== "ENTITY") return false;
  const gaps = resolveFusionMaterialGaps(opponent, recipeId);
  if (gaps.missingCardIds.includes(card.id)) return true;
  return Boolean(card.archetype && gaps.missingArchetypes.includes(card.archetype));
}

function findFusionExecutionSetupCard(playable: IPlayableCardDecision[]): IPlayableCardDecision | null {
  return playable.find((decision) =>
    decision.card.type === "EXECUTION" &&
    decision.card.effect?.action === "FUSION_SUMMON" &&
    decision.mode === "SET") ?? null;
}

/**
 * Prioriza jugadas de setup de materiales/ejecución para completar fusión en turnos siguientes.
 */
export function chooseFusionSetupPlay(state: GameState, opponent: IPlayer, playable: IPlayableCardDecision[]): IOpponentPlayDecision | null {
  const fusionExecutionDecisions = playable.filter((decision) =>
    decision.card.type === "EXECUTION" && decision.card.effect?.action === "FUSION_SUMMON");
  if (fusionExecutionDecisions.length === 0) return null;
  if (!state.hasNormalSummonedThisTurn && opponent.activeEntities.length < 3) {
    for (const fusionExecution of fusionExecutionDecisions) {
      const recipeId = fusionExecution.card.effect?.action === "FUSION_SUMMON" ? fusionExecution.card.effect.recipeId : null;
      if (!recipeId) continue;
      const materialPlay = playable.find((decision) => matchesFusionMaterialGap(decision.card, recipeId, opponent));
      if (materialPlay) return { cardId: materialPlay.card.id, mode: materialPlay.mode };
    }
  }
  const setupExecution = findFusionExecutionSetupCard(playable);
  if (!setupExecution || opponent.activeExecutions.length >= 3) return null;
  return { cardId: setupExecution.card.id, mode: "SET" };
}
