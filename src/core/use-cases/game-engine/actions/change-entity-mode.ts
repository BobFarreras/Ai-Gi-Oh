// src/core/use-cases/game-engine/actions/change-entity-mode.ts - Cambia el modo de una entidad o ejecución del jugador activo.
import { BattleMode, IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

/**
 * Reemplaza el modo de batalla para la instancia indicada dentro de una zona.
 * No valida reglas de juego; solo aplica transformación inmutable.
 */
function updateEntityModes(entities: IBoardEntity[], instanceId: string, newMode: BattleMode): IBoardEntity[] {
  return entities.map((entity) => {
    if (entity.instanceId !== instanceId) return entity;
    if (entity.modeLock && entity.modeLock !== newMode) return entity;
    return { ...entity, mode: newMode };
  });
}

/**
 * Cambia el modo de una instancia perteneciente al jugador y devuelve nuevo estado.
 * @param state Estado global actual de la partida.
 * @param playerId Identificador del jugador que solicita el cambio.
 * @param instanceId Instancia concreta en tablero que cambia de modo.
 * @param newMode Nuevo modo de batalla que se aplicará.
 */
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
