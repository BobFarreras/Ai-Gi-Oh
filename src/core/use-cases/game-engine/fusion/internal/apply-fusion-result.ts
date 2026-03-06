// src/core/use-cases/game-engine/fusion/internal/apply-fusion-result.ts - Aplica el resultado de la fusión sobre el estado del jugador y sus zonas.
import { IResolvedFusionState, IFusionContext } from "@/core/use-cases/game-engine/fusion/internal/fusion-types";

function createFusionInstanceId(cardId: string): string {
  return `${cardId}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function applyFusionResult(context: IFusionContext): IResolvedFusionState {
  const materialInstanceIds = context.materials.map((material) => material.instanceId);
  const remainingEntities = context.player.activeEntities.filter((entity) => !materialInstanceIds.includes(entity.instanceId));
  const fusionEntity = {
    instanceId: createFusionInstanceId(context.fusionCard.id),
    card: context.fusionCard,
    mode: context.mode,
    hasAttackedThisTurn: false,
    isNewlySummoned: true,
  };
  const fusionEnergyCost = context.fusionCard.fusionEnergyRequirement ?? context.recipe.requiredTotalEnergy ?? context.fusionCard.cost;
  const fusionRuntimeId = context.fusionCard.runtimeId ?? null;
  return {
    fusionCardId: context.fusionCard.id,
    materialCardIds: [context.materials[0].card.id, context.materials[1].card.id],
    updatedPlayer: {
      ...context.player,
      currentEnergy: Math.max(0, context.player.currentEnergy - fusionEnergyCost),
      hand: context.player.hand.filter((card) => {
        if (fusionRuntimeId) return card.runtimeId !== fusionRuntimeId;
        return card.id !== context.fusionCard.id;
      }),
      activeEntities: [...remainingEntities, fusionEntity],
      graveyard: [...context.player.graveyard, ...context.materials.map((material) => material.card)],
    },
  };
}
