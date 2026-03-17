// src/core/use-cases/game-engine/fusion/internal/apply-fusion-from-execution-result.ts - Construye el nuevo estado del jugador al completar una fusión iniciada por ejecución.
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { ICard } from "@/core/entities/ICard";
import { defaultGameEngineIdFactory, IGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";

interface IApplyFusionFromExecutionParams {
  player: IPlayer;
  executionInstanceId: string;
  executionCard: ICard;
  fusionCard: ICard;
  materials: readonly IBoardEntity[];
  idFactory?: IGameEngineIdFactory;
}

/**
 * Aplica en el jugador la salida de fusión desde ejecución (campo, zona de ejecuciones y cementerio).
 */
export function applyFusionFromExecutionResult(params: IApplyFusionFromExecutionParams): IPlayer {
  const resolvedIdFactory = params.idFactory ?? defaultGameEngineIdFactory;
  const materialIds = params.materials.map((material) => material.instanceId);
  const remainingEntities = params.player.activeEntities.filter((entity) => !materialIds.includes(entity.instanceId));
  return {
    ...params.player,
    activeEntities: [
      ...remainingEntities,
      {
        instanceId: resolvedIdFactory.createFusionInstanceId(params.fusionCard.id),
        card: params.fusionCard,
        mode: "ATTACK",
        hasAttackedThisTurn: false,
        isNewlySummoned: true,
      },
    ],
    activeExecutions: params.player.activeExecutions.filter((entity) => entity.instanceId !== params.executionInstanceId),
    graveyard: [...params.player.graveyard, ...params.materials.map((material) => material.card), params.executionCard],
  };
}
