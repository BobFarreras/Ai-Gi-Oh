// src/core/use-cases/game-engine/actions/internal/execution-effect-registry.ts - Registro de handlers de efectos EXECUTION para extensión segura por acción.
import { CardArchetype, ICardEffect } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { boostArchetypeStat, boostBestAlliedAttack } from "@/core/use-cases/game-engine/actions/internal/execution-effect-buffs";
import { IExecutionEffectResult } from "@/core/use-cases/game-engine/actions/internal/execution-effects";
import {
  boostAttackByCardId,
  boostDefenseByCardId,
  createBaseResult,
  destroyOpponentTraps,
  discardOpponentHandCards,
  drawCards,
  reduceOpponentEntitiesAttack,
  restoreEnergy,
  setCardDuelProgress,
  setDefenseByCardId,
} from "@/core/use-cases/game-engine/actions/internal/execution-effect-registry-helpers";

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
  | "BOOST_ATTACK_BY_CARD_ID"
  | "DAMAGE_IF_ALLY_ON_BOARD"
  | "APPLY_NO_DIRECT_ATTACKS"
  | "DRAIN_OPPONENT_ENERGY"
  | "SET_CARD_DUEL_PROGRESS"
  | "REDUCE_OPPONENT_ATTACK"
  | "DESTROY_ALL_TRAPS"
  | "DISCARD_OPPONENT_HAND_CARD"
  | "GRANT_EXTRA_SUMMON"
  | "SWAP_HANDS"
  | "SWAP_BOARD_ENTITIES";
type ExecutionEffect = Extract<ICardEffect, { action: ExecutionAction }>;

type ExecutionHandler<K extends ExecutionAction> = (player: IPlayer, opponent: IPlayer, effect: Extract<ExecutionEffect, { action: K }>) => IExecutionEffectResult;

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
  BOOST_ATTACK_BY_CARD_ID: (player, opponent, effect) => {
    const boosted = boostAttackByCardId(player, effect.targetCardId, effect.value);
    return { ...createBaseResult(boosted.updatedPlayer, opponent), buff: { entityIds: boosted.buffIds, stat: "ATTACK", amount: effect.value } };
  },
  DAMAGE_IF_ALLY_ON_BOARD: (player, opponent, effect) => {
    // Solo golpea si el jugador tiene en campo la entity requerida; si no, la magia se consume sin efecto.
    const hasRequiredAlly = player.activeEntities.some((entity) => entity.card.id === effect.requiredCardId);
    if (!hasRequiredAlly) return createBaseResult(player, opponent);
    return {
      ...createBaseResult(player, { ...opponent, healthPoints: Math.max(0, opponent.healthPoints - effect.value) }),
      damageTargetPlayerId: opponent.id,
      damageAmount: effect.value,
    };
  },
  APPLY_NO_DIRECT_ATTACKS: (player, opponent, effect) => ({
    ...createBaseResult(player, opponent),
    addedStatusEffects: [{ kind: "NO_DIRECT_ATTACKS", targetPlayerId: opponent.id, remainingTurns: Math.max(1, Math.trunc(effect.turns)) }],
  }),
  DRAIN_OPPONENT_ENERGY: (player, opponent) => {
    const drainedAmount = Math.max(0, opponent.currentEnergy);
    return {
      ...createBaseResult(player, { ...opponent, currentEnergy: 0 }),
      energyDrainedTargetPlayerId: opponent.id,
      energyDrainedAmount: drainedAmount,
    };
  },
  SET_CARD_DUEL_PROGRESS: (player, opponent, effect) => createBaseResult(setCardDuelProgress(player, effect.targetCardId, effect.level, effect.versionTier), opponent),
  REDUCE_OPPONENT_ATTACK: (player, opponent, effect) => {
    const reduced = reduceOpponentEntitiesAttack(opponent, effect.value);
    return { ...createBaseResult(player, reduced.updatedOpponent), buff: { entityIds: reduced.targetIds, stat: "ATTACK", amount: -Math.abs(effect.value) } };
  },
  DESTROY_ALL_TRAPS: (player, opponent) => {
    const destroyed = destroyOpponentTraps(opponent);
    return {
      ...createBaseResult(player, destroyed.updatedOpponent),
      systemEvents: destroyed.destroyedCardIds.map((cardId) => ({ eventType: "CARD_TO_GRAVEYARD" as const, payload: { cardId, ownerPlayerId: destroyed.updatedOpponent.id, from: "EXECUTION_ZONE" } })),
    };
  },
  DISCARD_OPPONENT_HAND_CARD: (player, opponent, effect) => {
    const discarded = discardOpponentHandCards(opponent, effect.count ?? 1);
    return {
      ...createBaseResult(player, discarded.updatedOpponent),
      systemEvents: discarded.discardedCardIds.map((cardId) => ({ eventType: "CARD_TO_GRAVEYARD" as const, payload: { cardId, ownerPlayerId: discarded.updatedOpponent.id, from: "HAND" } })),
    };
  },
  // Núcleo de Datos: concede invocaciones normales EXTRA este turno (se aplican al contador de GameState).
  GRANT_EXTRA_SUMMON: (player, opponent, effect) => ({
    ...createBaseResult(player, opponent),
    grantedExtraSummons: Math.max(1, Math.trunc(effect.count ?? 1)),
  }),
  // Terminal Córtice: intercambia las manos completas de ambos jugadores.
  SWAP_HANDS: (player, opponent) => createBaseResult({ ...player, hand: opponent.hand }, { ...opponent, hand: player.hand }),
  // reaq m: intercambia las entities del tablero. Las que recibe el jugador activo quedan "usadas"
  // (no pueden atacar el turno en que cambian de control), para evitar un swing inmediato.
  SWAP_BOARD_ENTITIES: (player, opponent) => createBaseResult(
    { ...player, activeEntities: opponent.activeEntities.map((entity) => ({ ...entity, hasAttackedThisTurn: true, isNewlySummoned: false })) },
    { ...opponent, activeEntities: player.activeEntities },
  ),
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
  if (effect.action === "BOOST_ATTACK_BY_CARD_ID") return executionEffectHandlers.BOOST_ATTACK_BY_CARD_ID(player, opponent, effect);
  if (effect.action === "DAMAGE_IF_ALLY_ON_BOARD") return executionEffectHandlers.DAMAGE_IF_ALLY_ON_BOARD(player, opponent, effect);
  if (effect.action === "APPLY_NO_DIRECT_ATTACKS") return executionEffectHandlers.APPLY_NO_DIRECT_ATTACKS(player, opponent, effect);
  if (effect.action === "DRAIN_OPPONENT_ENERGY") return executionEffectHandlers.DRAIN_OPPONENT_ENERGY(player, opponent, effect);
  if (effect.action === "SET_CARD_DUEL_PROGRESS") return executionEffectHandlers.SET_CARD_DUEL_PROGRESS(player, opponent, effect);
  if (effect.action === "REDUCE_OPPONENT_ATTACK") return executionEffectHandlers.REDUCE_OPPONENT_ATTACK(player, opponent, effect);
  if (effect.action === "DESTROY_ALL_TRAPS") return executionEffectHandlers.DESTROY_ALL_TRAPS(player, opponent, effect);
  if (effect.action === "DISCARD_OPPONENT_HAND_CARD") return executionEffectHandlers.DISCARD_OPPONENT_HAND_CARD(player, opponent, effect);
  if (effect.action === "GRANT_EXTRA_SUMMON") return executionEffectHandlers.GRANT_EXTRA_SUMMON(player, opponent, effect);
  if (effect.action === "SWAP_HANDS") return executionEffectHandlers.SWAP_HANDS(player, opponent, effect);
  if (effect.action === "SWAP_BOARD_ENTITIES") return executionEffectHandlers.SWAP_BOARD_ENTITIES(player, opponent, effect);
  return null;
}

export function getRegisteredExecutionActions(): ReadonlyArray<ExecutionAction> {
  return Object.keys(executionEffectHandlers) as ExecutionAction[];
}
