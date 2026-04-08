// src/core/services/opponent/opponent-fusion-plan.ts - Planifica jugadas de preparación de fusión para el bot sin depender de dificultad.
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { IOpponentPlayDecision } from "@/core/services/opponent/types";
import { IPlayableCardDecision } from "@/core/services/opponent/select-opponent-play";
import { resolveFusionMaterialGaps } from "@/core/services/opponent/opponent-fusion-execution";
import { GameState } from "@/core/use-cases/GameEngine";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { getFusionRecipeByResultId } from "@/core/use-cases/game-engine/fusion/fusion-recipes";

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

function scoreEntitySacrifice(entity: IBoardEntity): number {
  return (entity.card.attack ?? 0) + (entity.card.defense ?? 0) + entity.card.cost * 100;
}

function isRecipeProtectedMaterial(entity: IBoardEntity, recipeId: string): boolean {
  const recipe = getFusionRecipeByResultId(recipeId);
  if (!recipe) return false;
  if (recipe.requiredMaterialIds?.includes(entity.card.id)) return true;
  return Boolean(entity.card.archetype && recipe.requiredArchetypes?.includes(entity.card.archetype));
}

function chooseEntityToReplace(opponent: IPlayer, recipeId: string): string | null {
  const removable = opponent.activeEntities.filter((entity) => !isRecipeProtectedMaterial(entity, recipeId));
  const candidates = removable.length > 0 ? removable : opponent.activeEntities;
  if (candidates.length === 0) return null;
  return candidates.reduce((worst, current) =>
    scoreEntitySacrifice(current) < scoreEntitySacrifice(worst) ? current : worst).instanceId;
}

/**
 * Prioriza jugadas de setup de materiales/ejecución para completar fusión en turnos siguientes.
 */
export function chooseFusionSetupPlay(state: GameState, opponent: IPlayer, playable: IPlayableCardDecision[]): IOpponentPlayDecision | null {
  const fusionExecutionDecisions = playable.filter((decision) =>
    decision.card.type === "EXECUTION" && decision.card.effect?.action === "FUSION_SUMMON");
  if (fusionExecutionDecisions.length === 0) return null;
  if (!state.hasNormalSummonedThisTurn) {
    for (const fusionExecution of fusionExecutionDecisions) {
      const recipeId = fusionExecution.card.effect?.action === "FUSION_SUMMON" ? fusionExecution.card.effect.recipeId : null;
      if (!recipeId) continue;
      const materialPlay = playable.find((decision) => matchesFusionMaterialGap(decision.card, recipeId, opponent));
      if (!materialPlay) continue;
      if (opponent.activeEntities.length < 3) return { cardId: materialPlay.card.id, mode: materialPlay.mode };
      const replaceEntityInstanceId = chooseEntityToReplace(opponent, recipeId);
      if (replaceEntityInstanceId) return { cardId: materialPlay.card.id, mode: materialPlay.mode, replaceEntityInstanceId };
    }
  }
  const setupExecution = findFusionExecutionSetupCard(playable);
  if (!setupExecution || opponent.activeExecutions.length >= 3) return null;
  return { cardId: setupExecution.card.id, mode: "SET" };
}
