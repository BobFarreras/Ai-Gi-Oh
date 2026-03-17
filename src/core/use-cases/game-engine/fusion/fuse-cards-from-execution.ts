// src/core/use-cases/game-engine/fusion/fuse-cards-from-execution.ts - Resuelve invocación de fusión disparada por una ejecución activa.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ValidationError } from "@/core/errors/ValidationError";
import { assertFusionCardInFusionDeck } from "@/core/use-cases/game-engine/fusion/internal/assert-fusion-card-in-fusion-deck";
import { findFusionCardById } from "@/core/use-cases/game-engine/fusion/internal/fusion-card-catalog";
import { appendFusionFromExecutionLogs } from "@/core/use-cases/game-engine/fusion/internal/append-fusion-from-execution-logs";
import { applyFusionFromExecutionResult } from "@/core/use-cases/game-engine/fusion/internal/apply-fusion-from-execution-result";
import { validateMaterialsAgainstRecipe } from "@/core/use-cases/game-engine/fusion/internal/validate-materials-against-recipe";
import { getFusionRecipeByResultId } from "@/core/use-cases/game-engine/fusion/fusion-recipes";
import { assertMainPhaseActionAllowedForActivePlayer } from "@/core/use-cases/game-engine/state/action-flow-preconditions";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

export function fuseCardsFromExecution(
  state: GameState,
  playerId: string,
  executionInstanceId: string,
  recipeId: string,
  materialInstanceIds: [string, string],
): GameState {
  assertMainPhaseActionAllowedForActivePlayer(state, playerId, {
    pendingActionMessage: "Debes resolver la acción obligatoria antes de fusionar.",
    phaseMessage: "Solo puedes fusionar en MAIN_1.",
  });
  const { player, opponent, isPlayerA } = getPlayerPair(state, playerId);
  assertFusionCardInFusionDeck(player, recipeId);
  const executionEntity = player.activeExecutions.find((entity) => entity.instanceId === executionInstanceId);
  if (!executionEntity) throw new NotFoundError("No existe la ejecución de fusión en tu zona de ejecuciones.");
  if (executionEntity.card.type !== "EXECUTION" || executionEntity.card.effect?.action !== "FUSION_SUMMON") {
    throw new ValidationError("La ejecución seleccionada no permite fusionar.");
  }
  const fusionCard = findFusionCardById(recipeId);
  if (!fusionCard) throw new NotFoundError("No existe carta de resultado para la receta de fusión.");
  const recipe = getFusionRecipeByResultId(recipeId);
  if (!recipe) throw new ValidationError("No existe receta de fusión para el resultado indicado.");
  if (materialInstanceIds[0] === materialInstanceIds[1]) throw new ValidationError("Debes seleccionar 2 materiales distintos para fusionar.");
  const materials = resolveFusionMaterials(player.activeEntities, materialInstanceIds);
  validateMaterialsAgainstRecipe(recipe, materials);
  const updatedPlayer = applyFusionFromExecutionResult({
    player,
    executionInstanceId: executionEntity.instanceId,
    executionCard: executionEntity.card,
    fusionCard,
    materials,
    idFactory: state.idFactory,
  });
  const withPlayers = assignPlayers(state, updatedPlayer, opponent, isPlayerA);
  return appendFusionFromExecutionLogs({
    state: withPlayers,
    playerId,
    fusionCardId: fusionCard.id,
    executionCardId: executionEntity.card.id,
    materialCardIds: materials.map((material) => material.card.id),
  });
}

function resolveFusionMaterials(
  activeEntities: readonly IBoardEntity[],
  materialInstanceIds: [string, string],
): [IBoardEntity, IBoardEntity] {
  return materialInstanceIds.map((instanceId) => {
    const entity = activeEntities.find((current) => current.instanceId === instanceId);
    if (!entity) throw new NotFoundError("Uno de los materiales no existe en tu campo.");
    return entity;
  }) as [IBoardEntity, IBoardEntity];
}

