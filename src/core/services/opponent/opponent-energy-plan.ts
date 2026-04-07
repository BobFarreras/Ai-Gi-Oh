// src/core/services/opponent/opponent-energy-plan.ts - Decide cuándo la IA rival debe guardar energía para combos de alto impacto.
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { IOpponentDifficultyProfile } from "@/core/services/opponent/difficulty/types";
import { IStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import type { IPlayableCardDecision } from "@/core/services/opponent/select-opponent-play";

function rivalBestAttack(target: IPlayer): number {
  return target.activeEntities.reduce((best, entity) => Math.max(best, entity.card.attack ?? 0), 0);
}

function isHighImpactEntity(card: ICard): boolean {
  if (card.type !== "ENTITY" && card.type !== "FUSION") return false;
  const attack = card.attack ?? 0;
  return card.cost >= 5 || attack >= 2400;
}

function isHighImpactExecution(card: ICard): boolean {
  if (card.type !== "EXECUTION" || !card.effect) return false;
  return (
    (card.effect.action === "DAMAGE" && card.effect.target === "OPPONENT" && card.effect.value >= 1100) ||
    card.effect.action === "DRAIN_OPPONENT_ENERGY" ||
    card.effect.action === "FUSION_SUMMON" ||
    card.effect.action === "DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN"
  );
}

function hasUrgentThreat(target: IPlayer, opponent: IPlayer): boolean {
  const totalRivalAttack = target.activeEntities
    .filter((entity) => entity.mode === "ATTACK")
    .reduce((total, entity) => total + (entity.card.attack ?? 0), 0);
  return totalRivalAttack >= Math.max(2200, opponent.healthPoints - 1200);
}

/**
 * Decide si el bot debe pasar MAIN_1 para conservar energía y habilitar una jugada fuerte en el siguiente turno.
 */
export function shouldSkipPlayForEnergy(input: {
  opponent: IPlayer;
  target: IPlayer;
  profile: IOpponentDifficultyProfile;
  aiProfile: IStoryAiProfile;
  playableDecisions: IPlayableCardDecision[];
}): boolean {
  if (input.playableDecisions.length === 0) return false;
  if (input.profile.key === "EASY" || input.profile.key === "NORMAL") return false;
  if (hasUrgentThreat(input.target, input.opponent)) return false;

  const nextTurnEnergy = Math.min(input.opponent.maxEnergy, input.opponent.currentEnergy + 2);
  const hasFusionPlan = input.opponent.hand.some((card) =>
    card.type === "FUSION" &&
    card.cost > input.opponent.currentEnergy &&
    card.cost <= nextTurnEnergy &&
    input.opponent.activeEntities.length >= 2);
  const hasStrongEntityPlan = input.opponent.hand.some((card) =>
    card.type === "ENTITY" &&
    isHighImpactEntity(card) &&
    card.cost > input.opponent.currentEnergy &&
    card.cost <= nextTurnEnergy);
  const hasExecutionComboPlan = input.opponent.hand.some((card) =>
    card.type === "EXECUTION" &&
    isHighImpactExecution(card) &&
    card.cost > input.opponent.currentEnergy &&
    card.cost <= nextTurnEnergy);
  const hasFuturePlan = hasFusionPlan || hasStrongEntityPlan || hasExecutionComboPlan;
  if (!hasFuturePlan) return false;

  const bestPlayable = input.playableDecisions[0];
  if (!bestPlayable) return false;
  const lowTempoEntity =
    (bestPlayable.card.type === "ENTITY" || bestPlayable.card.type === "FUSION") &&
    (bestPlayable.card.attack ?? 0) < 1800 &&
    bestPlayable.mode !== "DEFENSE";
  const setupOnlyCard = bestPlayable.card.type === "TRAP" || bestPlayable.mode === "SET";
  const defensiveStabilize =
    (bestPlayable.card.type === "ENTITY" || bestPlayable.card.type === "FUSION") &&
    bestPlayable.mode === "DEFENSE" &&
    (bestPlayable.card.defense ?? 0) >= rivalBestAttack(input.target);

  const comboStyle = input.aiProfile.style === "combo" || input.aiProfile.style === "control" || input.aiProfile.aggression <= 0.58;
  if (!comboStyle) return false;
  if (defensiveStabilize) return false;
  return lowTempoEntity || setupOnlyCard;
}
