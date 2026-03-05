// src/core/services/progression/card-level-bonus-rules.ts - Reglas de bonus por nivel según tipo de carta.
import { CardType } from "@/core/entities/ICard";

export interface ICardLevelBonuses {
  attackBonus: number;
  defenseBonus: number;
  energyCostReduction: number;
}

function resolveEntityBonuses(level: number): ICardLevelBonuses {
  let attackBonus = 0;
  let defenseBonus = 0;
  if (level >= 5) attackBonus += 100;
  if (level >= 10) defenseBonus += 100;
  if (level >= 20) {
    attackBonus += 200;
    defenseBonus += 200;
  }
  return { attackBonus, defenseBonus, energyCostReduction: level >= 30 ? 1 : 0 };
}

export function resolveCardLevelBonuses(cardType: CardType, level: number): ICardLevelBonuses {
  const safeLevel = Number.isFinite(level) ? Math.max(0, Math.floor(level)) : 0;
  if (cardType === "ENTITY") return resolveEntityBonuses(safeLevel);
  return { attackBonus: 0, defenseBonus: 0, energyCostReduction: safeLevel >= 30 ? 1 : 0 };
}

