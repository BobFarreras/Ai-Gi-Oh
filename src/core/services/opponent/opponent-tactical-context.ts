// src/core/services/opponent/opponent-tactical-context.ts - Utilidades tácticas para decidir presión, protección y tempo en la IA rival.
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { IOpponentDifficultyProfile } from "@/core/services/opponent/difficulty/types";
import { IStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";

function rivalBestAttack(target: IPlayer): number {
  return target.activeEntities.reduce((best, entity) => Math.max(best, entity.card.attack ?? 0), 0);
}

function hasSetTargets(target: IPlayer): boolean {
  return target.activeEntities.some((entity) => entity.mode === "SET");
}

function isProtectionTrap(card: ICard): boolean {
  if (card.type !== "TRAP") return false;
  return card.trigger === "ON_OPPONENT_ATTACK_DECLARED" || card.trigger === "ON_OPPONENT_DIRECT_ATTACK_DECLARED";
}

function hasProtectionInHand(opponent: IPlayer): boolean {
  return opponent.hand.some((card) => isProtectionTrap(card));
}

function isDefensiveExecution(card: ICard): boolean {
  if (card.type !== "EXECUTION" || !card.effect) return false;
  return card.effect.action === "BOOST_DEFENSE_BY_ARCHETYPE" || card.effect.action === "BOOST_DEFENSE_BY_CARD_ID" || card.effect.action === "SET_DEFENSE_BY_CARD_ID";
}

function hasTrapAlreadySet(opponent: IPlayer): boolean {
  return opponent.activeExecutions.some((entity) => entity.card.type === "TRAP");
}

/**
 * Decide si conviene esperar antes de exponer un atacante frágil en mesa.
 */
export function shouldHoldFragileFrontline(input: {
  card: ICard;
  mode: "ATTACK" | "DEFENSE" | "SET" | "ACTIVATE";
  opponent: IPlayer;
  target: IPlayer;
  profile: IOpponentDifficultyProfile;
  aiProfile: IStoryAiProfile;
}): boolean {
  if (input.card.type !== "ENTITY" && input.card.type !== "FUSION") return false;
  if (input.mode !== "ATTACK") return false;
  if (input.profile.key === "EASY" || input.profile.key === "NORMAL") return false;
  const bestThreat = rivalBestAttack(input.target);
  const attack = input.card.attack ?? 0;
  const defense = input.card.defense ?? 0;
  const fragile = bestThreat >= Math.max(attack, defense) + 150;
  if (!fragile) return false;
  const cautiousStyle = input.aiProfile.style === "control" || input.aiProfile.aggression < 0.52;
  if (!cautiousStyle) return false;
  const canPrepareProtection = hasProtectionInHand(input.opponent) || input.opponent.hand.some((card) => isDefensiveExecution(card));
  return canPrepareProtection && input.opponent.activeEntities.length === 0;
}

/**
 * Ajuste de score por contexto táctico para evitar decisiones planas.
 */
export function resolveTacticalCardBonus(input: {
  card: ICard;
  mode: "ATTACK" | "DEFENSE" | "SET" | "ACTIVATE";
  opponent: IPlayer;
  target: IPlayer;
  aiProfile: IStoryAiProfile;
}): number {
  if (input.card.type === "TRAP") {
    const pressure = input.target.activeEntities.length > 0 ? 320 : 0;
    const protectionNeed = input.opponent.healthPoints <= Math.floor(input.opponent.maxHealthPoints * 0.5) ? 280 : 0;
    const antiSetBonus = hasSetTargets(input.target) ? 120 : 0;
    const slotBonus = hasTrapAlreadySet(input.opponent) ? 0 : 180;
    return pressure + protectionNeed + antiSetBonus + slotBonus;
  }
  if (input.card.type === "ENTITY" || input.card.type === "FUSION") {
    const bestThreat = rivalBestAttack(input.target);
    const attack = input.card.attack ?? 0;
    const defense = input.card.defense ?? 0;
    const defenseStabilize = input.mode === "DEFENSE" && defense >= bestThreat && bestThreat > attack ? 360 : 0;
    const pressureSet = input.mode === "ATTACK" && hasSetTargets(input.target) ? 220 : 0;
    return defenseStabilize + pressureSet;
  }
  return 0;
}
