// src/core/services/opponent/heuristic-score.ts - Reglas de puntuación heurística por tipo de carta para decisiones del bot.
import { ICard } from "@/core/entities/ICard";
import { IOpponentDifficultyProfile } from "@/core/services/opponent/difficulty/types";

export function scoreEntity(card: ICard, profile: IOpponentDifficultyProfile): number {
  return ((card.attack ?? 0) * 2 + (card.defense ?? 0) - card.cost * 120) * profile.entityTempoBias;
}

export function scoreExecution(card: ICard, profile: IOpponentDifficultyProfile): number {
  if (!card.effect) return -1000;
  if (card.effect.action === "DAMAGE" && card.effect.target === "OPPONENT") return (card.effect.value * 2 - card.cost * 80) * profile.executionAggroBias;
  if (card.effect.action === "HEAL" && card.effect.target === "PLAYER") return card.effect.value - card.cost * 60;
  return 10 - card.cost * 100;
}

export function scoreTrap(card: ICard): number {
  if (!card.effect || card.effect.action !== "DAMAGE") return 40 - card.cost * 80;
  return card.effect.value - card.cost * 60;
}

export function scoreFusion(card: ICard, profile: IOpponentDifficultyProfile): number {
  const body = (card.attack ?? 0) * 2.1 + (card.defense ?? 0) * 1.2;
  return body * profile.entityTempoBias - card.cost * 90;
}
