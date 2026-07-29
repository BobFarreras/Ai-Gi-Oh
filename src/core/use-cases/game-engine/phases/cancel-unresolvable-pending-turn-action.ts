// src/core/use-cases/game-engine/phases/cancel-unresolvable-pending-turn-action.ts - Recupera turnos automáticos sin candidatos válidos.
import { IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState, IPendingTurnAction } from "@/core/use-cases/game-engine/state/types";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";

function executionInstanceId(pending: IPendingTurnAction): string | null {
  if (pending.type === "SELECT_FUSION_MATERIALS") {
    return pending.fusionFromExecutionInstanceId ?? null;
  }
  return "executionInstanceId" in pending ? pending.executionInstanceId : null;
}

function recoverPlayer(player: IPlayer, pending: IPendingTurnAction): IPlayer {
  const instanceId = executionInstanceId(pending);
  if (!instanceId) return player;
  const execution = player.activeExecutions.find((entity) => entity.instanceId === instanceId);
  if (!execution) return player;

  // Una fusión sin pareja vuelve a SET para reintentarse; el resto de ejecuciones sin objetivo se consumen.
  if (pending.type === "SELECT_FUSION_MATERIALS") {
    return {
      ...player,
      activeExecutions: player.activeExecutions.map((entity) =>
        entity.instanceId === instanceId ? { ...entity, mode: "SET" as const } : entity),
    };
  }
  return {
    ...player,
    activeExecutions: player.activeExecutions.filter((entity) => entity.instanceId !== instanceId),
    graveyard: [...player.graveyard, execution.card],
  };
}

/**
 * Cancela una selección automática imposible para que el combate no repita el mismo estado indefinidamente.
 */
export function cancelUnresolvablePendingTurnAction(state: GameState, playerId: string): GameState {
  const pending = state.pendingTurnAction;
  if (!pending) throw new GameRuleError("No hay acción obligatoria pendiente.");
  if (pending.playerId !== playerId || state.activePlayerId !== playerId) {
    throw new GameRuleError("Solo el jugador activo puede cancelar una acción automática imposible.");
  }
  const { player, opponent, isPlayerA } = getPlayerPair(state, playerId);
  const recoveredState = assignPlayers(state, recoverPlayer(player, pending), opponent, isPlayerA);
  return appendCombatLogEvent(
    { ...recoveredState, pendingTurnAction: null },
    playerId,
    "MANDATORY_ACTION_RESOLVED",
    { pendingType: pending.type, resolution: "AUTO_CANCELLED_NO_CANDIDATES" },
  );
}
