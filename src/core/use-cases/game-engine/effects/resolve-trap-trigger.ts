import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { TrapTrigger } from "@/core/entities/ICard";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function findTriggeredTrap(player: IPlayer, trigger: TrapTrigger): IBoardEntity | null {
  return (
    player.activeExecutions.find(
      (entity) => entity.card.type === "TRAP" && entity.mode === "SET" && entity.card.trigger === trigger,
    ) ?? null
  );
}

interface ITrapTriggerContext {
  attackerPlayerId?: string;
  attackerInstanceId?: string;
}

interface ITrapResolutionResult {
  player: IPlayer;
  opponent: IPlayer;
  damage: number;
  destroyedOpponentEntityCardId: string | null;
}

function applyOpponentAttackReduction(opponent: IPlayer, value: number): IPlayer {
  return {
    ...opponent,
    activeEntities: opponent.activeEntities.map((entity) => ({
      ...entity,
      card: { ...entity.card, attack: Math.max(0, (entity.card.attack ?? 0) - value) },
    })),
  };
}

function applyOpponentDefenseReduction(opponent: IPlayer, value: number): IPlayer {
  return {
    ...opponent,
    activeEntities: opponent.activeEntities.map((entity) => ({
      ...entity,
      card: { ...entity.card, defense: Math.max(0, (entity.card.defense ?? 0) - value) },
    })),
  };
}

function destroyAttackerIfPresent(opponent: IPlayer, context?: ITrapTriggerContext): { opponent: IPlayer; cardId: string | null } {
  if (!context?.attackerPlayerId || !context.attackerInstanceId || context.attackerPlayerId !== opponent.id) {
    return { opponent, cardId: null };
  }

  const attacker = opponent.activeEntities.find((entity) => entity.instanceId === context.attackerInstanceId);
  if (!attacker) {
    return { opponent, cardId: null };
  }

  return {
    opponent: {
      ...opponent,
      activeEntities: opponent.activeEntities.filter((entity) => entity.instanceId !== context.attackerInstanceId),
      graveyard: [...opponent.graveyard, attacker.card],
    },
    cardId: attacker.card.id,
  };
}

function resolveTrapEffect(
  player: IPlayer,
  opponent: IPlayer,
  trap: IBoardEntity,
  context?: ITrapTriggerContext,
): ITrapResolutionResult {
  if (!trap.card.effect) {
    return { player, opponent, damage: 0, destroyedOpponentEntityCardId: null };
  }

  if (trap.card.effect.action === "DAMAGE") {
    if (trap.card.effect.target === "PLAYER") {
      return {
        player: { ...player, healthPoints: Math.max(0, player.healthPoints - trap.card.effect.value) },
        opponent,
        damage: trap.card.effect.value,
        destroyedOpponentEntityCardId: null,
      };
    }

    return {
      player,
      opponent: { ...opponent, healthPoints: Math.max(0, opponent.healthPoints - trap.card.effect.value) },
      damage: trap.card.effect.value,
      destroyedOpponentEntityCardId: null,
    };
  }

  if (trap.card.effect.action === "REDUCE_OPPONENT_ATTACK") {
    return {
      player,
      opponent: applyOpponentAttackReduction(opponent, trap.card.effect.value),
      damage: 0,
      destroyedOpponentEntityCardId: null,
    };
  }

  if (trap.card.effect.action === "REDUCE_OPPONENT_DEFENSE") {
    return {
      player,
      opponent: applyOpponentDefenseReduction(opponent, trap.card.effect.value),
      damage: 0,
      destroyedOpponentEntityCardId: null,
    };
  }

  if (trap.card.effect.action === "NEGATE_ATTACK_AND_DESTROY_ATTACKER") {
    const destroyed = destroyAttackerIfPresent(opponent, context);
    return {
      player,
      opponent: destroyed.opponent,
      damage: 0,
      destroyedOpponentEntityCardId: destroyed.cardId,
    };
  }

  return {
    player,
    opponent,
    damage: 0,
    destroyedOpponentEntityCardId: null,
  };
}

export function resolveTrapTrigger(
  state: GameState,
  reactivePlayerId: string,
  trigger: TrapTrigger,
  context?: ITrapTriggerContext,
): GameState {
  const { player, opponent, isPlayerA } = getPlayerPair(state, reactivePlayerId);
  const trap = findTriggeredTrap(player, trigger);
  if (!trap) {
    return state;
  }

  const playerAfterTrapUse: IPlayer = {
    ...player,
    activeExecutions: player.activeExecutions.filter((entity) => entity.instanceId !== trap.instanceId),
    graveyard: [...player.graveyard, trap.card],
  };

  const resolved = resolveTrapEffect(playerAfterTrapUse, opponent, trap, context);
  const baseState = assignPlayers(state, resolved.player, resolved.opponent, isPlayerA);

  let withLogs = appendCombatLogEvent(baseState, reactivePlayerId, "TRAP_TRIGGERED", {
    trapCardId: trap.card.id,
    trigger,
    effectAction: trap.card.effect?.action ?? null,
  });
  withLogs = appendCombatLogEvent(withLogs, reactivePlayerId, "CARD_TO_GRAVEYARD", {
    cardId: trap.card.id,
    ownerPlayerId: reactivePlayerId,
    from: "EXECUTION_ZONE",
  });

  if (resolved.damage > 0 && trap.card.effect?.action === "DAMAGE") {
    const targetPlayerId = trap.card.effect.target === "OPPONENT" ? opponent.id : player.id;
    withLogs = appendCombatLogEvent(withLogs, reactivePlayerId, "DIRECT_DAMAGE", {
      targetPlayerId,
      amount: resolved.damage,
    });
  }
  if (resolved.destroyedOpponentEntityCardId) {
    withLogs = appendCombatLogEvent(withLogs, reactivePlayerId, "CARD_TO_GRAVEYARD", {
      cardId: resolved.destroyedOpponentEntityCardId,
      ownerPlayerId: opponent.id,
      from: "BATTLEFIELD",
    });
  }

  return withLogs;
}
