import { IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ValidationError } from "@/core/errors/ValidationError";
import { resolveTrapTrigger } from "@/core/use-cases/game-engine/effects/resolve-trap-trigger";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function drawCards(player: IPlayer, amount: number): IPlayer {
  const drawAmount = Math.max(0, Math.min(amount, player.deck.length));
  if (drawAmount === 0) {
    return player;
  }

  return {
    ...player,
    hand: [...player.hand, ...player.deck.slice(0, drawAmount)],
    deck: player.deck.slice(drawAmount),
  };
}

export function resolveExecution(state: GameState, playerId: string, executionInstanceId: string): GameState {
  let withTrapResolution = state;
  const initialPair = getPlayerPair(state, playerId);
  withTrapResolution = resolveTrapTrigger(withTrapResolution, initialPair.opponent.id, "ON_OPPONENT_EXECUTION_ACTIVATED");
  const { player, opponent, isPlayerA } = getPlayerPair(withTrapResolution, playerId);

  const executionEntity = player.activeExecutions.find((entity) => entity.instanceId === executionInstanceId);

  if (!executionEntity) {
    throw new NotFoundError("La ejecución no existe en el tablero.");
  }

  if (!executionEntity.card.effect) {
    throw new GameRuleError("Esta carta no tiene un efecto programado.");
  }
  if (executionEntity.card.type !== "EXECUTION") {
    throw new ValidationError("Solo las ejecuciones activadas pueden resolverse con esta acción.");
  }

  const effect = executionEntity.card.effect;
  let updatedPlayer: IPlayer = player;
  let newOpponentHealth = opponent.healthPoints;
  let healApplied = 0;
  let buffedEntityIds: string[] = [];
  let buffStat: "ATTACK" | "DEFENSE" | null = null;
  let buffAmount = 0;

  switch (effect.action) {
    case "DAMAGE":
      if (effect.target === "OPPONENT") {
        newOpponentHealth = Math.max(0, opponent.healthPoints - effect.value);
      }
      if (effect.target === "PLAYER") {
        updatedPlayer = {
          ...updatedPlayer,
          healthPoints: Math.max(0, updatedPlayer.healthPoints - effect.value),
        };
      }
      break;
    case "HEAL":
      if (effect.target === "PLAYER") {
        const nextHealth = Math.min(updatedPlayer.maxHealthPoints, updatedPlayer.healthPoints + effect.value);
        healApplied = Math.max(0, nextHealth - updatedPlayer.healthPoints);
        updatedPlayer = {
          ...updatedPlayer,
          healthPoints: nextHealth,
        };
      }
      break;
    case "DRAW_CARD":
      updatedPlayer = drawCards(updatedPlayer, effect.cards);
      break;
    case "BOOST_ATTACK_ALLIED_ENTITY": {
      if (updatedPlayer.activeEntities.length === 0) {
        throw new GameRuleError("No tienes entidades en campo para aumentar ATK.");
      }
      const bestEntity = updatedPlayer.activeEntities.reduce<IPlayer["activeEntities"][number] | null>(
        (best, entity) => {
          if (!best) return entity;
          return (entity.card.attack ?? 0) > (best.card.attack ?? 0) ? entity : best;
        },
        null,
      );
      if (bestEntity) {
        buffedEntityIds = [bestEntity.instanceId];
        buffStat = "ATTACK";
        buffAmount = effect.value;
        updatedPlayer = {
          ...updatedPlayer,
          activeEntities: updatedPlayer.activeEntities.map((entity) =>
            entity.instanceId === bestEntity.instanceId
              ? { ...entity, card: { ...entity.card, attack: (entity.card.attack ?? 0) + effect.value } }
              : entity,
          ),
        };
      }
      break;
    }
    case "BOOST_DEFENSE_BY_ARCHETYPE":
      buffedEntityIds = updatedPlayer.activeEntities
        .filter((entity) => entity.card.archetype === effect.archetype)
        .map((entity) => entity.instanceId);
      if (buffedEntityIds.length === 0) {
        throw new GameRuleError(`No hay entidades ${effect.archetype} para aumentar DEF.`);
      }
      buffStat = "DEFENSE";
      buffAmount = effect.value;
      updatedPlayer = {
        ...updatedPlayer,
        activeEntities: updatedPlayer.activeEntities.map((entity) =>
          entity.card.archetype === effect.archetype
            ? { ...entity, card: { ...entity.card, defense: (entity.card.defense ?? 0) + effect.value } }
            : entity,
        ),
      };
      break;
    case "BOOST_ATTACK_BY_ARCHETYPE":
      buffedEntityIds = updatedPlayer.activeEntities
        .filter((entity) => entity.card.archetype === effect.archetype)
        .map((entity) => entity.instanceId);
      if (buffedEntityIds.length === 0) {
        throw new GameRuleError(`No hay entidades ${effect.archetype} para aumentar ATK.`);
      }
      buffStat = "ATTACK";
      buffAmount = effect.value;
      updatedPlayer = {
        ...updatedPlayer,
        activeEntities: updatedPlayer.activeEntities.map((entity) =>
          entity.card.archetype === effect.archetype
            ? { ...entity, card: { ...entity.card, attack: (entity.card.attack ?? 0) + effect.value } }
            : entity,
        ),
      };
      break;
    default:
      break;
  }

  updatedPlayer = {
    ...updatedPlayer,
    activeExecutions: updatedPlayer.activeExecutions.filter((entity) => entity.instanceId !== executionInstanceId),
    graveyard: [...updatedPlayer.graveyard, executionEntity.card],
  };

  const updatedOpponent: IPlayer = {
    ...opponent,
    healthPoints: newOpponentHealth,
  };

  const withPlayers = assignPlayers(withTrapResolution, updatedPlayer, updatedOpponent, isPlayerA);
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
  if (healApplied > 0) {
    withLog = appendCombatLogEvent(withLog, playerId, "HEAL_APPLIED", {
      targetPlayerId: player.id,
      amount: healApplied,
    });
  }
  if (buffStat && buffedEntityIds.length > 0) {
    withLog = appendCombatLogEvent(withLog, playerId, "STAT_BUFF_APPLIED", {
      ownerPlayerId: player.id,
      stat: buffStat,
      amount: buffAmount,
      targetEntityIds: buffedEntityIds,
    });
  }

  return withLog;
}
