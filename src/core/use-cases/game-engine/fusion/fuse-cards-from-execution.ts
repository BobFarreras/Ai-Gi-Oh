// src/core/use-cases/game-engine/fusion/fuse-cards-from-execution.ts - Resuelve invocación de fusión disparada por una ejecución activa.
import { IPlayer } from "@/core/entities/IPlayer";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ValidationError } from "@/core/errors/ValidationError";
import { assertFusionCardInFusionDeck } from "@/core/use-cases/game-engine/fusion/internal/assert-fusion-card-in-fusion-deck";
import { findFusionCardById } from "@/core/use-cases/game-engine/fusion/internal/fusion-card-catalog";
import { getFusionRecipeByResultId } from "@/core/use-cases/game-engine/fusion/fusion-recipes";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assertMainPhaseActionAllowedForActivePlayer } from "@/core/use-cases/game-engine/state/action-flow-preconditions";
import { defaultGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";
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
  const materials = materialInstanceIds.map((instanceId) => {
    const entity = player.activeEntities.find((current) => current.instanceId === instanceId);
    if (!entity) throw new NotFoundError("Uno de los materiales no existe en tu campo.");
    return entity;
  });
  if (materialInstanceIds[0] === materialInstanceIds[1]) throw new ValidationError("Debes seleccionar 2 materiales distintos para fusionar.");
  validateMaterials(recipe, materials);
  const updatedPlayer = buildUpdatedPlayer(player, executionEntity.instanceId, fusionCard, materials, state.idFactory ?? defaultGameEngineIdFactory);
  const withPlayers = assignPlayers(state, updatedPlayer, opponent, isPlayerA);
  return appendFusionExecutionLogs(withPlayers, playerId, fusionCard.id, executionEntity.card.id, materials.map((material) => material.card.id));
}

function validateMaterials(recipe: NonNullable<ReturnType<typeof getFusionRecipeByResultId>>, materials: IPlayer["activeEntities"]): void {
  if (recipe.requiredMaterialIds) {
    const cardIds = materials.map((material) => material.card.id);
    const matches = recipe.requiredMaterialIds.every((requiredId) => cardIds.includes(requiredId));
    if (!matches) throw new ValidationError("Los materiales no cumplen la receta de fusión.");
  }
  if (recipe.requiredArchetypes) {
    const pending = [...recipe.requiredArchetypes];
    for (const material of materials) {
      const archetype = material.card.archetype;
      if (!archetype) continue;
      const index = pending.indexOf(archetype);
      if (index >= 0) pending.splice(index, 1);
    }
    if (pending.length > 0) throw new ValidationError("Los arquetipos de los materiales no cumplen la receta.");
  }
}

function buildUpdatedPlayer(
  player: IPlayer,
  executionInstanceId: string,
  fusionCard: ReturnType<typeof findFusionCardById> extends infer C ? Exclude<C, null> : never,
  materials: IPlayer["activeEntities"],
  idFactory: typeof defaultGameEngineIdFactory,
): IPlayer {
  const materialIds = materials.map((material) => material.instanceId);
  const remainingEntities = player.activeEntities.filter((entity) => !materialIds.includes(entity.instanceId));
  return {
    ...player,
    activeEntities: [
      ...remainingEntities,
      {
        instanceId: idFactory.createFusionInstanceId(fusionCard.id),
        card: fusionCard,
        mode: "ATTACK",
        hasAttackedThisTurn: false,
        isNewlySummoned: true,
      },
    ],
    activeExecutions: player.activeExecutions.filter((entity) => entity.instanceId !== executionInstanceId),
    graveyard: [...player.graveyard, ...materials.map((material) => material.card), player.activeExecutions.find((entity) => entity.instanceId === executionInstanceId)!.card],
  };
}

function appendFusionExecutionLogs(
  state: GameState,
  playerId: string,
  fusionCardId: string,
  executionCardId: string,
  materialCardIds: string[],
): GameState {
  let nextState = state;
  materialCardIds.forEach((cardId) => {
    nextState = appendCombatLogEvent(nextState, playerId, "CARD_TO_GRAVEYARD", {
      cardId,
      ownerPlayerId: playerId,
      from: "BATTLEFIELD",
      reason: "FUSION_MATERIAL",
    });
  });
  nextState = appendCombatLogEvent(nextState, playerId, "CARD_TO_GRAVEYARD", {
    cardId: executionCardId,
    ownerPlayerId: playerId,
    from: "EXECUTION_ZONE",
    reason: "FUSION_EXECUTION",
  });
  return appendCombatLogEvent(nextState, playerId, "FUSION_SUMMONED", {
    fusionCardId,
    materialIds: materialCardIds,
    source: "EXECUTION",
  });
}

