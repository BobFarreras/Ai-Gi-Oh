import { BattleMode, IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function updateEntityModes(entities: IBoardEntity[], instanceId: string, newMode: BattleMode): IBoardEntity[] {
  return entities.map((entity) => (entity.instanceId === instanceId ? { ...entity, mode: newMode } : entity));
}

export function changeEntityMode(state: GameState, playerId: string, instanceId: string, newMode: BattleMode): GameState {
  const { player, opponent, isPlayerA } = getPlayerPair(state, playerId);

  const updatedPlayer: IPlayer = {
    ...player,
    activeEntities: updateEntityModes(player.activeEntities, instanceId, newMode),
    activeExecutions: updateEntityModes(player.activeExecutions, instanceId, newMode),
  };

  return {
    ...state,
    playerA: isPlayerA ? updatedPlayer : opponent,
    playerB: isPlayerA ? opponent : updatedPlayer,
  };
}
