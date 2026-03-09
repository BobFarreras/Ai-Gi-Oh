// src/core/use-cases/game-engine/fusion/internal/append-fusion-logs.ts - Descripción breve del módulo.
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { GameState } from "@/core/use-cases/game-engine/state/types";

interface IAppendFusionLogsParams {
  state: GameState;
  playerId: string;
  fusionCardId: string;
  materialCardIds: [string, string];
  mode: "ATTACK" | "DEFENSE";
}

export function appendFusionLogs(params: IAppendFusionLogsParams): GameState {
  let nextState = params.state;
  for (const materialCardId of params.materialCardIds) {
    nextState = appendCombatLogEvent(nextState, params.playerId, "CARD_TO_GRAVEYARD", {
      cardId: materialCardId,
      ownerPlayerId: params.playerId,
      from: "BATTLEFIELD",
      reason: "FUSION_MATERIAL",
    });
  }
  return appendCombatLogEvent(nextState, params.playerId, "FUSION_SUMMONED", {
    fusionCardId: params.fusionCardId,
    materialIds: [...params.materialCardIds],
    mode: params.mode,
  });
}

