// src/core/use-cases/game-engine/fusion/internal/append-fusion-from-execution-logs.ts - Registra eventos de cementerio e invocación para fusión iniciada por ejecución.
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { GameState } from "@/core/use-cases/game-engine/state/types";

interface IAppendFusionFromExecutionLogsParams {
  state: GameState;
  playerId: string;
  fusionCardId: string;
  executionCardId: string;
  materialCardIds: string[];
}

/**
 * Agrega logs de materiales enviados al cementerio, consumo de ejecución y resultado de fusión.
 */
export function appendFusionFromExecutionLogs(params: IAppendFusionFromExecutionLogsParams): GameState {
  let nextState = params.state;
  params.materialCardIds.forEach((cardId) => {
    nextState = appendCombatLogEvent(nextState, params.playerId, "CARD_TO_GRAVEYARD", {
      cardId,
      ownerPlayerId: params.playerId,
      from: "BATTLEFIELD",
      reason: "FUSION_MATERIAL",
    });
  });
  nextState = appendCombatLogEvent(nextState, params.playerId, "CARD_TO_GRAVEYARD", {
    cardId: params.executionCardId,
    ownerPlayerId: params.playerId,
    from: "EXECUTION_ZONE",
    reason: "FUSION_EXECUTION",
  });
  return appendCombatLogEvent(nextState, params.playerId, "FUSION_SUMMONED", {
    fusionCardId: params.fusionCardId,
    materialIds: params.materialCardIds,
    source: "EXECUTION",
  });
}
