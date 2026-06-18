// src/core/use-cases/game-engine/fusion/internal/apply-fusion-result.ts - Aplica el resultado de la fusión sobre el estado del jugador y sus zonas.
import { IResolvedFusionState, IFusionContext } from "@/core/use-cases/game-engine/fusion/internal/fusion-types";
import { defaultGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";

export function applyFusionResult(context: IFusionContext): IResolvedFusionState {
  const idFactory = context.idFactory ?? defaultGameEngineIdFactory;
  const materialInstanceIds = context.materials.map((material) => material.instanceId);
  const remainingEntities = context.player.activeEntities.filter((entity) => !materialInstanceIds.includes(entity.instanceId));
  const fusionEntity = {
    // Clave determinista a partir de la carta + materiales (instanceIds ya
    // deterministas), para que el ente fusionado tenga el MISMO instanceId en
    // ambos clientes y futuras acciones (ataques, etc.) resuelvan en los dos.
    instanceId: idFactory.createFusionInstanceId(`${context.fusionCard.id}:${materialInstanceIds.join(":")}`),
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
