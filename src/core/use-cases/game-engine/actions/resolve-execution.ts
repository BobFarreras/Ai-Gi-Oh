import { IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

export function resolveExecution(state: GameState, playerId: string, executionInstanceId: string): GameState {
  const { player, opponent, isPlayerA } = getPlayerPair(state, playerId);

  const executionEntity = player.activeExecutions.find((entity) => entity.instanceId === executionInstanceId);

  if (!executionEntity) {
    throw new NotFoundError("La ejecución no existe en el tablero.");
  }

  if (!executionEntity.card.effect) {
    throw new GameRuleError("Esta carta no tiene un efecto programado.");
  }

  const effect = executionEntity.card.effect;
  let newPlayerHealth = player.healthPoints;
  let newOpponentHealth = opponent.healthPoints;

  switch (effect.action) {
    case "DAMAGE":
      if (effect.target === "OPPONENT") {
        newOpponentHealth = Math.max(0, opponent.healthPoints - effect.value);
      }
      if (effect.target === "PLAYER") {
        newPlayerHealth = Math.max(0, player.healthPoints - effect.value);
      }
      break;
    case "HEAL":
      if (effect.target === "PLAYER") {
        newPlayerHealth = Math.min(player.maxHealthPoints, player.healthPoints + effect.value);
      }
      break;
    default:
      break;
  }

  const updatedPlayer: IPlayer = {
    ...player,
    healthPoints: newPlayerHealth,
    activeExecutions: player.activeExecutions.filter((entity) => entity.instanceId !== executionInstanceId),
    graveyard: [...player.graveyard, executionEntity.card],
  };

  const updatedOpponent: IPlayer = {
    ...opponent,
    healthPoints: newOpponentHealth,
  };

  const withPlayers = assignPlayers(state, updatedPlayer, updatedOpponent, isPlayerA);
  let withLog = appendCombatLogEvent(withPlayers, playerId, "CARD_TO_GRAVEYARD", {
    cardId: executionEntity.card.id,
    ownerPlayerId: playerId,
    from: "EXECUTION_ZONE",
  });
  if (effect.action === "DAMAGE") {
    withLog = appendCombatLogEvent(withLog, playerId, "DIRECT_DAMAGE", {
      targetPlayerId: effect.target === "OPPONENT" ? opponent.id : player.id,
      amount: effect.value,
    });
  }

  return withLog;
}
