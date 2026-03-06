import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { ITrapResolutionResult, ITrapTriggerContext } from "@/core/use-cases/game-engine/effects/internal/trap-types";

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
  if (!attacker) return { opponent, cardId: null };
  return {
    opponent: {
      ...opponent,
      activeEntities: opponent.activeEntities.filter((entity) => entity.instanceId !== context.attackerInstanceId),
      graveyard: [...opponent.graveyard, attacker.card],
    },
    cardId: attacker.card.id,
  };
}

export function resolveTrapEffect(
  player: IPlayer,
  opponent: IPlayer,
  trap: IBoardEntity,
  context?: ITrapTriggerContext,
): ITrapResolutionResult {
  if (!trap.card.effect) return { player, opponent, damage: 0, destroyedOpponentEntityCardId: null };
  if (trap.card.effect.action === "DAMAGE") return resolveDamage(player, opponent, trap.card.effect.target, trap.card.effect.value);
  if (trap.card.effect.action === "REDUCE_OPPONENT_ATTACK") {
    return { player, opponent: applyOpponentAttackReduction(opponent, trap.card.effect.value), damage: 0, destroyedOpponentEntityCardId: null };
  }
  if (trap.card.effect.action === "REDUCE_OPPONENT_DEFENSE") {
    return { player, opponent: applyOpponentDefenseReduction(opponent, trap.card.effect.value), damage: 0, destroyedOpponentEntityCardId: null };
  }
  if (trap.card.effect.action === "NEGATE_ATTACK_AND_DESTROY_ATTACKER") {
    const destroyed = destroyAttackerIfPresent(opponent, context);
    return { player, opponent: destroyed.opponent, damage: 0, destroyedOpponentEntityCardId: destroyed.cardId };
  }
  return { player, opponent, damage: 0, destroyedOpponentEntityCardId: null };
}

function resolveDamage(
  player: IPlayer,
  opponent: IPlayer,
  target: "PLAYER" | "OPPONENT",
  value: number,
): ITrapResolutionResult {
  if (target === "PLAYER") {
    return {
      player: { ...player, healthPoints: Math.max(0, player.healthPoints - value) },
      opponent,
      damage: value,
      destroyedOpponentEntityCardId: null,
    };
  }
  return {
    player,
    opponent: { ...opponent, healthPoints: Math.max(0, opponent.healthPoints - value) },
    damage: value,
    destroyedOpponentEntityCardId: null,
  };
}
