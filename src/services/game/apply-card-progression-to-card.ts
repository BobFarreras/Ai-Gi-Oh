// src/services/game/apply-card-progression-to-card.ts - Aplica bonus de nivel a una carta para su uso en combate sin mutar el catálogo base.
import { ICard, CardType } from "@/core/entities/ICard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { resolveCardLevelBonuses } from "@/core/services/progression/card-level-bonus-rules";

function resolveCombatCost(cost: number, cardType: CardType, level: number): number {
  const bonuses = resolveCardLevelBonuses(cardType, level);
  return Math.max(1, cost - bonuses.energyCostReduction);
}

export function applyCardProgressionToCard(card: ICard, progress: IPlayerCardProgress | null): ICard {
  const level = progress?.level ?? 0;
  const bonuses = resolveCardLevelBonuses(card.type, level);
  return {
    ...card,
    cost: resolveCombatCost(card.cost, card.type, level),
    attack: typeof card.attack === "number" ? card.attack + bonuses.attackBonus : card.attack,
    defense: typeof card.defense === "number" ? card.defense + bonuses.defenseBonus : card.defense,
  };
}

