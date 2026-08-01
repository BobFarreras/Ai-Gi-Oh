// src/core/services/survival/apply-survival-ascension.ts - Refuerza cartas rivales en vueltas posteriores al cap de tier.
import { ICard } from "@/core/entities/ICard";
import { getMaxCardLevel } from "@/core/services/progression/card-level-rules";
import { MAX_CARD_VERSION_TIER } from "@/core/services/progression/card-version-rules";

// Topes del juego, no de Supervivencia: copiarlos aquí los dejó clavados en 30 cuando el máximo subió a 100.
const MAX_CARD_LEVEL = getMaxCardLevel();
const MAX_VERSION_TIER = MAX_CARD_VERSION_TIER;

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
