// src/core/services/survival/apply-survival-ascension.ts - Refuerza cartas rivales en vueltas posteriores al cap de tier.
import { ICard } from "@/core/entities/ICard";

const MAX_CARD_LEVEL = 30;
const MAX_VERSION_TIER = 5;

/**
 * Mantiene nivel y versión dentro de sus caps y prolonga la dificultad mediante stats de entidades.
 */
export function applySurvivalAscension(
  deck: ICard[],
  ascensionRank: number,
  statBonusPerRank: number,
): ICard[] {
  const safeRank = Math.max(0, Math.floor(ascensionRank));
  const statBonus = safeRank * Math.max(0, statBonusPerRank);
  return deck.map((card) => ({
    ...card,
    level: Math.min(MAX_CARD_LEVEL, (card.level ?? 0) + safeRank * 2),
    versionTier: Math.min(MAX_VERSION_TIER, (card.versionTier ?? 0) + Math.floor(safeRank / 2)),
    ...(card.type === "ENTITY" ? {
      attack: (card.attack ?? 0) + statBonus,
      defense: (card.defense ?? 0) + statBonus,
    } : {}),
  }));
}
