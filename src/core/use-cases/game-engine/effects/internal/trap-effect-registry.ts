// src/core/use-cases/game-engine/effects/internal/trap-effect-registry.ts - Registro de handlers de efectos TRAP para extensión modular sin switchs globales.
import { ICardEffect } from "@/core/entities/ICard";
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { ITrapResolutionResult, ITrapTriggerContext } from "@/core/use-cases/game-engine/effects/internal/trap-types";

type TrapAction = "DAMAGE" | "REDUCE_OPPONENT_ATTACK" | "REDUCE_OPPONENT_DEFENSE" | "NEGATE_ATTACK_AND_DESTROY_ATTACKER" | "COPY_OPPONENT_BUFF_TO_ALLIED_ENTITIES" | "FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED" | "DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN";
type TrapEffect = Extract<ICardEffect, { action: TrapAction }>;
type TrapHandler<K extends TrapAction> = (player: IPlayer, opponent: IPlayer, trap: IBoardEntity, effect: Extract<TrapEffect, { action: K }>, context?: ITrapTriggerContext) => ITrapResolutionResult;

function createNeutralResult(player: IPlayer, opponent: IPlayer): ITrapResolutionResult {
  return {
    player,
    opponent,
    damage: 0,
    energyLostTargetPlayerId: null,
    energyLostAmount: 0,
    energyGainTargetPlayerId: null,
    energyGainAmount: 0,
    buffTargetEntityIds: [],
    buffStat: null,
    buffAmount: 0,
    blockedTargetEntityInstanceId: null,
    destroyedOpponentEntityCardId: null,
    destroyedOpponentEntityInstanceId: null,
    destroyedOpponentEntitySlotIndex: null,
    destroyedOpponentEntityDestination: null,
  };
}

function reduceOpponentStat(opponent: IPlayer, stat: "attack" | "defense", value: number): { opponent: IPlayer; targetIds: string[] } {
  const targetIds = opponent.activeEntities.map((entity) => entity.instanceId);
  return { opponent: { ...opponent, activeEntities: opponent.activeEntities.map((entity) => ({ ...entity, card: { ...entity.card, [stat]: Math.max(0, (entity.card[stat] ?? 0) - value) } })) }, targetIds };
}

function applyBuffToAlliedEntities(player: IPlayer, stat: "ATTACK" | "DEFENSE", value: number): { player: IPlayer; targetIds: string[] } {
  const normalizedValue = Math.max(0, value);
  if (normalizedValue === 0) return { player, targetIds: [] };
  const targetIds = player.activeEntities.map((entity) => entity.instanceId);
  if (stat === "ATTACK") return { player: { ...player, activeEntities: player.activeEntities.map((entity) => ({ ...entity, card: { ...entity.card, attack: Math.max(0, (entity.card.attack ?? 0) + normalizedValue) } })) }, targetIds };
  return { player: { ...player, activeEntities: player.activeEntities.map((entity) => ({ ...entity, card: { ...entity.card, defense: Math.max(0, (entity.card.defense ?? 0) + normalizedValue) } })) }, targetIds };
}

function forceSummonedDefenseToAttackLocked(opponent: IPlayer, context?: ITrapTriggerContext): IPlayer {
  if (!context?.summonedPlayerId || !context.summonedInstanceId || context.summonedPlayerId !== opponent.id) return opponent;
  return { ...opponent, activeEntities: opponent.activeEntities.map((entity) => (entity.instanceId === context.summonedInstanceId ? { ...entity, mode: "ATTACK", modeLock: "ATTACK" } : entity)) };
}

function destroyAttackerIfPresent(opponent: IPlayer, context?: ITrapTriggerContext): { opponent: IPlayer; cardId: string | null; slotIndex: number | null } {
  if (!context?.attackerPlayerId || !context.attackerInstanceId || context.attackerPlayerId !== opponent.id) return { opponent, cardId: null, slotIndex: null };
  const attackerIndex = opponent.activeEntities.findIndex((entity) => entity.instanceId === context.attackerInstanceId);
  const attacker = attackerIndex >= 0 ? opponent.activeEntities[attackerIndex] : null;
  if (!attacker) return { opponent, cardId: null, slotIndex: null };
  return {
    opponent: { ...opponent, activeEntities: opponent.activeEntities.filter((entity) => entity.instanceId !== context.attackerInstanceId), destroyedPile: [...(opponent.destroyedPile ?? []), attacker.card] },
    cardId: attacker.card.id,
    slotIndex: attackerIndex,
  };
}

function resolveBlockedTargetEntityInstanceId(context?: ITrapTriggerContext): string | null {
  if (context?.attackerInstanceId) return context.attackerInstanceId;
  if (context?.summonedInstanceId) return context.summonedInstanceId;
  return null;
}

const trapEffectHandlers: { [K in TrapAction]: TrapHandler<K> } = {
  DAMAGE: (player, opponent, _trap, effect) => effect.target === "PLAYER" ? { ...createNeutralResult({ ...player, healthPoints: Math.max(0, player.healthPoints - effect.value) }, opponent), damage: effect.value } : { ...createNeutralResult(player, { ...opponent, healthPoints: Math.max(0, opponent.healthPoints - effect.value) }), damage: effect.value },
  REDUCE_OPPONENT_ATTACK: (player, opponent, _trap, effect) => {
    const reduced = reduceOpponentStat(opponent, "attack", effect.value);
    return { ...createNeutralResult(player, reduced.opponent), buffTargetEntityIds: reduced.targetIds, buffStat: "ATTACK", buffAmount: -Math.abs(effect.value) };
  },
  REDUCE_OPPONENT_DEFENSE: (player, opponent, _trap, effect) => {
    const reduced = reduceOpponentStat(opponent, "defense", effect.value);
    return { ...createNeutralResult(player, reduced.opponent), buffTargetEntityIds: reduced.targetIds, buffStat: "DEFENSE", buffAmount: -Math.abs(effect.value) };
  },
  NEGATE_ATTACK_AND_DESTROY_ATTACKER: (player, opponent, _trap, _effect, context) => {
    const destroyed = destroyAttackerIfPresent(opponent, context);
    return {
      ...createNeutralResult(player, destroyed.opponent),
      blockedTargetEntityInstanceId: resolveBlockedTargetEntityInstanceId(context),
      destroyedOpponentEntityCardId: destroyed.cardId,
      destroyedOpponentEntityInstanceId: context?.attackerInstanceId ?? null,
      destroyedOpponentEntitySlotIndex: destroyed.slotIndex,
      destroyedOpponentEntityDestination: destroyed.cardId ? "DESTROYED" : null,
    };
  },
  COPY_OPPONENT_BUFF_TO_ALLIED_ENTITIES: (player, opponent, _trap, _effect, context) => {
    if (!context?.buffSourcePlayerId || context.buffSourcePlayerId !== opponent.id) return createNeutralResult(player, opponent);
    if (!context.buffStat || typeof context.buffAmount !== "number") return createNeutralResult(player, opponent);
    const boosted = applyBuffToAlliedEntities(player, context.buffStat, context.buffAmount);
    return { ...createNeutralResult(boosted.player, opponent), buffTargetEntityIds: boosted.targetIds, buffStat: context.buffStat, buffAmount: context.buffAmount };
  },
  FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED: (player, opponent, _trap, _effect, context) => ({ ...createNeutralResult(player, forceSummonedDefenseToAttackLocked(opponent, context)), blockedTargetEntityInstanceId: resolveBlockedTargetEntityInstanceId(context) }),
  DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN: (player, opponent, _trap, _effect, context) => {
    if (!context?.attackerPlayerId || context.attackerPlayerId !== opponent.id) return createNeutralResult(player, opponent);
    const energyLostAmount = Math.max(0, opponent.currentEnergy);
    const energyGainAmount = Math.max(0, 10 - player.currentEnergy);
    return {
      ...createNeutralResult(
        { ...player, maxEnergy: Math.max(player.maxEnergy, 10), currentEnergy: 10 },
        { ...opponent, currentEnergy: 0 },
      ),
      energyLostTargetPlayerId: opponent.id,
      energyLostAmount,
      energyGainTargetPlayerId: player.id,
      energyGainAmount,
    };
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
