import { BattleMode, IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ValidationError } from "@/core/errors/ValidationError";
import { getFusionRecipe } from "@/core/use-cases/game-engine/fusion/fusion-recipes";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function validateRecipe(player: IPlayer, materialIds: string[], fusionCardId: string): void {
  const fusionCard = player.hand.find((card) => card.id === fusionCardId);
  if (!fusionCard) {
    throw new NotFoundError("La carta de fusión no está en la mano.");
  }

  if (fusionCard.type !== "FUSION") {
    throw new ValidationError("La carta seleccionada no es de tipo fusión.");
  }

  if (materialIds.length !== 2) {
    throw new ValidationError("Debes seleccionar exactamente 2 materiales para fusionar.");
  }

  const materials = materialIds.map((instanceId) => {
    const entity = player.activeEntities.find((current) => current.instanceId === instanceId);
    if (!entity) {
      throw new NotFoundError("Uno de los materiales no existe en tu campo.");
    }
    return entity;
  });

  const recipe = getFusionRecipe(fusionCard);
  if (!recipe) {
    throw new ValidationError("La carta de fusión no tiene receta válida.");
  }

  if (recipe.requiredMaterialIds) {
    const cardIds = materials.map((material) => material.card.id);
    const matches = recipe.requiredMaterialIds.every((id) => cardIds.includes(id));
    if (!matches) {
      throw new ValidationError("Los materiales no cumplen la receta de fusión.");
    }
  }

  if (recipe.requiredArchetypes) {
    const pending = [...recipe.requiredArchetypes];
    for (const material of materials) {
      const archetype = material.card.archetype;
      if (!archetype) {
        continue;
      }
      const index = pending.indexOf(archetype);
      if (index >= 0) {
        pending.splice(index, 1);
      }
    }
    if (pending.length > 0) {
      throw new ValidationError("Los arquetipos de los materiales no cumplen la receta.");
    }
  }

  if (recipe.requiredEnergyPerMaterial) {
    const fails = materials.some((material) => material.card.cost < recipe.requiredEnergyPerMaterial!);
    if (fails) {
      throw new ValidationError("Uno de los materiales no alcanza la energía mínima requerida.");
    }
  }

  if (recipe.requiredTotalEnergy) {
    const totalEnergy = materials.reduce((sum, material) => sum + material.card.cost, 0);
    if (totalEnergy < recipe.requiredTotalEnergy) {
      throw new ValidationError("La energía total de materiales no alcanza la receta.");
    }
  }
}

export function fuseCards(
  state: GameState,
  playerId: string,
  fusionCardId: string,
  materialInstanceIds: [string, string],
  mode: Extract<BattleMode, "ATTACK" | "DEFENSE">,
): GameState {
  if (state.pendingTurnAction) {
    throw new GameRuleError("Debes resolver la acción obligatoria antes de fusionar.");
  }

  if (state.activePlayerId !== playerId) {
    throw new GameRuleError("No es tu turno.");
  }

  if (state.phase !== "MAIN_1") {
    throw new GameRuleError("Solo puedes fusionar en MAIN_1.");
  }

  if (mode !== "ATTACK" && mode !== "DEFENSE") {
    throw new ValidationError("Modo inválido para invocación por fusión.");
  }

  const { player, opponent, isPlayerA } = getPlayerPair(state, playerId);
  validateRecipe(player, materialInstanceIds, fusionCardId);
  const fusionCard = player.hand.find((card) => card.id === fusionCardId)!;

  const materials = materialInstanceIds.map((instanceId) => player.activeEntities.find((entity) => entity.instanceId === instanceId)!);
  const remainingEntities = player.activeEntities.filter((entity) => !materialInstanceIds.includes(entity.instanceId));
  const fusionEntity = {
    instanceId: `${fusionCard.id}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    card: fusionCard,
    mode,
    hasAttackedThisTurn: false,
    isNewlySummoned: true,
  };

  const updatedPlayer: IPlayer = {
    ...player,
    hand: player.hand.filter((card) => card.id !== fusionCardId),
    activeEntities: [...remainingEntities, fusionEntity],
    graveyard: [...player.graveyard, ...materials.map((material) => material.card)],
  };

  let nextState = assignPlayers(state, updatedPlayer, opponent, isPlayerA);
  for (const material of materials) {
    nextState = appendCombatLogEvent(nextState, playerId, "CARD_TO_GRAVEYARD", {
      cardId: material.card.id,
      ownerPlayerId: playerId,
      from: "BATTLEFIELD",
      reason: "FUSION_MATERIAL",
    });
  }

  return appendCombatLogEvent(nextState, playerId, "FUSION_SUMMONED", {
    fusionCardId: fusionCard.id,
    materialIds: materials.map((material) => material.card.id),
    mode,
  });
}
