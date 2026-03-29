// src/core/use-cases/game-engine/actions/internal/execution-effect-registry.ts - Registro de handlers de efectos EXECUTION para extensión segura por acción.
import { CardArchetype, ICardEffect } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { boostArchetypeStat, boostBestAlliedAttack } from "@/core/use-cases/game-engine/actions/internal/execution-effect-buffs";
import { IExecutionEffectResult } from "@/core/use-cases/game-engine/actions/internal/execution-effects";
import { resolveMasteryPassiveLabel } from "@/core/services/progression/mastery-passive-display";

type ExecutionAction =
  | "DAMAGE"
  | "HEAL"
  | "DRAW_CARD"
  | "RESTORE_ENERGY"
  | "BOOST_ATTACK_ALLIED_ENTITY"
  | "BOOST_DEFENSE_BY_ARCHETYPE"
  | "BOOST_ATTACK_BY_ARCHETYPE"
  | "SET_DEFENSE_BY_CARD_ID"
  | "BOOST_DEFENSE_BY_CARD_ID"
  | "DRAIN_OPPONENT_ENERGY"
  | "SET_CARD_DUEL_PROGRESS";
type ExecutionEffect = Extract<ICardEffect, { action: ExecutionAction }>;

type ExecutionHandler<K extends ExecutionAction> = (player: IPlayer, opponent: IPlayer, effect: Extract<ExecutionEffect, { action: K }>) => IExecutionEffectResult;

function createBaseResult(player: IPlayer, opponent: IPlayer): IExecutionEffectResult {
  return {
    player,
    opponent,
    healApplied: 0,
    energyRecovered: 0,
    buff: { entityIds: [], stat: null, amount: 0 },
    damageTargetPlayerId: null,
    damageAmount: 0,
    systemEvents: [],
  };
}

function drawCards(player: IPlayer, amount: number): IPlayer {
  const drawAmount = Math.max(0, Math.min(amount, player.deck.length));
  if (drawAmount === 0) return player;
  return { ...player, hand: [...player.hand, ...player.deck.slice(0, drawAmount)], deck: player.deck.slice(drawAmount) };
}

function setDefenseByCardId(player: IPlayer, targetCardId: string, value: number): { updatedPlayer: IPlayer; buffIds: string[] } {
  const nextDefense = Math.max(0, value);
  const buffIds = player.activeEntities.filter((entity) => entity.card.id === targetCardId).map((entity) => entity.instanceId);
  if (buffIds.length === 0) return { updatedPlayer: player, buffIds: [] };
  return {
    updatedPlayer: {
      ...player,
      activeEntities: player.activeEntities.map((entity) => (
        entity.card.id === targetCardId
          ? { ...entity, card: { ...entity.card, defense: nextDefense } }
          : entity
      )),
    },
    buffIds,
  };
}

function boostDefenseByCardId(player: IPlayer, targetCardId: string, value: number): { updatedPlayer: IPlayer; buffIds: string[] } {
  const delta = Math.max(0, value);
  const buffIds = player.activeEntities.filter((entity) => entity.card.id === targetCardId).map((entity) => entity.instanceId);
  if (buffIds.length === 0 || delta === 0) return { updatedPlayer: player, buffIds: [] };
  return {
    updatedPlayer: {
      ...player,
      activeEntities: player.activeEntities.map((entity) => (
        entity.card.id === targetCardId
          ? { ...entity, card: { ...entity.card, defense: Math.max(0, (entity.card.defense ?? 0) + delta) } }
          : entity
      )),
    },
    buffIds,
  };
}

function setCardDuelProgress(player: IPlayer, targetCardId: string, level: number, versionTier: number): IPlayer {
  const normalizedLevel = Math.max(1, Math.floor(level));
  const normalizedVersionTier = Math.max(1, Math.floor(versionTier));
  const resolveTemporaryMasteryPassiveId = (cardId: string): string | null => {
    if (cardId === "entity-duckduckgo") return "passive-attack-energy-plus-1";
    return null;
  };
  const updateCard = <TCard extends { id: string; level?: number; versionTier?: number; masteryPassiveSkillId?: string | null; masteryPassiveLabel?: string | null }>(card: TCard): TCard => {
    if (card.id !== targetCardId) return card;
    const masteryPassiveSkillId = normalizedVersionTier >= 5
      ? card.masteryPassiveSkillId ?? resolveTemporaryMasteryPassiveId(card.id)
      : card.masteryPassiveSkillId ?? null;
    return {
      ...card,
      level: normalizedLevel,
      versionTier: normalizedVersionTier,
      masteryPassiveSkillId,
      masteryPassiveLabel: normalizedVersionTier >= 5 ? resolveMasteryPassiveLabel(masteryPassiveSkillId ?? "unknown-passive-id") : null,
    };
  };
  return {
    ...player,
    deck: player.deck.map((card) => updateCard(card)),
    hand: player.hand.map((card) => updateCard(card)),
    graveyard: player.graveyard.map((card) => updateCard(card)),
    destroyedPile: (player.destroyedPile ?? []).map((card) => updateCard(card)),
    activeEntities: player.activeEntities.map((entity) => ({ ...entity, card: updateCard(entity.card) })),
    activeExecutions: player.activeExecutions.map((entity) => ({ ...entity, card: updateCard(entity.card) })),
  };
}

function restoreEnergy(player: IPlayer, requestedValue?: number): { updatedPlayer: IPlayer; recoveredAmount: number } {
  const missingEnergy = player.maxEnergy - player.currentEnergy;
  if (missingEnergy <= 0) return { updatedPlayer: player, recoveredAmount: 0 };
  const recoveredAmount = requestedValue ? Math.min(missingEnergy, Math.max(0, requestedValue)) : missingEnergy;
  return { updatedPlayer: { ...player, currentEnergy: player.currentEnergy + recoveredAmount }, recoveredAmount };
}

const executionEffectHandlers: { [K in ExecutionAction]: ExecutionHandler<K> } = {
  DAMAGE: (player, opponent, effect) => effect.target === "OPPONENT"
    ? { ...createBaseResult(player, { ...opponent, healthPoints: Math.max(0, opponent.healthPoints - effect.value) }), damageTargetPlayerId: opponent.id, damageAmount: effect.value }
    : { ...createBaseResult({ ...player, healthPoints: Math.max(0, player.healthPoints - effect.value) }, opponent), damageTargetPlayerId: player.id, damageAmount: effect.value },
  HEAL: (player, opponent, effect) => {
    const nextHealth = Math.min(player.maxHealthPoints, player.healthPoints + effect.value);
    return { ...createBaseResult({ ...player, healthPoints: nextHealth }, opponent), healApplied: Math.max(0, nextHealth - player.healthPoints) };
  },
  DRAW_CARD: (player, opponent, effect) => createBaseResult(drawCards(player, effect.cards), opponent),
  RESTORE_ENERGY: (player, opponent, effect) => {
    const recovered = restoreEnergy(player, effect.value);
    return { ...createBaseResult(recovered.updatedPlayer, opponent), energyRecovered: recovered.recoveredAmount };
  },
  BOOST_ATTACK_ALLIED_ENTITY: (player, opponent, effect) => {
    const boosted = boostBestAlliedAttack(player, effect.value);
    return { ...createBaseResult(boosted.updatedPlayer, opponent), buff: { entityIds: boosted.buffIds, stat: "ATTACK", amount: effect.value } };
  },
  BOOST_DEFENSE_BY_ARCHETYPE: (player, opponent, effect) => {
    const boosted = boostArchetypeStat(player, "DEFENSE", effect.archetype as CardArchetype, effect.value);
    return { ...createBaseResult(boosted.updatedPlayer, opponent), buff: { entityIds: boosted.buffIds, stat: "DEFENSE", amount: effect.value } };
  },
  BOOST_ATTACK_BY_ARCHETYPE: (player, opponent, effect) => {
    const boosted = boostArchetypeStat(player, "ATTACK", effect.archetype as CardArchetype, effect.value);
    return { ...createBaseResult(boosted.updatedPlayer, opponent), buff: { entityIds: boosted.buffIds, stat: "ATTACK", amount: effect.value } };
  },
  SET_DEFENSE_BY_CARD_ID: (player, opponent, effect) => {
    const boosted = setDefenseByCardId(player, effect.targetCardId, effect.value);
    return { ...createBaseResult(boosted.updatedPlayer, opponent), buff: { entityIds: boosted.buffIds, stat: "DEFENSE", amount: effect.value } };
  },
  BOOST_DEFENSE_BY_CARD_ID: (player, opponent, effect) => {
    const boosted = boostDefenseByCardId(player, effect.targetCardId, effect.value);
    return { ...createBaseResult(boosted.updatedPlayer, opponent), buff: { entityIds: boosted.buffIds, stat: "DEFENSE", amount: effect.value } };
  },
  DRAIN_OPPONENT_ENERGY: (player, opponent) => createBaseResult(player, { ...opponent, currentEnergy: 0 }),
  SET_CARD_DUEL_PROGRESS: (player, opponent, effect) => createBaseResult(setCardDuelProgress(player, effect.targetCardId, effect.level, effect.versionTier), opponent),
};

/** Resuelve una acción EXECUTION registrada; devuelve null cuando la acción no pertenece al registry. */
export function resolveExecutionEffectFromRegistry(player: IPlayer, opponent: IPlayer, effect: ICardEffect): IExecutionEffectResult | null {
  if (
    effect.action === "RETURN_GRAVEYARD_CARD_TO_HAND"
    || effect.action === "RETURN_GRAVEYARD_CARD_TO_FIELD"
    || effect.action === "REVEAL_OPPONENT_SET_CARD"
    || effect.action === "STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND"
  ) {
    throw new GameRuleError("Este efecto requiere selección manual y se resuelve en una acción pendiente.");
  }
  if (effect.action === "DAMAGE") return executionEffectHandlers.DAMAGE(player, opponent, effect);
  if (effect.action === "HEAL") return executionEffectHandlers.HEAL(player, opponent, effect);
  if (effect.action === "DRAW_CARD") return executionEffectHandlers.DRAW_CARD(player, opponent, effect);
  if (effect.action === "RESTORE_ENERGY") return executionEffectHandlers.RESTORE_ENERGY(player, opponent, effect);
  if (effect.action === "BOOST_ATTACK_ALLIED_ENTITY") return executionEffectHandlers.BOOST_ATTACK_ALLIED_ENTITY(player, opponent, effect);
  if (effect.action === "BOOST_DEFENSE_BY_ARCHETYPE") return executionEffectHandlers.BOOST_DEFENSE_BY_ARCHETYPE(player, opponent, effect);
  if (effect.action === "BOOST_ATTACK_BY_ARCHETYPE") return executionEffectHandlers.BOOST_ATTACK_BY_ARCHETYPE(player, opponent, effect);
  if (effect.action === "SET_DEFENSE_BY_CARD_ID") return executionEffectHandlers.SET_DEFENSE_BY_CARD_ID(player, opponent, effect);
  if (effect.action === "BOOST_DEFENSE_BY_CARD_ID") return executionEffectHandlers.BOOST_DEFENSE_BY_CARD_ID(player, opponent, effect);
  if (effect.action === "DRAIN_OPPONENT_ENERGY") return executionEffectHandlers.DRAIN_OPPONENT_ENERGY(player, opponent, effect);
  if (effect.action === "SET_CARD_DUEL_PROGRESS") return executionEffectHandlers.SET_CARD_DUEL_PROGRESS(player, opponent, effect);
  return null;
}

export function getRegisteredExecutionActions(): ReadonlyArray<ExecutionAction> {
  return Object.keys(executionEffectHandlers) as ExecutionAction[];
}
