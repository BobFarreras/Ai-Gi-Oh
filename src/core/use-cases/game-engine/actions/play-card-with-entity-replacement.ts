// src/core/use-cases/game-engine/actions/play-card-with-entity-replacement.ts - Permite invocar una entidad reemplazando otra del campo cuando la zona está llena.
import { BattleMode } from "@/core/entities/IPlayer";
import { playCardWithZoneReplacement } from "@/core/use-cases/game-engine/actions/play-card-with-zone-replacement";
import { GameState } from "@/core/use-cases/game-engine/state/types";

export function playCardWithEntityReplacement(
  state: GameState,
  playerId: string,
  cardId: string,
  mode: BattleMode,
  sacrificedEntityInstanceId: string,
): GameState {
  return playCardWithZoneReplacement(state, playerId, cardId, mode, sacrificedEntityInstanceId, "ENTITIES");
}

