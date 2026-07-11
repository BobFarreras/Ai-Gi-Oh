// src/core/use-cases/game-engine/actions/internal/suspend-execution.ts - Deja una ejecución en SET (a la espera) cuando no se cumple su condición de resolución, para reactivarla en un turno posterior.
import { IPlayer } from "@/core/entities/IPlayer";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

/**
 * Deja la ejecución indicada en modo SET (a la espera) en vez de resolverla/consumirla, cuando todavía
 * no se cumple la condición para que haga algo (faltan materiales de fusión, no hay objetivo válido,
 * etc.). Así la carta no se desperdicia ni queda "rota" en ACTIVATE: puede reactivarse en otro turno.
 */
export function suspendExecutionInSet(
  state: GameState,
  playerId: string,
  executionInstanceId: string,
  waitType: string,
): GameState {
  const { player, opponent, isPlayerA } = getPlayerPair(state, playerId);
  const executionEntity = player.activeExecutions.find((entity) => entity.instanceId === executionInstanceId);
  if (!executionEntity) throw new NotFoundError("La ejecución no existe en el tablero.");
  const updatedPlayer: IPlayer = {
    ...player,
    activeExecutions: player.activeExecutions.map((entity) =>
      entity.instanceId === executionInstanceId ? { ...entity, mode: "SET" } : entity,
    ),
  };
  const withPlayers = assignPlayers(state, updatedPlayer, opponent, isPlayerA);
  return appendCombatLogEvent(withPlayers, playerId, "MANDATORY_ACTION_RESOLVED", {
    type: waitType,
    executionCardId: executionEntity.card.id,
  });
}
