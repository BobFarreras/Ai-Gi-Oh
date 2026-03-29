// src/core/use-cases/game-engine/effects/internal/trap-effect-registry.ts - Registro de handlers de efectos TRAP para extensión modular sin switchs globales.
import { ICardEffect } from "@/core/entities/ICard";
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { ITrapResolutionResult, ITrapTriggerContext } from "@/core/use-cases/game-engine/effects/internal/trap-types";

type TrapAction =
  | "DAMAGE"
  | "REDUCE_OPPONENT_ATTACK"
  | "REDUCE_OPPONENT_DEFENSE"
  | "NEGATE_ATTACK_AND_DESTROY_ATTACKER"
  | "COPY_OPPONENT_BUFF_TO_ALLIED_ENTITIES"
  | "FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED"
  | "DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN";
type TrapEffect = Extract<ICardEffect, { action: TrapAction }>;
type TrapHandler<K extends TrapAction> = (player: IPlayer, opponent: IPlayer, trap: IBoardEntity, effect: Extract<TrapEffect, { action: K }>, context?: ITrapTriggerContext) => ITrapResolutionResult;

function createNeutralResult(player: IPlayer, opponent: IPlayer): ITrapResolutionResult {
  return { player, opponent, damage: 0, destroyedOpponentEntityCardId: null, destroyedOpponentEntityDestination: null };
}

function reduceOpponentStat(opponent: IPlayer, stat: "attack" | "defense", value: number): IPlayer {
  return {
    ...opponent,
    activeEntities: opponent.activeEntities.map((entity) => ({
      ...entity,
      card: { ...entity.card, [stat]: Math.max(0, (entity.card[stat] ?? 0) - value) },
    })),
  };
}

function applyBuffToAlliedEntities(player: IPlayer, stat: "ATTACK" | "DEFENSE", value: number): IPlayer {
  const normalizedValue = Math.max(0, value);
  if (normalizedValue === 0) return player;
  if (stat === "ATTACK") {
    return {
      ...player,
      activeEntities: player.activeEntities.map((entity) => ({
        ...entity,
        card: { ...entity.card, attack: Math.max(0, (entity.card.attack ?? 0) + normalizedValue) },
      })),
    };
  }
  return {
    ...player,
    activeEntities: player.activeEntities.map((entity) => ({
      ...entity,
      card: { ...entity.card, defense: Math.max(0, (entity.card.defense ?? 0) + normalizedValue) },
    })),
  };
}

function forceSummonedDefenseToAttackLocked(opponent: IPlayer, context?: ITrapTriggerContext): IPlayer {
  if (!context?.summonedPlayerId || !context.summonedInstanceId || context.summonedPlayerId !== opponent.id) return opponent;
  return {
    ...opponent,
    activeEntities: opponent.activeEntities.map((entity) => (
      entity.instanceId === context.summonedInstanceId
        ? { ...entity, mode: "ATTACK", modeLock: "ATTACK" }
        : entity
    )),
  };
}

function destroyAttackerIfPresent(opponent: IPlayer, context?: ITrapTriggerContext): { opponent: IPlayer; cardId: string | null } {
  if (!context?.attackerPlayerId || !context.attackerInstanceId || context.attackerPlayerId !== opponent.id) return { opponent, cardId: null };
  const attacker = opponent.activeEntities.find((entity) => entity.instanceId === context.attackerInstanceId);
  if (!attacker) return { opponent, cardId: null };
  return {
    opponent: {
      ...opponent,
      activeEntities: opponent.activeEntities.filter((entity) => entity.instanceId !== context.attackerInstanceId),
      destroyedPile: [...(opponent.destroyedPile ?? []), attacker.card],
    },
    cardId: attacker.card.id,
  };
}

const trapEffectHandlers: { [K in TrapAction]: TrapHandler<K> } = {
  DAMAGE: (player, opponent, _trap, effect) => effect.target === "PLAYER"
    ? { ...createNeutralResult({ ...player, healthPoints: Math.max(0, player.healthPoints - effect.value) }, opponent), damage: effect.value }
    : { ...createNeutralResult(player, { ...opponent, healthPoints: Math.max(0, opponent.healthPoints - effect.value) }), damage: effect.value },
  REDUCE_OPPONENT_ATTACK: (player, opponent, _trap, effect) => createNeutralResult(player, reduceOpponentStat(opponent, "attack", effect.value)),
  REDUCE_OPPONENT_DEFENSE: (player, opponent, _trap, effect) => createNeutralResult(player, reduceOpponentStat(opponent, "defense", effect.value)),
  NEGATE_ATTACK_AND_DESTROY_ATTACKER: (player, opponent, _trap, _effect, context) => {
    const destroyed = destroyAttackerIfPresent(opponent, context);
    return { ...createNeutralResult(player, destroyed.opponent), destroyedOpponentEntityCardId: destroyed.cardId, destroyedOpponentEntityDestination: destroyed.cardId ? "DESTROYED" : null };
  },
  COPY_OPPONENT_BUFF_TO_ALLIED_ENTITIES: (player, opponent, _trap, _effect, context) => {
    if (!context?.buffSourcePlayerId || context.buffSourcePlayerId !== opponent.id) return createNeutralResult(player, opponent);
    if (!context.buffStat || typeof context.buffAmount !== "number") return createNeutralResult(player, opponent);
    return createNeutralResult(applyBuffToAlliedEntities(player, context.buffStat, context.buffAmount), opponent);
  },
  FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED: (player, opponent, _trap, _effect, context) => createNeutralResult(player, forceSummonedDefenseToAttackLocked(opponent, context)),
  DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN: (player, opponent, _trap, _effect, context) => {
    if (!context?.attackerPlayerId || context.attackerPlayerId !== opponent.id) return createNeutralResult(player, opponent);
    return createNeutralResult(
      { ...player, maxEnergy: Math.max(player.maxEnergy, 10), currentEnergy: 10 },
      { ...opponent, currentEnergy: 0 },
    );
  },
};

/** Resuelve una trampa registrada; devuelve null cuando la acción no está soportada por el registry. */
export function resolveTrapEffectFromRegistry(player: IPlayer, opponent: IPlayer, trap: IBoardEntity, context?: ITrapTriggerContext): ITrapResolutionResult | null {
  if (!trap.card.effect) return createNeutralResult(player, opponent);
  if (trap.card.effect.action === "DAMAGE") return trapEffectHandlers.DAMAGE(player, opponent, trap, trap.card.effect, context);
  if (trap.card.effect.action === "REDUCE_OPPONENT_ATTACK") return trapEffectHandlers.REDUCE_OPPONENT_ATTACK(player, opponent, trap, trap.card.effect, context);
  if (trap.card.effect.action === "REDUCE_OPPONENT_DEFENSE") return trapEffectHandlers.REDUCE_OPPONENT_DEFENSE(player, opponent, trap, trap.card.effect, context);
  if (trap.card.effect.action === "NEGATE_ATTACK_AND_DESTROY_ATTACKER") return trapEffectHandlers.NEGATE_ATTACK_AND_DESTROY_ATTACKER(player, opponent, trap, trap.card.effect, context);
  if (trap.card.effect.action === "COPY_OPPONENT_BUFF_TO_ALLIED_ENTITIES") return trapEffectHandlers.COPY_OPPONENT_BUFF_TO_ALLIED_ENTITIES(player, opponent, trap, trap.card.effect, context);
  if (trap.card.effect.action === "FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED") return trapEffectHandlers.FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED(player, opponent, trap, trap.card.effect, context);
  if (trap.card.effect.action === "DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN") return trapEffectHandlers.DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN(player, opponent, trap, trap.card.effect, context);
  return null;
}

export function getRegisteredTrapActions(): ReadonlyArray<TrapAction> {
  return Object.keys(trapEffectHandlers) as TrapAction[];
}
