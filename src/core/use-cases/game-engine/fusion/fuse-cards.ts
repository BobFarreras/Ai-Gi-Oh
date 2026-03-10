// src/core/use-cases/game-engine/fusion/fuse-cards.ts - Descripción breve del módulo.
import { BattleMode } from "@/core/entities/IPlayer";
import { applyFusionResult } from "@/core/use-cases/game-engine/fusion/internal/apply-fusion-result";
import { appendFusionLogs } from "@/core/use-cases/game-engine/fusion/internal/append-fusion-logs";
import { createFusionContext, validateFusionPreconditions } from "@/core/use-cases/game-engine/fusion/internal/validate-fusion-context";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

export function fuseCards(
  state: GameState,
  playerId: string,
  fusionCardId: string,
  materialInstanceIds: [string, string],
  mode: Extract<BattleMode, "ATTACK" | "DEFENSE">,
): GameState {
  validateFusionPreconditions(state, playerId, mode);
  const { player, opponent, isPlayerA } = getPlayerPair(state, playerId);
  const fusionContext = createFusionContext(player, opponent, fusionCardId, materialInstanceIds, mode);
  const fusionResolution = applyFusionResult(fusionContext);
  const nextState = assignPlayers(state, fusionResolution.updatedPlayer, opponent, isPlayerA);
  return appendFusionLogs({
    state: nextState,
    playerId,
    fusionCardId: fusionResolution.fusionCardId,
    materialCardIds: fusionResolution.materialCardIds,
    mode,
  });
}

