// src/core/use-cases/game-engine/actions/internal/execution-effect-registry-helpers.ts - Agrupa utilidades puras del registry EXECUTION para mantener SRP en el módulo principal.
import { IPlayer } from "@/core/entities/IPlayer";
import { IExecutionEffectResult } from "@/core/use-cases/game-engine/actions/internal/execution-effects";
import { resolveMasteryPassiveLabel } from "@/core/services/progression/mastery-passive-display";

export function createBaseResult(player: IPlayer, opponent: IPlayer): IExecutionEffectResult {
  return {
    player,
    opponent,
    healApplied: 0,
    energyRecovered: 0,
    energyDrainedTargetPlayerId: null,
    energyDrainedAmount: 0,
    buff: { entityIds: [], stat: null, amount: 0 },
    damageTargetPlayerId: null,
    damageAmount: 0,
    systemEvents: [],
  };
}

export function drawCards(player: IPlayer, amount: number): IPlayer {
  const drawAmount = Math.max(0, Math.min(amount, player.deck.length));
  if (drawAmount === 0) return player;
  return { ...player, hand: [...player.hand, ...player.deck.slice(0, drawAmount)], deck: player.deck.slice(drawAmount) };
}

export function setDefenseByCardId(player: IPlayer, targetCardId: string, value: number): { updatedPlayer: IPlayer; buffIds: string[] } {
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

export function boostDefenseByCardId(player: IPlayer, targetCardId: string, value: number): { updatedPlayer: IPlayer; buffIds: string[] } {
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

export function boostAttackByCardId(player: IPlayer, targetCardId: string, value: number): { updatedPlayer: IPlayer; buffIds: string[] } {
  const delta = Math.max(0, value);
  const buffIds = player.activeEntities.filter((entity) => entity.card.id === targetCardId).map((entity) => entity.instanceId);
  if (buffIds.length === 0 || delta === 0) return { updatedPlayer: player, buffIds: [] };
  return {
    updatedPlayer: {
      ...player,
      activeEntities: player.activeEntities.map((entity) => (
        entity.card.id === targetCardId
          ? { ...entity, card: { ...entity.card, attack: Math.max(0, (entity.card.attack ?? 0) + delta) } }
          : entity
      )),
    },
    buffIds,
  };
}

export function setCardDuelProgress(player: IPlayer, targetCardId: string, level: number, versionTier: number): IPlayer {
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

/** Baja el ataque de todas las entities rivales (mínimo 0). Devuelve los instanceId afectados. */
export function reduceOpponentEntitiesAttack(opponent: IPlayer, value: number): { updatedOpponent: IPlayer; targetIds: string[] } {
  const delta = Math.max(0, value);
  const targetIds = opponent.activeEntities.filter((entity) => (entity.card.attack ?? 0) > 0).map((entity) => entity.instanceId);
  if (delta === 0 || targetIds.length === 0) return { updatedOpponent: opponent, targetIds: [] };
  return {
    updatedOpponent: {
      ...opponent,
      activeEntities: opponent.activeEntities.map((entity) => ({
        ...entity,
        card: { ...entity.card, attack: Math.max(0, (entity.card.attack ?? 0) - delta) },
      })),
    },
    targetIds,
  };
}

/** Manda al cementerio todas las trampas puestas del rival (zona de ejecuciones). */
export function destroyOpponentTraps(opponent: IPlayer): { updatedOpponent: IPlayer; destroyedCardIds: string[] } {
  const traps = opponent.activeExecutions.filter((entity) => entity.card.type === "TRAP");
  if (traps.length === 0) return { updatedOpponent: opponent, destroyedCardIds: [] };
  return {
    updatedOpponent: {
      ...opponent,
      activeExecutions: opponent.activeExecutions.filter((entity) => entity.card.type !== "TRAP"),
      graveyard: [...opponent.graveyard, ...traps.map((entity) => entity.card)],
    },
    destroyedCardIds: traps.map((entity) => entity.card.id),
  };
}

/** Descarta al cementerio las N cartas más antiguas de la mano del rival (determinista). */
export function discardOpponentHandCards(opponent: IPlayer, count: number): { updatedOpponent: IPlayer; discardedCardIds: string[] } {
  const discardCount = Math.max(0, Math.min(count, opponent.hand.length));
  if (discardCount === 0) return { updatedOpponent: opponent, discardedCardIds: [] };
  const discarded = opponent.hand.slice(0, discardCount);
  return {
    updatedOpponent: {
      ...opponent,
      hand: opponent.hand.slice(discardCount),
      graveyard: [...opponent.graveyard, ...discarded],
    },
    discardedCardIds: discarded.map((card) => card.id),
  };
}

export function restoreEnergy(player: IPlayer, requestedValue?: number): { updatedPlayer: IPlayer; recoveredAmount: number } {
  const missingEnergy = player.maxEnergy - player.currentEnergy;
  if (missingEnergy <= 0) return { updatedPlayer: player, recoveredAmount: 0 };
  const recoveredAmount = requestedValue ? Math.min(missingEnergy, Math.max(0, requestedValue)) : missingEnergy;
  return { updatedPlayer: { ...player, currentEnergy: player.currentEnergy + recoveredAmount }, recoveredAmount };
}
