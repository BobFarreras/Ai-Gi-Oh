// src/core/use-cases/game-engine/actions/internal/execution-effects.ts - Aplica efectos de ejecución sobre estado de jugadores y expone eventos sistémicos.
import { ICardEffect } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import {
  boostArchetypeStat,
  boostBestAlliedAttack,
} from "@/core/use-cases/game-engine/actions/internal/execution-effect-buffs";
import { IExecutionSystemEvent } from "@/core/use-cases/game-engine/actions/internal/execution-return-effects";

interface IBuffSummary {
  entityIds: string[];
  stat: "ATTACK" | "DEFENSE" | null;
  amount: number;
}

export interface IExecutionEffectResult {
  player: IPlayer;
  opponent: IPlayer;
  healApplied: number;
  buff: IBuffSummary;
  damageTargetPlayerId: string | null;
  damageAmount: number;
  systemEvents: IExecutionSystemEvent[];
}

export function applyExecutionEffect(player: IPlayer, opponent: IPlayer, effect: ICardEffect): IExecutionEffectResult {
  let updatedPlayer = player;
  let updatedOpponent = opponent;
  let healApplied = 0;
  const buff: IBuffSummary = { entityIds: [], stat: null, amount: 0 };
  let damageTargetPlayerId: string | null = null;
  let damageAmount = 0;
  const systemEvents: IExecutionSystemEvent[] = [];

  switch (effect.action) {
    case "DAMAGE":
      ({ updatedPlayer, updatedOpponent, damageTargetPlayerId, damageAmount } = applyDamageEffect(updatedPlayer, updatedOpponent, effect.value, effect.target));
      break;
    case "HEAL":
      ({ updatedPlayer, healApplied } = applyHealEffect(updatedPlayer, effect.value));
      break;
    case "DRAW_CARD":
      updatedPlayer = drawCards(updatedPlayer, effect.cards);
      break;
    case "BOOST_ATTACK_ALLIED_ENTITY":
      ({ updatedPlayer, buffIds: buff.entityIds } = boostBestAlliedAttack(updatedPlayer, effect.value));
      buff.stat = "ATTACK";
      buff.amount = effect.value;
      break;
    case "BOOST_DEFENSE_BY_ARCHETYPE":
      ({ updatedPlayer, buffIds: buff.entityIds } = boostArchetypeStat(updatedPlayer, "DEFENSE", effect.archetype, effect.value));
      buff.stat = "DEFENSE";
      buff.amount = effect.value;
      break;
    case "BOOST_ATTACK_BY_ARCHETYPE":
      ({ updatedPlayer, buffIds: buff.entityIds } = boostArchetypeStat(updatedPlayer, "ATTACK", effect.archetype, effect.value));
      buff.stat = "ATTACK";
      buff.amount = effect.value;
      break;
    case "RETURN_GRAVEYARD_CARD_TO_HAND":
    case "RETURN_GRAVEYARD_CARD_TO_FIELD":
      throw new GameRuleError("Este efecto requiere selección de cementerio y se resuelve en una acción pendiente.");
      break;
    default:
      break;
  }

  return { player: updatedPlayer, opponent: updatedOpponent, healApplied, buff, damageTargetPlayerId, damageAmount, systemEvents };
}

function drawCards(player: IPlayer, amount: number): IPlayer {
  const drawAmount = Math.max(0, Math.min(amount, player.deck.length));
  if (drawAmount === 0) return player;
  return { ...player, hand: [...player.hand, ...player.deck.slice(0, drawAmount)], deck: player.deck.slice(drawAmount) };
}

function applyDamageEffect(player: IPlayer, opponent: IPlayer, value: number, target: "OPPONENT" | "PLAYER") {
  if (target === "OPPONENT") {
    return {
      updatedPlayer: player,
      updatedOpponent: { ...opponent, healthPoints: Math.max(0, opponent.healthPoints - value) },
      damageTargetPlayerId: opponent.id,
      damageAmount: value,
    };
  }
  return {
    updatedPlayer: { ...player, healthPoints: Math.max(0, player.healthPoints - value) },
    updatedOpponent: opponent,
    damageTargetPlayerId: player.id,
    damageAmount: value,
  };
}

function applyHealEffect(player: IPlayer, value: number): { updatedPlayer: IPlayer; healApplied: number } {
  const nextHealth = Math.min(player.maxHealthPoints, player.healthPoints + value);
  return { updatedPlayer: { ...player, healthPoints: nextHealth }, healApplied: Math.max(0, nextHealth - player.healthPoints) };
}
